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

    return {
      totalDonors,
      eligibleDonors,
      totalDonations,
      recentDonationsCount,
      bloodGroupDistribution,
      recentDonations,
    };
  }

  /**
   * Searchable, filterable, and paginated donor directory with server-side query execution.
   */
  public async getDonors(query: AdminDonorQueryInput): Promise<PaginatedResult<any>> {
    const { page, limit, search, bloodGroup, includeDeactivated } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DonorProfileWhereInput = {
      ...(includeDeactivated ? {} : { deletedAt: null }),
      ...(bloodGroup && { bloodGroup }),
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, items] = await Promise.all([
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

    const enrichedItems = items.map((donor) => {
      const eligibility = eligibilityService.evaluate({
        dateOfBirth: donor.dateOfBirth,
        lastDonationAt: donor.lastDonationAt,
        deletedAt: donor.deletedAt,
      });

      return {
        ...donor,
        totalDonations: donor._count.donations,
        eligibility,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: enrichedItems,
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
   * Retrieves single donor details including full clinical donation history.
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

    const eligibility = eligibilityService.evaluate({
      dateOfBirth: donor.dateOfBirth,
      lastDonationAt: donor.lastDonationAt,
      deletedAt: donor.deletedAt,
    });

    return {
      ...donor,
      eligibility,
    };
  }

  /**
   * Updates clinical and administrative donor information.
   */
  public async updateDonor(id: string, input: AdminUpdateDonorInput) {
    const existing = await prisma.donorProfile.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Donor with ID ${id} was not found.`);
    }

    const updated = await prisma.donorProfile.update({
      where: { id },
      data: {
        ...(input.fullName && { fullName: input.fullName }),
        ...(input.dateOfBirth && { dateOfBirth: input.dateOfBirth }),
        ...(input.address && { address: input.address }),
        ...(input.contactNumber && { contactNumber: input.contactNumber }),
        ...(input.bloodGroup && { bloodGroup: input.bloodGroup }),
        ...(input.preferences && {
          preferences: {
            ...(typeof existing.preferences === 'object' && existing.preferences !== null
              ? (existing.preferences as Record<string, any>)
              : {}),
            ...input.preferences,
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    const eligibility = eligibilityService.evaluate({
      dateOfBirth: updated.dateOfBirth,
      lastDonationAt: updated.lastDonationAt,
      deletedAt: updated.deletedAt,
    });

    return {
      ...updated,
      eligibility,
    };
  }

  /**
   * Soft-deactivates donor record while preserving historical integrity.
   */
  public async deactivateDonor(id: string) {
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
   * Updates DonorProfile.lastDonationAt simultaneously.
   */
  public async recordDonation(donorId: string, input: AdminCreateDonationInput) {
    const donor = await prisma.donorProfile.findUnique({ where: { id: donorId } });
    if (!donor) {
      throw new NotFoundError(`Donor with ID ${donorId} was not found.`);
    }

    if (donor.deletedAt) {
      throw new BadRequestError('Cannot record a donation for a deactivated donor profile.');
    }

    const donationDate = input.donatedAt || new Date();

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          donorId,
          location: input.location,
          notes: input.notes,
          donatedAt: donationDate,
        },
      });

      // Update donor's lastDonationAt if newer or currently null
      if (!donor.lastDonationAt || donationDate > donor.lastDonationAt) {
        await tx.donorProfile.update({
          where: { id: donorId },
          data: { lastDonationAt: donationDate },
        });
      }

      return donation;
    });

    return result;
  }
}

export const adminService = new AdminService();
