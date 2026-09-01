import { Prisma, BloodGroup } from '@prisma/client';
import { prisma } from '../config/db.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import {
  AdminDonorQueryInput,
  AdminUpdateDonorInput,
  AdminCreateDonationInput,
} from '../validators/admin.validator.js';
import { PaginatedResult, DashboardMetrics } from '../types/index.js';
import { eligibilityService } from './eligibility.service.js';
import { auditService } from './audit.service.js';

export class AdminService {
  /**
   * Aggregates key clinical & operational metrics for the Admin Dashboard.
   */
  public async getDashboardMetrics(): Promise<DashboardMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalDonors, totalDonations, recentDonationsCount, allActiveProfiles, recentDonations] =
      await Promise.all([
        prisma.donorProfile.count({
          where: { deletedAt: null },
        }),
        prisma.donation.count(),
        prisma.donation.count({
          where: {
            donatedAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        prisma.donorProfile.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            dateOfBirth: true,
            lastDonationAt: true,
            deletedAt: true,
            bloodGroup: true,
          },
        }),
        prisma.donation.findMany({
          take: 7,
          orderBy: { donatedAt: 'desc' },
          include: {
            donor: {
              select: {
                id: true,
                fullName: true,
                bloodGroup: true,
              },
            },
          },
        }),
      ]);

    // Calculate real-time eligibility breakdown
    let eligibleDonors = 0;
    const bloodGroupDistribution: Record<BloodGroup, number> = {
      A_POSITIVE: 0,
      A_NEGATIVE: 0,
      B_POSITIVE: 0,
      B_NEGATIVE: 0,
      AB_POSITIVE: 0,
      AB_NEGATIVE: 0,
      O_POSITIVE: 0,
      O_NEGATIVE: 0,
    };

    for (const profile of allActiveProfiles) {
      if (bloodGroupDistribution[profile.bloodGroup] !== undefined) {
        bloodGroupDistribution[profile.bloodGroup]++;
      }

      const evalResult = eligibilityService.evaluate({
        dateOfBirth: profile.dateOfBirth,
        lastDonationAt: profile.lastDonationAt,
        deletedAt: profile.deletedAt,
      });

      if (evalResult.isEligible) {
        eligibleDonors++;
      }
    }

    // Attach Phase 11 blood requests dashboard metrics
    let requestMetrics;
    try {
      requestMetrics = await (await import('./blood-request.service.js')).bloodRequestService.getDashboardRequestMetrics();
    } catch {
      // Fallback
    }

    return {
      totalDonors,
      eligibleDonors,
      totalDonations,
      recentDonationsCount,
      bloodGroupDistribution,
      recentDonations,
      requestMetrics,
    };
  }

  /**
   * Retrieves paginated donor profiles with optional blood group and text search filters.
   */
  public async getDonors(query: AdminDonorQueryInput): Promise<PaginatedResult<any>> {
    const { page, limit, search, bloodGroup, includeDeactivated } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DonorProfileWhereInput = {};

    if (!includeDeactivated) {
      where.deletedAt = null;
    }

    if (bloodGroup) {
      where.bloodGroup = bloodGroup;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { contactNumber: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, donors] = await Promise.all([
      prisma.donorProfile.count({ where }),
      prisma.donorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: { donations: true },
          },
        },
      }),
    ]);

    // Attach basic eligibility indicator to each returned donor
    const enrichedDonors = donors.map((donor) => ({
      ...donor,
      eligibility: eligibilityService.calculateEligibility(
        donor.dateOfBirth,
        donor.lastDonationAt,
        donor.deletedAt
      ),
      totalDonations: donor._count.donations,
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: enrichedDonors,
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
   * Retrieves single donor profile with clinical details and donation history.
   */
  public async getDonorById(id: string) {
    const donor = await prisma.donorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        donations: {
          orderBy: { donatedAt: 'desc' },
        },
      },
    });

    if (!donor) {
      throw new NotFoundError(`Donor with ID ${id} was not found.`);
    }

    const eligibility = eligibilityService.calculateEligibility(
      donor.dateOfBirth,
      donor.lastDonationAt,
      donor.deletedAt
    );

    return {
      ...donor,
      eligibility,
    };
  }

  /**
   * Updates clinical and contact fields for a donor profile.
   */
  public async updateDonor(id: string, input: AdminUpdateDonorInput, actorUserId?: string) {
    const existing = await prisma.donorProfile.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Donor with ID ${id} was not found.`);
    }

    const data: Prisma.DonorProfileUpdateInput = {};
    if (input.fullName) data.fullName = input.fullName;
    if (input.dateOfBirth) data.dateOfBirth = input.dateOfBirth;
    if (input.address) data.address = input.address;
    if (input.contactNumber) data.contactNumber = input.contactNumber;
    if (input.bloodGroup) data.bloodGroup = input.bloodGroup;
    if (input.preferences) data.preferences = input.preferences;

    const updated = await prisma.donorProfile.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    await auditService.log({
      actorUserId,
      action: 'DONOR_MODIFIED',
      targetType: 'DonorProfile',
      targetId: id,
      metadata: { modifiedFields: Object.keys(data) },
    });

    const eligibility = eligibilityService.calculateEligibility(
      updated.dateOfBirth,
      updated.lastDonationAt,
      updated.deletedAt
    );

    return {
      ...updated,
      eligibility,
    };
  }

  /**
   * Soft-deactivates donor record while preserving historical integrity.
   */
  public async deactivateDonor(id: string, actorUserId?: string) {
    const existing = await prisma.donorProfile.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Donor with ID ${id} was not found.`);
    }

    if (existing.deletedAt) {
      return existing; // Already deactivated
    }

    const deactivated = await prisma.donorProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await auditService.log({
      actorUserId,
      action: 'DONOR_DEACTIVATED',
      targetType: 'DonorProfile',
      targetId: id,
    });

    return deactivated;
  }

  /**
   * Fetches donation records for a specific donor.
   */
  public async getDonorDonations(donorId: string) {
    const existing = await prisma.donorProfile.findUnique({ where: { id: donorId } });
    if (!existing) {
      throw new NotFoundError(`Donor with ID ${donorId} was not found.`);
    }

    return prisma.donation.findMany({
      where: { donorId },
      orderBy: { donatedAt: 'desc' },
    });
  }

  /**
   * Records a completed blood donation inside an atomic transaction.
   * Updates DonorProfile.lastDonationAt simultaneously and increments
   * BloodRequest unitsFulfilled if linked.
   */
  public async recordDonation(
    donorId: string,
    input: AdminCreateDonationInput,
    actorUserId?: string
  ) {
    const donor = await prisma.donorProfile.findUnique({ where: { id: donorId } });
    if (!donor) {
      throw new NotFoundError(`Donor with ID ${donorId} was not found.`);
    }

    if (donor.deletedAt) {
      throw new BadRequestError('Cannot record a donation for a deactivated donor profile.');
    }

    let linkedRequest: any = null;
    if (input.bloodRequestId) {
      linkedRequest = await prisma.bloodRequest.findUnique({
        where: { id: input.bloodRequestId },
      });

      if (!linkedRequest) {
        throw new NotFoundError(
          `Blood request with ID ${input.bloodRequestId} was not found.`
        );
      }

      if (
        linkedRequest.status === 'CANCELLED' ||
        linkedRequest.status === 'EXPIRED'
      ) {
        throw new BadRequestError(
          `Cannot record a donation against a ${linkedRequest.status.toLowerCase()} blood request.`
        );
      }

      if (linkedRequest.unitsFulfilled >= linkedRequest.unitsRequired) {
        throw new BadRequestError(
          'Blood request is already fully fulfilled.'
        );
      }
    }

    const donationDate = input.donatedAt || new Date();

    const execute = async () => {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Create Donation Record
          const donation = await tx.donation.create({
            data: {
              donorId,
              bloodRequestId: input.bloodRequestId || null,
              location: input.location,
              notes: input.notes,
              donatedAt: donationDate,
            },
          });

          // 2. Update donor's lastDonationAt if newer or currently null
          if (!donor.lastDonationAt || donationDate > donor.lastDonationAt) {
            await tx.donorProfile.update({
              where: { id: donorId },
              data: { lastDonationAt: donationDate },
            });
          }

          // 3. Atomically update BloodRequest fulfillment and status if linked
          if (input.bloodRequestId) {
            const txRequest = await tx.bloodRequest.findUnique({
              where: { id: input.bloodRequestId },
            });

            if (!txRequest) {
              throw new NotFoundError(`Blood request with ID ${input.bloodRequestId} was not found.`);
            }

            if (txRequest.status === 'CANCELLED' || txRequest.status === 'EXPIRED') {
              throw new BadRequestError(`Cannot record a donation against a ${txRequest.status.toLowerCase()} blood request.`);
            }

            if (txRequest.unitsFulfilled >= txRequest.unitsRequired) {
              throw new BadRequestError('Blood request is already fully fulfilled.');
            }

            const newUnitsFulfilled = txRequest.unitsFulfilled + 1;
            const isFullyFulfilled = newUnitsFulfilled >= txRequest.unitsRequired;

            await tx.bloodRequest.update({
              where: { id: txRequest.id },
              data: {
                unitsFulfilled: newUnitsFulfilled,
                status: isFullyFulfilled ? 'FULFILLED' : 'PARTIALLY_FULFILLED',
                closedAt: isFullyFulfilled ? new Date() : undefined,
              },
            });

            // 4. Transition donor's opportunity for this request to FULFILLED
            await tx.donorOpportunity.updateMany({
              where: {
                donorId,
                bloodRequestId: txRequest.id,
                status: { in: ['ACCEPTED', 'PENDING', 'VIEWED'] },
              },
              data: {
                status: 'FULFILLED',
              },
            });
          }

          return donation;
        },
        {
          isolationLevel: 'Serializable',
        }
      );
    };

    let result: any;
    try {
      result = await execute();
    } catch (err: any) {
      if (
        err.code === 'P2034' ||
        err.message?.includes('could not serialize access') ||
        err.message?.includes('write conflict')
      ) {
        // Retry once to read committed state
        result = await execute();
      } else {
        throw err;
      }
    }

    // 4. Audit Logging
    await auditService.log({
      actorUserId,
      action: 'DONATION_RECORDED',
      targetType: 'Donation',
      targetId: result.id,
      metadata: {
        donorId,
        location: input.location,
        bloodRequestId: input.bloodRequestId,
      },
    });

    if (input.bloodRequestId && linkedRequest) {
      await auditService.log({
        actorUserId,
        action: 'DONATION_LINKED_TO_REQUEST',
        targetType: 'BloodRequest',
        targetId: input.bloodRequestId,
        metadata: {
          donationId: result.id,
          donorId,
          newUnitsFulfilled: linkedRequest.unitsFulfilled + 1,
        },
      });

      if (linkedRequest.unitsFulfilled + 1 >= linkedRequest.unitsRequired) {
        await auditService.log({
          actorUserId,
          action: 'BLOOD_REQUEST_FULFILLED',
          targetType: 'BloodRequest',
          targetId: input.bloodRequestId,
          metadata: {
            totalUnits: linkedRequest.unitsRequired,
          },
        });
      }
    }

    return result;
  }
}

export const adminService = new AdminService();
