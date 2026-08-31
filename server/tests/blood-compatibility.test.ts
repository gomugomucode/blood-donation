import { describe, it, expect } from 'vitest';
import { bloodCompatibilityService } from '../src/services/blood-compatibility.service.js';
import { BloodGroup } from '@prisma/client';

describe('Phase 11: Blood Compatibility Engine Unit Tests', () => {
  describe('Recipient Blood Group Compatibility Rules', () => {
    it('O- recipient can only receive from O-', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.O_NEGATIVE);
      expect(compatible).toEqual([BloodGroup.O_NEGATIVE]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_NEGATIVE, BloodGroup.O_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE)).toBe(false);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.O_NEGATIVE)).toBe(false);
    });

    it('O+ recipient can receive from O- and O+', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.O_POSITIVE);
      expect(compatible).toEqual([BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.O_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.O_POSITIVE)).toBe(false);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.B_POSITIVE, BloodGroup.O_POSITIVE)).toBe(false);
    });

    it('A- recipient can receive from O- and A-', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.A_NEGATIVE);
      expect(compatible).toEqual([BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_NEGATIVE, BloodGroup.A_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_NEGATIVE, BloodGroup.A_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.A_NEGATIVE)).toBe(false);
    });

    it('A+ recipient can receive from O-, O+, A-, A+', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.A_POSITIVE);
      expect(compatible).toEqual([
        BloodGroup.O_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.A_POSITIVE,
      ]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.A_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.A_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.B_POSITIVE, BloodGroup.A_POSITIVE)).toBe(false);
    });

    it('B- recipient can receive from O- and B-', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.B_NEGATIVE);
      expect(compatible).toEqual([BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_NEGATIVE, BloodGroup.B_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.B_NEGATIVE, BloodGroup.B_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.B_POSITIVE, BloodGroup.B_NEGATIVE)).toBe(false);
    });

    it('B+ recipient can receive from O-, O+, B-, B+', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.B_POSITIVE);
      expect(compatible).toEqual([
        BloodGroup.O_NEGATIVE,
        BloodGroup.O_POSITIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.B_POSITIVE,
      ]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_POSITIVE, BloodGroup.B_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.B_POSITIVE, BloodGroup.B_POSITIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.A_POSITIVE, BloodGroup.B_POSITIVE)).toBe(false);
    });

    it('AB- recipient can receive from O-, A-, B-, AB-', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.AB_NEGATIVE);
      expect(compatible).toEqual([
        BloodGroup.O_NEGATIVE,
        BloodGroup.A_NEGATIVE,
        BloodGroup.B_NEGATIVE,
        BloodGroup.AB_NEGATIVE,
      ]);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.O_NEGATIVE, BloodGroup.AB_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.AB_NEGATIVE, BloodGroup.AB_NEGATIVE)).toBe(true);
      expect(bloodCompatibilityService.isCompatible(BloodGroup.AB_POSITIVE, BloodGroup.AB_NEGATIVE)).toBe(false);
    });

    it('AB+ universal recipient can receive from all 8 blood groups', () => {
      const compatible = bloodCompatibilityService.getCompatibleDonorBloodGroups(BloodGroup.AB_POSITIVE);
      expect(compatible.length).toBe(8);
      for (const bg of Object.values(BloodGroup)) {
        expect(bloodCompatibilityService.isCompatible(bg, BloodGroup.AB_POSITIVE)).toBe(true);
      }
    });
  });

  describe('Compatibility Categorization', () => {
    it('returns EXACT when donor and recipient blood groups match', () => {
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.O_POSITIVE, BloodGroup.O_POSITIVE)
      ).toBe('EXACT');
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.A_POSITIVE, BloodGroup.A_POSITIVE)
      ).toBe('EXACT');
    });

    it('returns COMPATIBLE when donor group is compatible but not identical', () => {
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.O_NEGATIVE, BloodGroup.O_POSITIVE)
      ).toBe('COMPATIBLE');
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.O_NEGATIVE, BloodGroup.AB_POSITIVE)
      ).toBe('COMPATIBLE');
    });

    it('returns INCOMPATIBLE when donor group cannot safely donate red-cells', () => {
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.A_POSITIVE, BloodGroup.B_POSITIVE)
      ).toBe('INCOMPATIBLE');
      expect(
        bloodCompatibilityService.getCompatibilityType(BloodGroup.AB_POSITIVE, BloodGroup.O_POSITIVE)
      ).toBe('INCOMPATIBLE');
    });
  });
});
