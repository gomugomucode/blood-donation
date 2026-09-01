import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { NotificationChannel, NotificationStatus } from '../types/index.js';
import { NotificationProviderFactory } from '../services/notifications/provider.factory.js';

export class NotificationWorker {
  private isRunning: boolean = false;
  private pollIntervalMs: number = 4000;
  private timer: NodeJS.Timeout | null = null;
  private maxAttempts: number = 3;

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('🚀 Notification background worker started.');
    this.scheduleNextPoll(1000);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.info('🛑 Notification background worker stopped.');
  }

  public getStatus(): { isRunning: boolean; pollIntervalMs: number } {
    return {
      isRunning: this.isRunning,
      pollIntervalMs: this.pollIntervalMs,
    };
  }

  private scheduleNextPoll(delayMs: number = this.pollIntervalMs): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      await this.processBatch();
      this.scheduleNextPoll();
    }, delayMs);
  }

  /**
   * Processes a batch of pending or recoverable failed notifications.
   */
  public async processBatch(): Promise<number> {
    try {
      // Find candidate notifications: PENDING or FAILED with retry cooldown elapsed
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

      const candidates = await prisma.notification.findMany({
        where: {
          channel: { not: NotificationChannel.IN_APP },
          OR: [
            { status: NotificationStatus.PENDING },
            {
              status: NotificationStatus.FAILED,
              attemptCount: { lt: this.maxAttempts },
              lastAttemptAt: { lte: twoMinutesAgo },
            },
          ],
        },
        take: 10,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            include: {
              donorProfile: true,
            },
          },
        },
      });

      if (candidates.length === 0) {
        return 0;
      }

      for (const notif of candidates) {
        await this.processSingleNotification(notif);
      }

      return candidates.length;
    } catch (error: any) {
      if (error?.message?.includes('does not exist in the current database')) {
        logger.warn('Notification worker waiting for database migrations to finish...');
      } else {
        logger.error('Error during notification worker batch execution', {
          error: error.message,
        });
      }
      return 0;
    }
  }

  private async processSingleNotification(notif: any): Promise<void> {
    const provider = NotificationProviderFactory.getProvider(notif.channel);
    const newAttemptCount = notif.attemptCount + 1;

    let dispatchResult: { externalId?: string; status: NotificationStatus; error?: string };

    try {
      dispatchResult = await provider.send({
        userId: notif.userId,
        channel: notif.channel,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        opportunityId: notif.opportunityId || undefined,
        recipientEmail: notif.user?.email,
        recipientPhone: notif.user?.donorProfile?.contactNumber,
      });
    } catch (err: any) {
      dispatchResult = {
        status: NotificationStatus.FAILED,
        error: err.message || 'Worker dispatch failure',
      };
    }

    await prisma.notification.update({
      where: { id: notif.id },
      data: {
        status: dispatchResult.status,
        attemptCount: newAttemptCount,
        lastAttemptAt: new Date(),
        failedAt: dispatchResult.status === NotificationStatus.FAILED ? new Date() : null,
        errorCode: dispatchResult.error || null,
        providerMessageId: dispatchResult.externalId || notif.providerMessageId,
        sentAt: dispatchResult.status === NotificationStatus.SENT ? new Date() : notif.sentAt,
      },
    });

    logger.info(`[Worker Notification ${notif.id}] Dispatch result: ${dispatchResult.status}`, {
      notificationId: notif.id,
      channel: notif.channel,
      status: dispatchResult.status,
      attempt: newAttemptCount,
      error: dispatchResult.error,
    });
  }
}

export const notificationWorker = new NotificationWorker();
