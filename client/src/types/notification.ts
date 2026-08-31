export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';
export type NotificationType = 'OPPORTUNITY_ALERT' | 'STATUS_UPDATE' | 'GENERAL';

export interface Notification {
  id: string;
  userId: string;
  opportunityId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  opportunity?: {
    id: string;
    status: string;
    expiresAt: string;
    bloodRequestId: string;
  } | null;
}
