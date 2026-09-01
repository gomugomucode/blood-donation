import { NotificationPayload, NotificationStatus } from '../../types/index.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface EmailProviderConfig {
  apiKey?: string;
  fromEmail: string;
  provider: 'resend' | 'sendgrid' | 'smtp' | 'mock';
}

export class EmailNotificationProvider {
  constructor(private readonly config: EmailProviderConfig) {}

  public async send(
    payload: NotificationPayload & { recipientEmail?: string }
  ): Promise<{ externalId?: string; status: NotificationStatus; error?: string }> {
    const to = payload.recipientEmail;
    if (!to) {
      return {
        status: NotificationStatus.FAILED,
        error: 'Missing recipient email address for email notification dispatch.',
      };
    }

    // Fail honestly if API credentials are not configured for production providers
    if (this.config.provider === 'resend' || this.config.provider === 'sendgrid') {
      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
        return {
          status: NotificationStatus.FAILED,
          error: `UNCONFIGURED_PROVIDER: Missing API key for email provider "${this.config.provider}".`,
        };
      }
    }

    try {
      if (this.config.provider === 'resend') {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.config.fromEmail,
            to: [to],
            subject: payload.title,
            html: this.formatHtmlTemplate(payload),
            text: payload.message,
          }),
        });

        if (!response.ok) {
          const errData: any = await response.json().catch(() => ({ message: 'HTTP request failed' }));
          return {
            status: NotificationStatus.FAILED,
            error: `Resend API Error (${response.status}): ${errData.message || response.statusText}`,
          };
        }

        const data: any = await response.json();
        return { externalId: data.id, status: NotificationStatus.SENT };
      }

      if (this.config.provider === 'sendgrid') {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          signal: AbortSignal.timeout(10000),
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: this.config.fromEmail },
            subject: payload.title,
            content: [
              { type: 'text/plain', value: payload.message },
              { type: 'text/html', value: this.formatHtmlTemplate(payload) },
            ],
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          return {
            status: NotificationStatus.FAILED,
            error: `SendGrid API Error (${response.status}): ${errText}`,
          };
        }

        const messageId = response.headers.get('x-message-id') || `sg-${Date.now()}`;
        return { externalId: messageId, status: NotificationStatus.SENT };
      }

      return {
        status: NotificationStatus.FAILED,
        error: `Unsupported email provider configuration: ${this.config.provider}`,
      };
    } catch (error: any) {
      logger.error('Unexpected email dispatch error', {
        error: error.message,
        userId: payload.userId,
      });
      return {
        status: NotificationStatus.FAILED,
        error: error.message || 'Unknown network error during email dispatch',
      };
    }
  }

  private formatHtmlTemplate(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
            .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
            .title { color: #e11d48; font-size: 20px; font-weight: 800; margin: 0; }
            .content { font-size: 14px; line-height: 1.6; color: #334155; }
            .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1 class="title">HemaCare Transfusion Alert</h1>
            </div>
            <div class="content">
              <p><strong>${payload.title}</strong></p>
              <p>${payload.message}</p>
              <p style="margin-top: 20px;">Please log in to your HemaCare donor portal to review transfusion requirements and confirm your availability.</p>
            </div>
            <div class="footer">
              <p>You received this message because you opted into voluntary transfusion alerts on HemaCare. Manage your notification preferences anytime in your Donor Profile.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
