import { NotificationPayload, NotificationStatus } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import { INotificationProvider } from './provider.factory.js';

/**
 * DevelopmentNotificationProvider
 *
 * Explicitly simulated notification provider for development and test environments.
 * Clearly identifies dispatch as simulated in logs and provider IDs.
 * NEVER represents dispatch as actual carrier delivery.
 */
export class DevelopmentNotificationProvider implements INotificationProvider {
  public async send(
    payload: NotificationPayload & { recipientEmail?: string; recipientPhone?: string }
  ): Promise<{ externalId: string; status: NotificationStatus; isSimulated: boolean }> {
    const channel = payload.channel;
    const recipient =
      channel === 'EMAIL'
        ? payload.recipientEmail || 'unspecified@email.local'
        : channel === 'SMS'
          ? payload.recipientPhone || '+0000000000'
          : payload.userId;

    const simulatedId = `simulated-dev-${channel.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    logger.info(`[SIMULATED_DEV_DISPATCH] Channel: ${channel} | SimulatedID: ${simulatedId}`, {
      simulatedId,
      channel,
      userId: payload.userId,
      recipientMasked: recipient.replace(/(.{2})(.*)(@.*|\d{4})$/, '$1***$3'),
      isSimulated: true,
    });

    return {
      externalId: simulatedId,
      status: NotificationStatus.SENT,
      isSimulated: true,
    };
  }
}
