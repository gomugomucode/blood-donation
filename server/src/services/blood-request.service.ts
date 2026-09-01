import { Prisma, RequestStatus, RequestUrgency } from '@prisma/client';
import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import {
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  BloodRequestQueryInput,
} from '../validators/blood-request.validator.js';
import { PaginatedResult, BloodRequestDashboardMetrics } from '../types/index.js';
import { auditService } from './audit.service.js';
import { matchingService } from './matching.service.js';

export class BloodRequestService {
  /**
   * Lazily updates statuses of any requests that have passed their requiredBy deadline.
   */
  private async autoExpireOverdueRequests(): Promise<void> {
    try {
      const now = new Date();
      await prisma.bloodRequest.updateMany({
        where: {
          status: { in: [RequestStatus.OPEN, RequestStatus.PARTIALLY_FULFILLED] },
          requiredBy: { lt: now },
        },
        data: {
          status: RequestStatus.EXPIRED,
          closedAt: now,
        },
      });
    } catch {
      // Non-blocking auto-expiration fallback
    }
  }

  /**
   * Creates a new clinical blood request.
   */
  public async createBloodRequest(input: CreateBloodRequestInput, actorUserId: string) {
    const requiredByDate = new Date(input.requiredBy);

    const request = await prisma.bloodRequest.create({
      data: {
        createdById: actorUserId,
        bloodGroup: input.bloodGroup,
        unitsRequired: input.unitsRequired,
        urgency: input.urgency || RequestUrgency.NORMAL,
        location: input.location,
        requiredBy: requiredByDate,
        hospitalName: input.hospitalName,
        contactName: input.contactName,
        contactNumber: input.contactNumber,
        patientReference: input.patientReference || null,
        notes: input.notes || null,
        status: RequestStatus.OPEN,
      },
    });

    await auditService.log({
      actorUserId,
      action: 'BLOOD_REQUEST_CREATED',
      targetType: 'BloodRequest',
      targetId: request.id,
      metadata: {
        bloodGroup: request.bloodGroup,
        unitsRequired: request.unitsRequired,
        urgency: request.urgency,
        hospitalName: request.hospitalName,
      },
    });

    return request;
  }

