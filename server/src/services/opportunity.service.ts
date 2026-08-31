import { prisma } from '../config/db.js';
import { auditService } from './audit.service.js';
import { matchingService } from './matching.service.js';
import { eligibilityService } from './eligibility.service.js';
import { notificationService } from './notification.service.js';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors.js';
import {
  OpportunityStatus,
  DeclineReason,
  NotificationChannel,
  NotificationType,
  PaginatedResult,
  OutreachStats,
} from '../types/index.js';

export interface CreateOpportunitiesInput {
  bloodRequestId: string;
  donorIds: string[];
}

export interface DeclineOpportunityInput {
  reason?: DeclineReason;
  notes?: string;
}

export class OpportunityService {
  /**
   * Evaluates lazy expiration of an opportunity if its deadline has elapsed.
   */
  private checkAndApplyExpiration<T extends { expiresAt: Date; status: OpportunityStatus }>(
    opportunity: T
  ): T {
    if (
      new Date(opportunity.expiresAt) < new Date() &&
      (opportunity.status === OpportunityStatus.PENDING ||
        opportunity.status === OpportunityStatus.VIEWED)
    ) {
      opportunity.status = OpportunityStatus.EXPIRED;
    }
    return opportunity;
  }

  /**
   * Coordinator outreach: Batch-creates opportunities for selected donor candidates.
   * Enforces anti-fatigue safeguards and max batch limit of 10.
   */
  public async createOpportunities(
    input: CreateOpportunitiesInput,
    coordinatorUserId?: string
  ): Promise<{ created: number; skipped: number; opportunities: any[] }> {
    const { bloodRequestId, donorIds } = input;

    if (!Array.isArray(donorIds) || donorIds.length === 0) {
      throw new BadRequestError('At least one candidate donor must be selected.');
    }

    if (donorIds.length > 10) {
      throw new BadRequestError('Outreach is limited to a maximum of 10 candidate donors per batch.');
    }

    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: bloodRequestId },
    });

    if (!bloodRequest) {
      throw new NotFoundError(`Blood request with ID ${bloodRequestId} was not found.`);
    }

    if (
      bloodRequest.status === 'CANCELLED' ||
      bloodRequest.status === 'EXPIRED' ||
      bloodRequest.status === 'FULFILLED'
    ) {
      throw new BadRequestError(
        `Cannot create donor outreach for a ${bloodRequest.status.toLowerCase()} blood request.`
      );
    }

    if (new Date(bloodRequest.requiredBy) < new Date()) {
      throw new BadRequestError('Cannot create opportunities for an overdue blood request deadline.');
    }

    // Run matching candidate evaluation to get accurate matchScore and matchReason snapshot
    const matchingResult = await matchingService.findMatchesForRequest(bloodRequestId);
    const candidateMap = new Map(matchingResult.candidates.map((c) => [c.donorId, c]));

    const createdOpportunities: any[] = [];
    let skipped = 0;

    for (const donorId of donorIds) {
      const candidate = candidateMap.get(donorId);
      if (!candidate) {
        skipped++;
        continue;
      }

      // Check anti-fatigue duplicate rule: No duplicate active opportunity for same donor + same request
      const existingActive = await prisma.donorOpportunity.findFirst({
        where: {
          donorId,
          bloodRequestId,
          status: {
            in: [
              OpportunityStatus.PENDING,
              OpportunityStatus.VIEWED,
              OpportunityStatus.ACCEPTED,
            ],
          },
        },
      });

      if (existingActive) {
        skipped++;
        continue;
      }

      const donorProfile = await prisma.donorProfile.findUnique({
        where: { id: donorId },
        include: { user: true },
      });

      if (!donorProfile || donorProfile.deletedAt) {
        skipped++;
        continue;
      }

      // Snapshot match details
      const matchScore = candidate.matchScore;
      const matchReason = `${candidate.compatibilityType === 'EXACT' ? 'Exact match' : 'Compatible donor'} (${candidate.bloodGroup.replace('_', '+')}) in ${candidate.location}. Basic screening pass.`;

      // Atomically create opportunity & notification
      const opportunity = await prisma.$transaction(async (tx) => {
        const opp = await tx.donorOpportunity.create({
          data: {
            donorId,
            bloodRequestId,
            matchScore,
            matchReason,
            status: OpportunityStatus.PENDING,
            expiresAt: bloodRequest.requiredBy,
          },
        });

        // Minimum necessary disclosure: Do NOT include patient name, diagnosis, or clinical notes!
        const notifTitle = `Blood Donation Opportunity (${bloodRequest.bloodGroup.replace('_', '+')})`;
        const notifMessage = `A potential match was found for a ${bloodRequest.urgency.toLowerCase()} urgency blood request in ${bloodRequest.location} needed by ${new Date(bloodRequest.requiredBy).toLocaleDateString()}. Please review your opportunity.`;

        await tx.notification.create({
          data: {
            userId: donorProfile.userId,
            opportunityId: opp.id,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.OPPORTUNITY_ALERT,
            status: 'SENT',
            title: notifTitle,
            message: notifMessage,
            sentAt: new Date(),
          },
        });

        return opp;
      });

      await auditService.log({
        actorUserId: coordinatorUserId,
        action: 'OPPORTUNITY_CREATED',
        targetType: 'DonorOpportunity',
        targetId: opportunity.id,
        metadata: {
          donorId,
          bloodRequestId,
          matchScore,
          expiresAt: opportunity.expiresAt,
        },
      });

      createdOpportunities.push(opportunity);
    }

    return {
      created: createdOpportunities.length,
      skipped,
      opportunities: createdOpportunities,
    };
  }

  /**
   * Retrieves donor opportunities with privacy-preserving redaction.
   */
  public async getDonorOpportunities(
    donorId: string,
    query: { page?: number; limit?: number; status?: OpportunityStatus } = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { donorId };
    if (query.status) {
      where.status = query.status;
    }

    const [total, opportunities] = await Promise.all([
      prisma.donorOpportunity.count({ where }),
      prisma.donorOpportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bloodRequest: {
            select: {
              id: true,
              bloodGroup: true,
              urgency: true,
              location: true,
              hospitalName: true,
              requiredBy: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const items = opportunities.map((opp) => {
      const normalized = this.checkAndApplyExpiration(opp);
      return {
        id: normalized.id,
        matchScore: normalized.matchScore,
        matchReason: normalized.matchReason,
        status: normalized.status,
        expiresAt: normalized.expiresAt,
        viewedAt: normalized.viewedAt,
        respondedAt: normalized.respondedAt,
        declineReason: normalized.declineReason,
        createdAt: normalized.createdAt,
        bloodRequest: normalized.bloodRequest,
      };
    });

    const totalPages = Math.ceil(total / limit);

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
   * Retrieves a single opportunity for an authenticated donor with IDOR verification and privacy redaction.
   */
  public async getDonorOpportunityById(
    donorId: string,
    opportunityId: string
  ): Promise<any> {
    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id: opportunityId },
      include: {
        bloodRequest: {
          select: {
            id: true,
            bloodGroup: true,
            urgency: true,
            location: true,
            hospitalName: true,
            requiredBy: true,
            status: true,
          },
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundError('Donation opportunity not found.');
    }

    if (opportunity.donorId !== donorId) {
      throw new ForbiddenError('You do not have permission to access this opportunity.');
    }

    const normalized = this.checkAndApplyExpiration(opportunity);

    return {
      id: normalized.id,
      matchScore: normalized.matchScore,
      matchReason: normalized.matchReason,
      status: normalized.status,
      expiresAt: normalized.expiresAt,
      viewedAt: normalized.viewedAt,
      respondedAt: normalized.respondedAt,
      declineReason: normalized.declineReason,
      createdAt: normalized.createdAt,
      bloodRequest: normalized.bloodRequest,
    };
  }

  /**
   * Marks an opportunity as VIEWED when opened by the donor.
   */
  public async viewOpportunity(donorId: string, opportunityId: string): Promise<any> {
    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundError('Donation opportunity not found.');
    }

    if (opportunity.donorId !== donorId) {
      throw new ForbiddenError('You do not have permission to access this opportunity.');
    }

    if (opportunity.status === OpportunityStatus.PENDING) {
      const updated = await prisma.donorOpportunity.update({
        where: { id: opportunityId },
        data: {
          status: OpportunityStatus.VIEWED,
          viewedAt: new Date(),
        },
      });

      await auditService.log({
        action: 'OPPORTUNITY_VIEWED',
        targetType: 'DonorOpportunity',
        targetId: opportunityId,
        metadata: { donorId },
      });

      return updated;
    }

    return opportunity;
  }

  /**
   * Accepts an opportunity.
   * CRITICAL SAFEGUARD: Rechecks fresh basic eligibility at response time!
   */
  public async acceptOpportunity(donorId: string, opportunityId: string): Promise<any> {
    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id: opportunityId },
      include: {
        bloodRequest: true,
        donor: true,
      },
    });

    if (!opportunity) {
      throw new NotFoundError('Donation opportunity not found.');
    }

    if (opportunity.donorId !== donorId) {
      throw new ForbiddenError('You do not have permission to accept this opportunity.');
    }

    if (opportunity.status === OpportunityStatus.ACCEPTED) {
      return opportunity; // Idempotent
    }

    if (
      opportunity.status === OpportunityStatus.DECLINED ||
      opportunity.status === OpportunityStatus.CANCELLED ||
      opportunity.status === OpportunityStatus.FULFILLED
    ) {
      throw new BadRequestError(
        `Cannot accept an opportunity with status "${opportunity.status}".`
      );
    }

    // Check expiration
    if (new Date(opportunity.expiresAt) < new Date()) {
      await prisma.donorOpportunity.update({
        where: { id: opportunityId },
        data: { status: OpportunityStatus.EXPIRED },
      });
      throw new BadRequestError('This donation opportunity has expired and can no longer be accepted.');
    }

    // Check blood request status
    if (
      opportunity.bloodRequest.status === 'CANCELLED' ||
      opportunity.bloodRequest.status === 'EXPIRED' ||
      opportunity.bloodRequest.status === 'FULFILLED'
    ) {
      throw new BadRequestError(
        `The associated blood request is currently ${opportunity.bloodRequest.status.toLowerCase()}.`
      );
    }

    // FRESH BASIC ELIGIBILITY RECHECK
    const eligibility = eligibilityService.evaluate({
      dateOfBirth: opportunity.donor.dateOfBirth,
      lastDonationAt: opportunity.donor.lastDonationAt,
      deletedAt: opportunity.donor.deletedAt,
    });

    if (!eligibility.isEligible) {
      throw new BadRequestError(
        `Basic screening re-check failed: ${eligibility.reason}. You are currently not eligible to accept.`
      );
    }

    const updated = await prisma.donorOpportunity.update({
      where: { id: opportunityId },
      data: {
        status: OpportunityStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'OPPORTUNITY_ACCEPTED',
      targetType: 'DonorOpportunity',
      targetId: opportunityId,
      metadata: {
        donorId,
        bloodRequestId: opportunity.bloodRequestId,
      },
    });

    return updated;
  }

  /**
   * Declines an opportunity with optional structured reason.
   */
  public async declineOpportunity(
    donorId: string,
    opportunityId: string,
    input: DeclineOpportunityInput = {}
  ): Promise<any> {
    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundError('Donation opportunity not found.');
    }

    if (opportunity.donorId !== donorId) {
      throw new ForbiddenError('You do not have permission to decline this opportunity.');
    }

    if (
      opportunity.status === OpportunityStatus.CANCELLED ||
      opportunity.status === OpportunityStatus.FULFILLED
    ) {
      throw new BadRequestError(
        `Cannot decline an opportunity with status "${opportunity.status}".`
      );
    }

    const updated = await prisma.donorOpportunity.update({
      where: { id: opportunityId },
      data: {
        status: OpportunityStatus.DECLINED,
        declineReason: input.reason || DeclineReason.NOT_AVAILABLE,
        declineNotes: input.notes ? input.notes.trim().substring(0, 300) : null,
        respondedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'OPPORTUNITY_DECLINED',
      targetType: 'DonorOpportunity',
      targetId: opportunityId,
      metadata: {
        donorId,
        reason: updated.declineReason,
      },
    });

    return updated;
  }

  /**
   * Admin Outreach Overview: Retrieves all opportunities and outreach metrics for a blood request.
   */
  public async getOpportunitiesForBloodRequest(bloodRequestId: string): Promise<{
    stats: OutreachStats;
    opportunities: any[];
  }> {
    const bloodRequest = await prisma.bloodRequest.findUnique({
      where: { id: bloodRequestId },
    });

    if (!bloodRequest) {
      throw new NotFoundError(`Blood request with ID ${bloodRequestId} was not found.`);
    }

    const opportunities = await prisma.donorOpportunity.findMany({
      where: { bloodRequestId },
      orderBy: { createdAt: 'desc' },
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            bloodGroup: true,
            contactNumber: true,
            address: true,
          },
        },
      },
    });

    const now = new Date();
    const stats: OutreachStats = {
      totalCandidates: 0,
      totalOpportunities: opportunities.length,
      pending: 0,
      viewed: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
      fulfilled: 0,
    };

    const normalizedList = opportunities.map((opp) => {
      let status = opp.status;
      if (
        (status === OpportunityStatus.PENDING || status === OpportunityStatus.VIEWED) &&
        new Date(opp.expiresAt) < now
      ) {
        status = OpportunityStatus.EXPIRED;
      }

      switch (status) {
        case OpportunityStatus.PENDING:
          stats.pending++;
          break;
        case OpportunityStatus.VIEWED:
          stats.viewed++;
          break;
        case OpportunityStatus.ACCEPTED:
          stats.accepted++;
          break;
        case OpportunityStatus.DECLINED:
          stats.declined++;
          break;
        case OpportunityStatus.EXPIRED:
          stats.expired++;
          break;
        case OpportunityStatus.CANCELLED:
          stats.cancelled++;
          break;
        case OpportunityStatus.FULFILLED:
          stats.fulfilled++;
          break;
      }

      return {
        ...opp,
        status,
      };
    });

    return {
      stats,
      opportunities: normalizedList,
    };
  }

  /**
   * Admin cancellation of an active opportunity.
   */
  public async cancelOpportunity(
    opportunityId: string,
    adminUserId?: string,
    reason?: string
  ): Promise<any> {
    const opportunity = await prisma.donorOpportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundError('Donation opportunity not found.');
    }

    if (
      opportunity.status === OpportunityStatus.FULFILLED ||
      opportunity.status === OpportunityStatus.CANCELLED
    ) {
      throw new BadRequestError(`Cannot cancel an opportunity with status "${opportunity.status}".`);
    }

    const updated = await prisma.donorOpportunity.update({
      where: { id: opportunityId },
      data: {
        status: OpportunityStatus.CANCELLED,
      },
    });

    await auditService.log({
      actorUserId: adminUserId,
      action: 'OPPORTUNITY_CANCELLED',
      targetType: 'DonorOpportunity',
      targetId: opportunityId,
      metadata: {
        donorId: opportunity.donorId,
        bloodRequestId: opportunity.bloodRequestId,
        reason,
      },
    });

    return updated;
  }
}

export const opportunityService = new OpportunityService();
