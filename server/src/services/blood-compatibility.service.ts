import { BloodGroup } from '@prisma/client';

/**
 * Red-cell compatibility mapping for donor-to-recipient blood transfusions.
 * Key: Recipient Blood Group
 * Value: Array of permitted Donor Blood Groups
 */
const RED_CELL_COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEGATIVE]: [BloodGroup.O_NEGATIVE],
  [BloodGroup.O_POSITIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE],
  [BloodGroup.A_NEGATIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE],
  [BloodGroup.A_POSITIVE]: [
    BloodGroup.O_NEGATIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.A_POSITIVE,
  ],
  [BloodGroup.B_NEGATIVE]: [BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE],
  [BloodGroup.B_POSITIVE]: [
    BloodGroup.O_NEGATIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.B_POSITIVE,
  ],
  [BloodGroup.AB_NEGATIVE]: [
    BloodGroup.O_NEGATIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.AB_NEGATIVE,
  ],
  [BloodGroup.AB_POSITIVE]: [
    BloodGroup.O_NEGATIVE,
    BloodGroup.O_POSITIVE,
    BloodGroup.A_NEGATIVE,
    BloodGroup.A_POSITIVE,
    BloodGroup.B_NEGATIVE,
    BloodGroup.B_POSITIVE,
    BloodGroup.AB_NEGATIVE,
    BloodGroup.AB_POSITIVE,
  ],
};

export class BloodCompatibilityService {
  /**
   * Retrieves all compatible donor blood groups for a given recipient blood group.
   */
  public getCompatibleDonorBloodGroups(recipientGroup: BloodGroup): BloodGroup[] {
    return RED_CELL_COMPATIBILITY_MAP[recipientGroup] || [];
  }

  /**
   * Evaluates if a donor blood group is compatible for a recipient blood group.
   */
  public isCompatible(donorGroup: BloodGroup, recipientGroup: BloodGroup): boolean {
    const compatibleGroups = this.getCompatibleDonorBloodGroups(recipientGroup);
    return compatibleGroups.includes(donorGroup);
  }

  /**
   * Classifies compatibility level between donor and recipient.
   */
  public getCompatibilityType(
    donorGroup: BloodGroup,
    recipientGroup: BloodGroup
  ): 'EXACT' | 'COMPATIBLE' | 'INCOMPATIBLE' {
    if (donorGroup === recipientGroup) {
      return 'EXACT';
    }
    if (this.isCompatible(donorGroup, recipientGroup)) {
      return 'COMPATIBLE';
    }
    return 'INCOMPATIBLE';
  }
}

export const bloodCompatibilityService = new BloodCompatibilityService();
