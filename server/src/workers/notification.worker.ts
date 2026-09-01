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
   * Processes a batch of pending or recoverable failed notifications with exponential backoff and concurrency locking.
   */
  public async processBatch(): Promise<number> {
    try {
      const now = Date.now();
      const thirtySecondsAgo = new Date(now - 30 * 1000);
      const twoMinutesAgo = new Date(now - 2 * 60 * 1000);

      // Find candidates:
      // 1. PENDING external notifications (attemptCount === 0)
      // 2. FAILED retryable notifications after exponential backoff delay (attempt 1 -> 30s, attempt 2 -> 2m)
      const candidates = await prisma.notification.findMany({
        where: {
          channel: { not: NotificationChannel.IN_APP },
          OR: [
            {
              status: NotificationStatus.PENDING,
              attemptCount: 0,
            },
            {
              status: NotificationStatus.FAILED,
              attemptCount: 1,
              lastAttemptAt: { lte: thirtySecondsAgo },
              NOT: { errorCode: { startsWith: 'SUPPRESSED_' } },
            },
            {
              status: NotificationStatus.FAILED,
              attemptCount: 2,
              lastAttemptAt: { lte: twoMinutesAgo },
              NOT: { errorCode: { startsWith: 'SUPPRESSED_' } },
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
          opportunity: {
            include: {
              bloodRequest: true,
            },
          },
        },
      });

      if (candidates.length === 0) {
        return 0;
      }

      let processedCount = 0;
      for (const notif of candidates) {
        const processed = await this.processSingleNotification(notif);
        if (processed) processedCount++;
      }

      return processedCount;
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

  private async processSingleNotification(notif: any): Promise<boolean> {
    // 1. Optimistic Concurrency Claim:
    // Atomically claim the notification to guarantee only one worker thread can dispatch it
    const claim = await prisma.notification.updateMany({
      where: {
        id: notif.id,
        status: notif.status,
        attemptCount: notif.attemptCount,
      },
      data: {
        attemptCount: notif.attemptCount + 1,
        lastAttemptAt: new Date(),
      },
    });

    if (claim.count === 0) {
      // Concurrently claimed by another worker instance
      logger.info(`[Worker Skip] Notification ${notif.id} already claimed by another worker.`);
      return false;
    }

    const currentAttemptCount = notif.attemptCount + 1;

    // 2. Stale Notification Protection / Request State Verification:
    // If the notification is linked to an opportunity, verify the underlying blood request
    if (notif.opportunityId) {
      const opp = notif.opportunity || (await prisma.donorOpportunity.findUnique({
        where: { id: notif.opportunityId },
        include: { bloodRequest: true },
      }));

      if (opp?.bloodRequest) {
        const reqStatus = opp.bloodRequest.status;
        if (reqStatus === 'CANCELLED' || reqStatus === 'EXPIRED' || reqStatus === 'FULFILLED') {
          logger.info(`[Worker Suppress] Notification ${notif.id} suppressed: Linked blood request is ${reqStatus}.`, {
            notificationId: notif.id,
            bloodRequestId: opp.bloodRequestId,
            requestStatus: reqStatus,
          });

          await prisma.notification.update({
            where: { id: notif.id },
            data: {
              status: NotificationStatus.FAILED,
              errorCode: `SUPPRESSED_REQUEST_${reqStatus}`,
              failedAt: new Date(),
              attemptCount: this.maxAttempts, // Terminal: do not retry suppressed notifications
            },
          });
          return true;
        }
      }
    }

    // 3. Dispatch via Provider
    const provider = NotificationProviderFactory.getProvider(notif.channel);
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

    // 4. Non-Retryable Error Check:
    // If error is permanent (missing recipient info, invalid configuration, permanent 4xx), mark as terminal failure
    let finalAttemptCount = currentAttemptCount;
    const isNonRetryable =
      dispatchResult.status === NotificationStatus.FAILED &&
      (dispatchResult.error?.includes('UNCONFIGURED_PROVIDER') ||
        dispatchResult.error?.includes('Missing recipient') ||
        dispatchResult.error?.includes('Invalid phone') ||
        dispatchResult.error?.includes('Unsupported'));

    if (isNonRetryable) {
      finalAttemptCount = this.maxAttempts; // Mark as terminal failure
    }

    await prisma.notification.update({
      where: { id: notif.id },
      data: {
        status: dispatchResult.status,
        attemptCount: finalAttemptCount,
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
      attempt: finalAttemptCount,
      error: dispatchResult.error,
    });

    return true;
  }
}

export const notificationWorker = new NotificationWorker();
