import { api } from '../lib/api.js';
import {
  ApiResponse,
  DonorProfile,
  Donation,
  EligibilityResult,
  DonorConsentPreferences,
} from '../types/index.js';
import { ProfileFormValues } from '../schemas/auth.schema.js';

export const donorService = {
  async getProfile(): Promise<DonorProfile> {
    const res = await api.get<ApiResponse<DonorProfile>>('/donors/me');
    return res.data.data!;
  },

  async updateProfile(
    data: Partial<ProfileFormValues> & {
      preferences?: DonorConsentPreferences | Record<string, any>;
    }
  ): Promise<DonorProfile> {
    const res = await api.patch<ApiResponse<DonorProfile>>('/donors/me', data);
    return res.data.data!;
  },

  async getDonations(): Promise<Donation[]> {
    const res = await api.get<ApiResponse<Donation[]>>('/donors/me/donations');
    return res.data.data!;
  },

  async getEligibility(): Promise<EligibilityResult> {
    const res = await api.get<ApiResponse<EligibilityResult>>('/donors/me/eligibility');
    return res.data.data!;
  },
};
