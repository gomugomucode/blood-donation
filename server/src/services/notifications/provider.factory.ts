import { env } from '../../config/env.js';
import { NotificationChannel } from '../../types/index.js';
import { EmailNotificationProvider } from './email.provider.js';
import { SmsNotificationProvider } from './sms.provider.js';

export interface INotificationProvider {
  send(payload: any): Promise<{ externalId?: string; status: any; error?: string }>;
}

export class InAppProvider implements INotificationProvider {
  public async send(): Promise<{ status: 'SENT' }> {
    return { status: 'SENT' };
  }
}

export class NotificationProviderFactory {
  public static getProvider(channel: NotificationChannel): INotificationProvider {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return new EmailNotificationProvider({
          provider: env.EMAIL_PROVIDER as any,
          apiKey: env.EMAIL_API_KEY,
          fromEmail: env.EMAIL_FROM,
        });

      case NotificationChannel.SMS:
        return new SmsNotificationProvider({
          provider: env.SMS_PROVIDER as any,
          accountSid: env.SMS_ACCOUNT_SID,
          authToken: env.SMS_AUTH_TOKEN,
          fromNumber: env.SMS_FROM,
        });

      case NotificationChannel.IN_APP:
      default:
        return new InAppProvider();
    }
  }
}
