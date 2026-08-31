import { api } from '../lib/api.js';
import { ApiResponse, PaginatedResult } from '../types/index.js';
import { Notification } from '../types/notification.js';

export const notificationService = {
  /**
   * Get paginated notifications for current session
   */
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<PaginatedResult<Notification>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) searchParams.append('unreadOnly', 'true');

    const res = await api.get<ApiResponse<PaginatedResult<Notification>>>(
      `/donors/notifications?${searchParams.toString()}`
    );
    return res.data.data!;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const res = await api.get<ApiResponse<{ unreadCount: number }>>(
      '/donors/notifications/unread-count'
    );
    return res.data.data!;
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const res = await api.post<ApiResponse<Notification>>(`/donors/notifications/${id}/read`);
    return res.data.data!;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const res = await api.post<ApiResponse<{ count: number }>>('/donors/notifications/read-all');
    return res.data.data!;
  },
};
