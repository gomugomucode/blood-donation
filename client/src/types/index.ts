export type Role = 'DONOR' | 'ADMIN';

export type BloodGroup =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  donorProfile?: DonorProfile | null;
}

export interface DonorProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  bloodGroup: BloodGroup;
  lastDonationAt?: string | null;
  preferences?: Record<string, any> | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: Role;
    createdAt: string;
  };
  donations?: Donation[];
  totalDonations?: number;
  eligibility?: EligibilityResult;
}

export interface Donation {
  id: string;
  donorId: string;
  bloodRequestId?: string | null;
  donatedAt: string;
  location: string;
  notes?: string | null;
  createdAt: string;
  donor?: {
    id: string;
    fullName: string;
    bloodGroup: BloodGroup;
  };
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface DonorFilters {
  page?: number;
  limit?: number;
  search?: string;
  bloodGroup?: BloodGroup | '';
  includeDeactivated?: boolean;
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

export interface DashboardMetrics {
  totalDonors: number;
  eligibleDonors: number;
  totalDonations: number;
  recentDonationsCount: number;
  bloodGroupDistribution: Record<BloodGroup, number>;
  recentDonations: Array<{
    id: string;
    donatedAt: string;
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
