import { BloodGroup } from './index.js';
import { RequestUrgency, RequestStatus } from './blood-request.js';

export type OpportunityStatus =
  | 'PENDING'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FULFILLED';

export type DeclineReason =
  | 'NOT_AVAILABLE'
  | 'CANNOT_TRAVEL'
  | 'RECENTLY_DONATED'
  | 'OTHER';

export interface RedactedBloodRequest {
  id: string;
  bloodGroup: BloodGroup;
  urgency: RequestUrgency;
  location: string;
  hospitalName: string;
  requiredBy: string;
  status: RequestStatus;
}

export interface DonorOpportunity {
  id: string;
  matchScore: number;
  matchReason: string;
  status: OpportunityStatus;
  expiresAt: string;
  viewedAt?: string | null;
  respondedAt?: string | null;
  declineReason?: DeclineReason | null;
  createdAt: string;
  bloodRequest: RedactedBloodRequest;
}

export interface AdminOpportunityRecord {
  id: string;
  donorId: string;
  bloodRequestId: string;
  matchScore: number;
  matchReason: string;
  status: OpportunityStatus;
  declineReason?: DeclineReason | null;
  declineNotes?: string | null;
  expiresAt: string;
  viewedAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  donor: {
    id: string;
    fullName: string;
    bloodGroup: BloodGroup;
    contactNumber: string;
    address: string;
  };
}

export interface OutreachStats {
  totalCandidates: number;
  totalOpportunities: number;
  pending: number;
  viewed: number;
  accepted: number;
  declined: number;
  expired: number;
  cancelled: number;
  fulfilled: number;
}

export interface BloodRequestOutreachData {
  stats: OutreachStats;
  opportunities: AdminOpportunityRecord[];
}

export interface DeclineOpportunityPayload {
  reason?: DeclineReason;
  notes?: string;
}

export interface CreateOpportunitiesBatchPayload {
  donorIds: string[];
}
