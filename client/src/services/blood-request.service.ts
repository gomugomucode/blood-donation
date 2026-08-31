import { api } from '../lib/api.js';
import { ApiResponse, PaginatedResult } from '../types/index.js';
import {
  BloodRequest,
  BloodRequestFilters,
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  BloodRequestMatchesResponse,
} from '../types/blood-request.js';

export const bloodRequestService = {
  async getBloodRequests(
    filters: BloodRequestFilters = {}
  ): Promise<PaginatedResult<BloodRequest>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
    if (filters.urgency) params.append('urgency', filters.urgency);
    if (filters.search) params.append('search', filters.search);

    const res = await api.get<ApiResponse<PaginatedResult<BloodRequest>>>(
      `/admin/blood-requests?${params.toString()}`
    );
    return res.data.data!;
  },

  async getBloodRequestById(id: string): Promise<BloodRequest> {
    const res = await api.get<ApiResponse<BloodRequest>>(`/admin/blood-requests/${id}`);
    return res.data.data!;
  },

  async createBloodRequest(input: CreateBloodRequestInput): Promise<BloodRequest> {
    const res = await api.post<ApiResponse<BloodRequest>>('/admin/blood-requests', input);
    return res.data.data!;
  },

  async updateBloodRequest(
    id: string,
    input: UpdateBloodRequestInput
  ): Promise<BloodRequest> {
    const res = await api.patch<ApiResponse<BloodRequest>>(
      `/admin/blood-requests/${id}`,
      input
    );
    return res.data.data!;
  },

  async cancelBloodRequest(id: string, reason?: string): Promise<BloodRequest> {
    const res = await api.post<ApiResponse<BloodRequest>>(
      `/admin/blood-requests/${id}/cancel`,
      { reason }
    );
    return res.data.data!;
  },

  async getMatches(id: string): Promise<BloodRequestMatchesResponse> {
    const res = await api.get<ApiResponse<BloodRequestMatchesResponse>>(
      `/admin/blood-requests/${id}/matches`
    );
    return res.data.data!;
  },

  async notifyCandidate(
    requestId: string,
    donorId: string,
    channel: 'SMS' | 'EMAIL' | 'IN_APP' = 'IN_APP',
    message?: string
  ) {
    const res = await api.post<ApiResponse<any>>(
      `/admin/blood-requests/${requestId}/notify`,
      {
        donorId,
        channel,
        message,
      }
    );
    return res.data.data!;
  },
};
