import { api } from '../lib/api.js';
import {
  ApiResponse,
  PaginatedResult,
  DonorProfile,
  Donation,
  DashboardMetrics,
  DonorFilters,
  NotificationStatus,
  NotificationChannel,
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

export interface SystemStatusData {
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  components: {
    database: {
      status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
      latencyMs: number;
    };
    notificationWorker: {
      status: 'HEALTHY' | 'IDLE';
      pollIntervalMs: number;
    };
    emailProvider: {
      provider: string;
      status: string;
      fromEmail: string;
    };
    smsProvider: {
      provider: string;
      status: string;
    };
  };
  queueMetrics: {
    pending: number;
    failed: number;
    sent: number;
  };
}

export interface OperationalNotification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  message: string;
  attemptCount: number;
  lastAttemptAt?: string | null;
  failedAt?: string | null;
  errorCode?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    donorProfile?: {
      fullName: string;
      bloodGroup: string;
      contactNumber: string;
    } | null;
  };
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

  async getSystemStatus(): Promise<SystemStatusData> {
    const res = await api.get<ApiResponse<SystemStatusData>>('/admin/operations/system-status');
    return res.data.data!;
  },

  async getOperationalNotifications(filters: { page?: number; limit?: number; status?: string; channel?: string } = {}): Promise<PaginatedResult<OperationalNotification>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.channel) params.append('channel', filters.channel);

    const res = await api.get<ApiResponse<PaginatedResult<OperationalNotification>>>(`/admin/operations/notifications?${params.toString()}`);
    return res.data.data!;
  },

  async retryOperationalNotification(id: string): Promise<any> {
    const res = await api.post<ApiResponse<any>>(`/admin/operations/notifications/${id}/retry`);
    return res.data.data!;
  },
};
