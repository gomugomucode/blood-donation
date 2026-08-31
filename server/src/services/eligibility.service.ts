import { EligibilityResult } from '../types/index.js';

export interface EligibilityRulesConfig {
  minimumAgeYears: number;
  maximumAgeYears: number;
  minimumDonationIntervalDays: number;
}

export const DEFAULT_ELIGIBILITY_RULES: EligibilityRulesConfig = {
  minimumAgeYears: 18,
  maximumAgeYears: 65,
  minimumDonationIntervalDays: 56, // 8 weeks (56 days) standard for whole blood
};

export interface DonorEligibilityInput {
  dateOfBirth: Date | string;
  lastDonationAt?: Date | string | null;
  deletedAt?: Date | string | null;
  referenceDate?: Date; // Allows deterministic testing
}

export class EligibilityService {
  private readonly rules: EligibilityRulesConfig;

  constructor(rules: EligibilityRulesConfig = DEFAULT_ELIGIBILITY_RULES) {
    this.rules = rules;
  }

  /**
   * Calculates precise age in completed years from date of birth.
   */
  public calculateAge(dateOfBirth: Date | string, referenceDate: Date = new Date()): number {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    let age = referenceDate.getFullYear() - dob.getFullYear();
    const monthDiff = referenceDate.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calculates days elapsed between two dates.
   */
  public calculateDaysElapsed(fromDate: Date | string, referenceDate: Date = new Date()): number {
    const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;
    const diffMs = referenceDate.getTime() - from.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Evaluates overall basic donation eligibility based on age, donation history, and status.
   */
  public evaluate(input: DonorEligibilityInput): EligibilityResult {
    const refDate = input.referenceDate || new Date();
    const dob = typeof input.dateOfBirth === 'string' ? new Date(input.dateOfBirth) : input.dateOfBirth;
    
    const calculatedAge = this.calculateAge(dob, refDate);
    const ageEligible = calculatedAge >= this.rules.minimumAgeYears && calculatedAge <= this.rules.maximumAgeYears;

    let intervalEligible = true;
    let daysSinceLastDonation: number | null = null;
    let nextEligibleDate: string | null = null;
    let daysUntilEligible: number | null = null;

    if (input.lastDonationAt) {
      const lastDonation = typeof input.lastDonationAt === 'string' 
        ? new Date(input.lastDonationAt) 
        : input.lastDonationAt;
        
      daysSinceLastDonation = this.calculateDaysElapsed(lastDonation, refDate);

      if (daysSinceLastDonation < this.rules.minimumDonationIntervalDays) {
        intervalEligible = false;
        const daysRemaining = this.rules.minimumDonationIntervalDays - daysSinceLastDonation;
        daysUntilEligible = daysRemaining;

        const nextDate = new Date(lastDonation.getTime());
        nextDate.setDate(nextDate.getDate() + this.rules.minimumDonationIntervalDays);
        nextEligibleDate = nextDate.toISOString().split('T')[0];
      }
    }

    const statusEligible = !input.deletedAt;

    // Determine overall eligibility and primary explanation
    let isEligible = false;
    let reason = '';

    if (!statusEligible) {
      reason = 'Donor profile is currently inactive or deactivated.';
    } else if (calculatedAge < this.rules.minimumAgeYears) {
      reason = `Minimum age requirement is ${this.rules.minimumAgeYears} years (current age: ${calculatedAge}).`;
    } else if (calculatedAge > this.rules.maximumAgeYears) {
      reason = `Age exceeds the standard threshold of ${this.rules.maximumAgeYears} years (current age: ${calculatedAge}). Clinical review required.`;
    } else if (!intervalEligible) {
      reason = `Must wait ${this.rules.minimumDonationIntervalDays} days between whole blood donations (${daysUntilEligible} day(s) remaining). Eligible from ${nextEligibleDate}.`;
    } else {
      isEligible = true;
      reason = 'Meets standard age and donation interval guidelines for blood donation.';
    }

    return {
      isEligible,
      reason,
      nextEligibleDate,
      daysUntilEligible,
      criteria: {
        ageEligible,
        intervalEligible,
        statusEligible,
        calculatedAge,
        daysSinceLastDonation,
      },
      disclaimer: 'Basic eligibility indicator only. Formal medical and hemoglobin screening is performed at the donation center prior to collection.',
    };
  }

  /**
   * Convenience wrapper for evaluating donor eligibility by properties.
   */
  public calculateEligibility(
    dateOfBirth: Date | string,
    lastDonationAt?: Date | string | null,
    deletedAt?: Date | string | null,
    referenceDate?: Date
  ): EligibilityResult {
    return this.evaluate({
      dateOfBirth,
      lastDonationAt,
      deletedAt,
      referenceDate,
    });
  }
}

export const eligibilityService = new EligibilityService();

