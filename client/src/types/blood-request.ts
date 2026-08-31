import { BloodGroup } from './index.js';

export type RequestStatus = 'OPEN' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type RequestUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface BloodRequest {
  id: string;
  createdById: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: RequestUrgency;
  location: string;
  requiredBy: string;
  patientReference?: string | null;
  hospitalName: string;
  contactName: string;
  contactNumber: string;
  notes?: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
  createdBy?: {
    id: string;
    email: string;
  };
  donations?: Array<{
    id: string;
    donatedAt: string;
    location: string;
    notes?: string | null;
    donor: {
      id: string;
      fullName: string;
      bloodGroup: BloodGroup;
      contactNumber: string;
    };
  }>;
  _count?: {
    donations: number;
  };
}

export interface MatchExplanation {
  compatibility: 'EXACT' | 'COMPATIBLE' | 'INCOMPATIBLE';
  compatibilityDetails: string;
  eligibility: 'PASS' | 'FAIL';
  eligibilityDetails: string;
  locationMatch: 'SAME_CITY' | 'DIFFERENT_LOCATION' | 'UNKNOWN';
  locationDetails: string;
  donationHistory: string;
}

export interface DonorMatchCandidate {
  donorId: string;
  name: string;
  bloodGroup: BloodGroup;
  location: string;
  contactNumber: string;
  lastDonationAt: string | null;
  basicEligibility: {
    eligible: boolean;
    reason: string;
    nextEligibleDate: string | null;
  };
  matchScore: number;
  compatibilityType: 'EXACT' | 'COMPATIBLE';
  explanation: MatchExplanation;
}

export interface BloodRequestMatchesResponse {
  request: {
    id: string;
    bloodGroup: BloodGroup;
    unitsRequired: number;
    unitsFulfilled: number;
    urgency: RequestUrgency;
    location: string;
    status: RequestStatus;
    hospitalName: string;
    requiredBy: string;
  };
  compatibleGroups: BloodGroup[];
  totalEligibleCandidates: number;
  candidates: DonorMatchCandidate[];
}

export interface BloodRequestFilters {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  bloodGroup?: BloodGroup;
  urgency?: RequestUrgency;
  search?: string;
}

export interface CreateBloodRequestInput {
  bloodGroup: BloodGroup;
  unitsRequired: number;
  urgency?: RequestUrgency;
  location: string;
  requiredBy: string;
  hospitalName: string;
  contactName: string;
  contactNumber: string;
  patientReference?: string;
  notes?: string;
}

export interface UpdateBloodRequestInput {
  bloodGroup?: BloodGroup;
  unitsRequired?: number;
  urgency?: RequestUrgency;
  location?: string;
  requiredBy?: string;
  hospitalName?: string;
  contactName?: string;
  contactNumber?: string;
  patientReference?: string;
  notes?: string;
}
