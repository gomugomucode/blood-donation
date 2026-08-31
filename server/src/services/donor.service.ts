import { prisma } from '../config/db.js';
import { NotFoundError } from '../utils/errors.js';
import { UpdateDonorProfileInput } from '../validators/donor.validator.js';
import { eligibilityService } from './eligibility.service.js';

export class DonorService {
  /**
   * Retrieves the authenticated donor's profile and real-time eligibility.
   */
  public async getOwnProfile(userId: string) {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile || profile.deletedAt) {
      throw new NotFoundError('Donor profile not found or inactive.');
    }

    const eligibility = eligibilityService.evaluate({
      dateOfBirth: profile.dateOfBirth,
      lastDonationAt: profile.lastDonationAt,
      deletedAt: profile.deletedAt,
    });

    return {
      ...profile,
      eligibility,
    };
  }

  /**
   * Updates personal contact details and preferences for the authenticated donor.
   */
  public async updateOwnProfile(userId: string, input: UpdateDonorProfileInput) {
    const existing = await prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Donor profile not found or inactive.');
    }

    const updated = await prisma.donorProfile.update({
      where: { userId },
      data: {
        ...(input.fullName && { fullName: input.fullName }),
        ...(input.address && { address: input.address }),
        ...(input.contactNumber && { contactNumber: input.contactNumber }),
        ...(input.preferences && {
          preferences: {
            ...(typeof existing.preferences === 'object' && existing.preferences !== null
              ? (existing.preferences as Record<string, any>)
              : {}),
            ...input.preferences,
          },
        }),
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
   * Retrieves chronological donation history for the authenticated donor.
   */
  public async getOwnDonations(userId: string) {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.deletedAt) {
      throw new NotFoundError('Donor profile not found or inactive.');
    }

    const donations = await prisma.donation.findMany({
      where: { donorId: profile.id },
      orderBy: { donatedAt: 'desc' },
    });

    return donations;
  }

  /**
   * Returns calculated basic eligibility for the authenticated donor.
   */
  public async getOwnEligibility(userId: string) {
    const profile = await prisma.donorProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.deletedAt) {
      throw new NotFoundError('Donor profile not found or inactive.');
    }

    return eligibilityService.evaluate({
      dateOfBirth: profile.dateOfBirth,
      lastDonationAt: profile.lastDonationAt,
      deletedAt: profile.deletedAt,
    });
  }
}

export const donorService = new DonorService();
