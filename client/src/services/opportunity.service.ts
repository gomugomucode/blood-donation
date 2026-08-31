import { api } from '../lib/api.js';
import {
  ApiResponse,
  PaginatedResult,
} from '../types/index.js';
import {
  DonorOpportunity,
  OpportunityStatus,
  DeclineOpportunityPayload,
  CreateOpportunitiesBatchPayload,
  BloodRequestOutreachData,
} from '../types/opportunity.js';

export const opportunityService = {
  /**
   * Donor: List opportunities
   */
  async getMyOpportunities(params?: {
    page?: number;
    limit?: number;
    status?: OpportunityStatus;
  }): Promise<PaginatedResult<DonorOpportunity>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const res = await api.get<ApiResponse<PaginatedResult<DonorOpportunity>>>(
      `/donors/opportunities?${searchParams.toString()}`
    );
    return res.data.data!;
  },

  /**
   * Donor: Get single opportunity
   */
  async getMyOpportunityById(id: string): Promise<DonorOpportunity> {
    const res = await api.get<ApiResponse<DonorOpportunity>>(`/donors/opportunities/${id}`);
    return res.data.data!;
  },

  /**
   * Donor: Mark as viewed
   */
  async viewOpportunity(id: string): Promise<DonorOpportunity> {
    const res = await api.post<ApiResponse<DonorOpportunity>>(`/donors/opportunities/${id}/view`);
    return res.data.data!;
  },

  /**
   * Donor: Accept opportunity
   */
  async acceptOpportunity(id: string): Promise<DonorOpportunity> {
    const res = await api.post<ApiResponse<DonorOpportunity>>(`/donors/opportunities/${id}/accept`);
    return res.data.data!;
  },

  /**
   * Donor: Decline opportunity
   */
  async declineOpportunity(id: string, payload: DeclineOpportunityPayload): Promise<DonorOpportunity> {
    const res = await api.post<ApiResponse<DonorOpportunity>>(
      `/donors/opportunities/${id}/decline`,
      payload
    );
    return res.data.data!;
  },

  /**
   * Admin: Get outreach summary and opportunities for blood request
   */
  async getOutreachForBloodRequest(bloodRequestId: string): Promise<BloodRequestOutreachData> {
    const res = await api.get<ApiResponse<BloodRequestOutreachData>>(
      `/admin/blood-requests/${bloodRequestId}/opportunities`
    );
    return res.data.data!;
  },

  /**
   * Admin: Create batch opportunities
   */
  async createOpportunitiesBatch(
    bloodRequestId: string,
    payload: CreateOpportunitiesBatchPayload
  ): Promise<{ created: number; skipped: number; opportunities: any[] }> {
    const res = await api.post<ApiResponse<{ created: number; skipped: number; opportunities: any[] }>>(
      `/admin/blood-requests/${bloodRequestId}/opportunities`,
      payload
    );
    return res.data.data!;
  },

  /**
   * Admin: Cancel active opportunity
   */
  async cancelOpportunity(id: string, reason?: string): Promise<any> {
    const res = await api.post<ApiResponse<any>>(`/admin/opportunities/${id}/cancel`, {
      reason,
    });
    return res.data.data!;
  },
};
