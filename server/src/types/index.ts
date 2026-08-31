import { Request } from 'express';
import {
  Role,
  BloodGroup,
  RequestStatus,
  RequestUrgency,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  OpportunityStatus,
  DeclineReason,
} from '@prisma/client';

export {
  Role,
  BloodGroup,
  RequestStatus,
  RequestUrgency,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  OpportunityStatus,
  DeclineReason,
};

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  sessionVersion?: number;
  donorProfileId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DonorFilters {
  bloodGroup?: BloodGroup;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  reason: string;
  nextEligibleDate: string | null;
  daysUntilEligible: number | null;
  criteria: {
    ageEligible: boolean;
    intervalEligible: boolean;
    statusEligible: boolean;
    calculatedAge: number;
    daysSinceLastDonation: number | null;
  };
  disclaimer: string;
}

export interface DashboardMetrics {
  totalDonors: number;
  eligibleDonors: number;
  totalDonations: number;
  recentDonationsCount: number;
  bloodGroupDistribution: Record<BloodGroup, number>;
  recentDonations: Array<{
    id: string;
    donatedAt: Date;
    location: string;
    notes: string | null;
    donor: {
      id: string;
      fullName: string;
      bloodGroup: BloodGroup;
    };
  }>;
  requestMetrics?: BloodRequestDashboardMetrics;
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

export interface BloodRequestDashboardMetrics {
  totalRequests: number;
  openRequests: number;
  criticalRequests: number;
  highRequests: number;
  partiallyFulfilledRequests: number;
  fulfilledTodayRequests: number;
  expiredRequests: number;
}

export interface DonorConsentPreferences {
  allowBloodRequestNotifications: boolean;
  preferredNotificationChannel: NotificationChannel;
  locationSharingConsent: boolean;
  preferredContactTime?: string;
}

export interface NotificationPayload {
  userId: string;
  opportunityId?: string;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  message: string;
}

export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date | null;
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