  /**
   * Retrieves a paginated list of blood requests with optional filters.
   */
  public async getBloodRequests(
    query: BloodRequestQueryInput
  ): Promise<PaginatedResult<any>> {
    await this.autoExpireOverdueRequests();

    const { page = 1, limit = 20, status, bloodGroup, urgency, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BloodRequestWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }
    if (urgency) {
      where.urgency = urgency;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { hospitalName: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { patientReference: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.bloodRequest.count({ where }),
      prisma.bloodRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ urgency: 'desc' }, { requiredBy: 'asc' }, { createdAt: 'desc' }],
        include: {
          createdBy: {
            select: { email: true },
          },
          _count: {
            select: { donations: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single blood request by ID with associated donations.
   */
  public async getBloodRequestById(id: string) {
    await this.autoExpireOverdueRequests();

    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true },
        },
        donations: {
          orderBy: { donatedAt: 'desc' },
          include: {
            donor: {
              select: {
                id: true,
                fullName: true,
                bloodGroup: true,
                contactNumber: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundError(`Blood request with ID ${id} was not found.`);
    }

    return request;
  }

  /**
   * Updates an existing blood request.
   */
  public async updateBloodRequest(
    id: string,
    input: UpdateBloodRequestInput,
    actorUserId?: string
  ) {
    const existing = await prisma.bloodRequest.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Blood request with ID ${id} was not found.`);
    }

    if (
      existing.status === RequestStatus.CANCELLED ||
      existing.status === RequestStatus.EXPIRED
    ) {
      throw new BadRequestError(
        `Cannot modify a ${existing.status.toLowerCase()} blood request.`
      );
    }

    const data: Prisma.BloodRequestUpdateInput = {};
    if (input.bloodGroup) data.bloodGroup = input.bloodGroup;
    if (input.unitsRequired !== undefined) {
      if (input.unitsRequired < existing.unitsFulfilled) {
        throw new BadRequestError(
          `Units required (${input.unitsRequired}) cannot be less than already fulfilled units (${existing.unitsFulfilled}).`
        );
      }
      data.unitsRequired = input.unitsRequired;
      if (input.unitsRequired === existing.unitsFulfilled) {
        data.status = RequestStatus.FULFILLED;
        data.closedAt = new Date();
      }
    }
    if (input.urgency) data.urgency = input.urgency;
    if (input.location) data.location = input.location;
    if (input.requiredBy) data.requiredBy = new Date(input.requiredBy);
    if (input.hospitalName) data.hospitalName = input.hospitalName;
    if (input.contactName) data.contactName = input.contactName;
    if (input.contactNumber) data.contactNumber = input.contactNumber;
    if (input.patientReference !== undefined) data.patientReference = input.patientReference;
    if (input.notes !== undefined) data.notes = input.notes;

    const updated = await prisma.bloodRequest.update({
      where: { id },
      data,
    });

    await auditService.log({
      actorUserId,
      action: 'BLOOD_REQUEST_MODIFIED',
      targetType: 'BloodRequest',
      targetId: id,
      metadata: { changes: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Cancels an active blood request and cascades cancellation to active opportunities.
   */
  public async cancelBloodRequest(id: string, actorUserId?: string, reason?: string) {
    const cancelled = await prisma.$transaction(
      async (tx) => {
        const req = await tx.bloodRequest.findUnique({ where: { id } });
        if (!req) {
          throw new NotFoundError(`Blood request with ID ${id} was not found.`);
        }

        if (req.status === RequestStatus.CANCELLED) {
          return req; // Already cancelled
        }
        if (req.status === RequestStatus.FULFILLED) {
          throw new BadRequestError('Cannot cancel a request that has already been fulfilled.');
        }

        const res = await tx.bloodRequest.update({
          where: { id },
          data: {
            status: RequestStatus.CANCELLED,
            closedAt: new Date(),
          },
        });

        // Cancel any pending or viewed opportunities for this request
        await tx.donorOpportunity.updateMany({
          where: {
            bloodRequestId: id,
            status: { in: ['PENDING', 'VIEWED'] },
          },
          data: {
            status: 'CANCELLED',
          },
        });

        return res;
      },
      {
        isolationLevel: 'Serializable',
      }
    );

    await auditService.log({
      actorUserId,
      action: 'BLOOD_REQUEST_CANCELLED',
      targetType: 'BloodRequest',
      targetId: id,
      metadata: { reason },
    });

    return cancelled;
  }

  /**
   * Evaluates potential matching candidates for the request.
   */
  public async getMatches(id: string, actorUserId?: string) {
    const matches = await matchingService.findMatchesForRequest(id);

    await auditService.log({
      actorUserId,
      action: 'DONOR_MATCH_VIEWED',
      targetType: 'BloodRequest',
      targetId: id,
      metadata: { candidateCount: matches.totalEligibleCandidates },
    });

    return matches;
  }

  /**
   * Aggregates request metrics for the admin dashboard.
   */
  public async getDashboardRequestMetrics(): Promise<BloodRequestDashboardMetrics> {
    await this.autoExpireOverdueRequests();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalRequests,
      openRequests,
      criticalRequests,
      highRequests,
      partiallyFulfilledRequests,
      fulfilledTodayRequests,
      expiredRequests,
    ] = await Promise.all([
      prisma.bloodRequest.count(),
      prisma.bloodRequest.count({ where: { status: RequestStatus.OPEN } }),
      prisma.bloodRequest.count({
        where: {
          status: { in: [RequestStatus.OPEN, RequestStatus.PARTIALLY_FULFILLED] },
          urgency: RequestUrgency.CRITICAL,
        },
      }),
      prisma.bloodRequest.count({
        where: {
          status: { in: [RequestStatus.OPEN, RequestStatus.PARTIALLY_FULFILLED] },
          urgency: RequestUrgency.HIGH,
        },
      }),
      prisma.bloodRequest.count({
        where: { status: RequestStatus.PARTIALLY_FULFILLED },
      }),
      prisma.bloodRequest.count({
        where: {
          status: RequestStatus.FULFILLED,
          closedAt: { gte: startOfToday },
        },
      }),
      prisma.bloodRequest.count({
        where: { status: RequestStatus.EXPIRED },
      }),
    ]);

    return {
      totalRequests,
      openRequests,
      criticalRequests,
      highRequests,
      partiallyFulfilledRequests,
      fulfilledTodayRequests,
      expiredRequests,
    };
  }
}

export const bloodRequestService = new BloodRequestService();
