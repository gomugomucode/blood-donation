import { NotificationPayload, NotificationStatus } from '../../types/index.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface SmsProviderConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  provider: 'twilio' | 'generic' | 'mock';
}

export class SmsNotificationProvider {
  constructor(private readonly config: SmsProviderConfig) {}

  public async send(
    payload: NotificationPayload & { recipientPhone?: string }
  ): Promise<{ externalId?: string; status: NotificationStatus; error?: string }> {
    const to = payload.recipientPhone;
    if (!to) {
      return {
        status: NotificationStatus.FAILED,
        error: 'Missing recipient phone number for SMS notification dispatch.',
      };
    }

    // In mock or non-production
    if (this.config.provider === 'mock' || env.NODE_ENV !== 'production') {
      const mockId = `mock-sms-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      logger.info(`[MOCK SMS DISPATCH] To: ${to} | Text: ${payload.message}`, {
        mockId,
        userId: payload.userId,
      });
      return { externalId: mockId, status: NotificationStatus.SENT };
    }

    try {
      if (this.config.provider === 'twilio') {
        const { accountSid, authToken, fromNumber } = this.config;
        if (!accountSid || !authToken || !fromNumber) {
          return {
            status: NotificationStatus.FAILED,
            error: 'Missing required Twilio configuration parameters (AccountSid, AuthToken, or FromNumber).',
          };
        }

        const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', to);
        params.append('From', fromNumber);
        params.append('Body', `HemaCare Alert: ${payload.title}. ${payload.message} Reply STOP to opt out.`);

        const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errJson: any = await response.json().catch(() => ({ message: 'Twilio request failed' }));
          return {
            status: NotificationStatus.FAILED,
            error: `Twilio Error (${response.status}): ${errJson.message || response.statusText}`,
          };
        }

        const data: any = await response.json();
        return { externalId: data.sid, status: NotificationStatus.SENT };
      }

      return {
        status: NotificationStatus.FAILED,
        error: `Unsupported SMS provider: ${this.config.provider}`,
      };
    } catch (error: any) {
      logger.error('Unexpected SMS dispatch error', {
        error: error.message,
        userId: payload.userId,
      });
      return {
        status: NotificationStatus.FAILED,
        error: error.message || 'Unknown network error during SMS dispatch',
      };
    }
  }
}
