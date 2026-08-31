import { api } from '../lib/api.js';
import { ApiResponse, User } from '../types/index.js';
import { RegisterFormValues, LoginFormValues } from '../schemas/auth.schema.js';

export const authService = {
  async register(data: RegisterFormValues): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return res.data.data!;
  },

  async login(data: LoginFormValues): Promise<{ user: User; token: string }> {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return res.data.data!;
  },

  async forgotPassword(data: { email: string }): Promise<{ message: string; devResetToken?: string }> {
    const res = await api.post<ApiResponse<{ message: string; devResetToken?: string }>>('/auth/forgot-password', data);
    return res.data.data!;
  },

  async resetPassword(data: { token: string; newPassword: string }): Promise<{ message: string }> {
    const res = await api.post<ApiResponse<null>>('/auth/reset-password', data);
    return { message: res.data.message || 'Password reset successfully' };
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const res = await api.post<ApiResponse<null>>('/auth/change-password', data);
    return { message: res.data.message || 'Password changed successfully' };
  },

  async logout(): Promise<void> {
    await api.post<ApiResponse<null>>('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data!;
  },
};
