import { api } from '../lib/api.js';
import {
  ApiResponse,
  PaginatedResult,
  DonorProfile,
  Donation,
  DashboardMetrics,
  DonorFilters,
} from '../types/index.js';

export interface AdminUpdateDonorPayload {
  fullName?: string;
  dateOfBirth?: string;
  address?: string;
  contactNumber?: string;
  bloodGroup?: string;
  preferences?: Record<string, any>;
}

export interface AdminRecordDonationPayload {
  location: string;
  donatedAt?: string;
  notes?: string;
  bloodRequestId?: string;
}

export interface AuditLog {
  id: string;
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
}

export const adminService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await api.get<ApiResponse<DashboardMetrics>>('/admin/dashboard');
    return res.data.data!;
  },

  async getDonors(filters: DonorFilters = {}): Promise<PaginatedResult<DonorProfile>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
    if (filters.includeDeactivated) params.append('includeDeactivated', 'true');

    const res = await api.get<ApiResponse<PaginatedResult<DonorProfile>>>(`/admin/donors?${params.toString()}`);
    return res.data.data!;
  },

  async getDonorById(id: string): Promise<DonorProfile> {
    const res = await api.get<ApiResponse<DonorProfile>>(`/admin/donors/${id}`);
    return res.data.data!;
  },

  async updateDonor(id: string, payload: AdminUpdateDonorPayload): Promise<DonorProfile> {
    const res = await api.patch<ApiResponse<DonorProfile>>(`/admin/donors/${id}`, payload);
    return res.data.data!;
  },

  async deactivateDonor(id: string): Promise<DonorProfile> {
    const res = await api.delete<ApiResponse<DonorProfile>>(`/admin/donors/${id}`);
    return res.data.data!;
  },

  async getDonorDonations(id: string): Promise<Donation[]> {
    const res = await api.get<ApiResponse<Donation[]>>(`/admin/donors/${id}/donations`);
    return res.data.data!;
  },

  async recordDonation(id: string, payload: AdminRecordDonationPayload): Promise<Donation> {
    const res = await api.post<ApiResponse<Donation>>(`/admin/donors/${id}/donations`, payload);
    return res.data.data!;
  },

  async getAuditLogs(filters: AuditLogFilters = {}): Promise<PaginatedResult<AuditLog>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.targetType) params.append('targetType', filters.targetType);

    const res = await api.get<ApiResponse<PaginatedResult<AuditLog>>>(`/admin/audit-logs?${params.toString()}`);
    return res.data.data!;
  },
};
