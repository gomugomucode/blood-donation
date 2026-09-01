import { env } from '../../config/env.js';
import { NotificationChannel, NotificationPayload, NotificationStatus } from '../../types/index.js';
import { EmailNotificationProvider } from './email.provider.js';
import { SmsNotificationProvider } from './sms.provider.js';
import { DevelopmentNotificationProvider } from './development.provider.js';

export interface INotificationProvider {
  send(payload: NotificationPayload & { recipientEmail?: string; recipientPhone?: string }): Promise<{
    externalId?: string;
    status: NotificationStatus;
    error?: string;
    isSimulated?: boolean;
  }>;
}

/**
 * InAppNotificationProvider
 *
 * Primary functional provider for in-app alert notifications.
 * Delivery occurs in-app via database persistence.
 */
export class InAppNotificationProvider implements INotificationProvider {
  public async send(): Promise<{ status: NotificationStatus }> {
    return { status: NotificationStatus.SENT };
  }
}

// Backward-compatibility alias
export const InAppProvider = InAppNotificationProvider;

export class NotificationProviderFactory {
  public static getProvider(channel: NotificationChannel): INotificationProvider {
    switch (channel) {
      case NotificationChannel.EMAIL:
        if (env.EMAIL_PROVIDER === 'mock') {
          return new DevelopmentNotificationProvider();
        }
        return new EmailNotificationProvider({
          provider: env.EMAIL_PROVIDER as any,
          apiKey: env.EMAIL_API_KEY,
          fromEmail: env.EMAIL_FROM,
        });

      case NotificationChannel.SMS:
        if (env.SMS_PROVIDER === 'mock') {
          return new DevelopmentNotificationProvider();
        }
        return new SmsNotificationProvider({
          provider: env.SMS_PROVIDER as any,
          accountSid: env.SMS_ACCOUNT_SID,
          authToken: env.SMS_AUTH_TOKEN,
          fromNumber: env.SMS_FROM,
        });

      case NotificationChannel.IN_APP:
      default:
        return new InAppNotificationProvider();
    }
  }
}
