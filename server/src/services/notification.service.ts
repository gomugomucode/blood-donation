import { prisma } from '../config/db.js';
import { auditService } from './audit.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPayload,
  NotificationResult,
  PaginatedResult,
} from '../types/index.js';

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<{ externalId?: string; status: NotificationStatus; error?: string }>;
}

export class InAppNotificationProvider implements NotificationProvider {
  public async send(_payload: NotificationPayload): Promise<{ externalId?: string; status: NotificationStatus }> {
    // In-app notifications are stored directly and are immediately available to the user
    return { status: NotificationStatus.SENT };
  }
}

export class DevelopmentNotificationProvider implements NotificationProvider {
  constructor(private readonly channelName: 'EMAIL' | 'SMS') {}

  public async send(payload: NotificationPayload): Promise<{ externalId?: string; status: NotificationStatus }> {
    const mockId = `dev-${this.channelName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    logger.debug(`[DEV ${this.channelName} SIMULATOR] Dispatched notification to user ${payload.userId}`, {
      title: payload.title,
      mockId,
    });
    return { externalId: mockId, status: NotificationStatus.SENT };
  }
}

export interface NotifyDonorInput {
  donorId: string;
  bloodRequestId: string;
  channel?: NotificationChannel;
  message?: string;
}

export class NotificationService {
  private providers: Record<NotificationChannel, NotificationProvider>;

  constructor() {
    this.providers = {
      [NotificationChannel.IN_APP]: new InAppNotificationProvider(),
      [NotificationChannel.EMAIL]: new DevelopmentNotificationProvider('EMAIL'),
      [NotificationChannel.SMS]: new DevelopmentNotificationProvider('SMS'),
    };
  }

  /**
   * Dispatches a notification across the specified channel with retry tracking and audit recording.
   */
  public async sendNotification(
    payload: NotificationPayload,
    actorUserId?: string
  ): Promise<NotificationResult> {
    const provider = this.providers[payload.channel] || this.providers[NotificationChannel.IN_APP];

    let dispatchResult: { externalId?: string; status: NotificationStatus; error?: string };
    let attemptCount = 1;

    try {
      dispatchResult = await provider.send(payload);
    } catch (err) {
      dispatchResult = {
        status: NotificationStatus.FAILED,
        error: (err as Error).message || 'Provider dispatch failure',
      };
    }

    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        opportunityId: payload.opportunityId,
        channel: payload.channel,
        type: payload.type,
        status: dispatchResult.status,
        title: payload.title,
        message: payload.message,
        attemptCount,
        lastAttemptAt: new Date(),
        errorCode: dispatchResult.error || null,
        providerMessageId: dispatchResult.externalId || null,
        sentAt: dispatchResult.status === NotificationStatus.SENT ? new Date() : null,
      },
    });

    await auditService.log({
      actorUserId: actorUserId || payload.userId,
      action: dispatchResult.status === NotificationStatus.SENT ? 'NOTIFICATION_DISPATCHED' : 'NOTIFICATION_FAILED',
      targetType: 'Notification',
      targetId: notification.id,
      metadata: {
        userId: payload.userId,
        channel: payload.channel,
        type: payload.type,
        opportunityId: payload.opportunityId,
        status: notification.status,
        errorCode: dispatchResult.error,
      },
    });

    return {
      id: notification.id,
      channel: notification.channel,
      status: notification.status,
      sentAt: notification.sentAt,
    };
  }

  /**
   * Retries a failed notification with bounded attempts (up to 3 attempts max).
   */
  public async retryNotification(notificationId: string): Promise<NotificationResult> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    if (notification.status !== NotificationStatus.FAILED) {
      throw new BadRequestError(`Cannot retry notification with status "${notification.status}".`);
    }

    if (notification.attemptCount >= 3) {
      throw new BadRequestError('Maximum retry attempts (3) exceeded for this notification.');
    }

    const provider = this.providers[notification.channel] || this.providers[NotificationChannel.IN_APP];
    const newAttemptCount = notification.attemptCount + 1;

    let dispatchResult: { externalId?: string; status: NotificationStatus; error?: string };
    try {
      dispatchResult = await provider.send({
        userId: notification.userId,
        channel: notification.channel,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        opportunityId: notification.opportunityId || undefined,
      });
    } catch (err) {
      dispatchResult = {
        status: NotificationStatus.FAILED,
        error: (err as Error).message,
      };
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: dispatchResult.status,
        attemptCount: newAttemptCount,
        lastAttemptAt: new Date(),
        errorCode: dispatchResult.error || null,
        providerMessageId: dispatchResult.externalId || null,
        sentAt: dispatchResult.status === NotificationStatus.SENT ? new Date() : null,
      },
    });

    return {
      id: updated.id,
      channel: updated.channel,
      status: updated.status,
      sentAt: updated.sentAt,
    };
  }

  /**
   * Retrieves paginated notifications for an authenticated user.
   */
  public async getUserNotifications(
    userId: string,
    query: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unreadOnly) {
      where.status = { not: NotificationStatus.READ };
    }

    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: {
            select: {
              id: true,
              status: true,
              expiresAt: true,
              bloodRequestId: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Marks a single notification as read by the owning user.
   */
  public async markAsRead(userId: string, notificationId: string): Promise<any> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this notification.');
    }

    if (notification.status === NotificationStatus.READ) {
      return notification;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications for a user as read.
   */
  public async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Retrieves the count of unread notifications for the header badge.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        status: { not: NotificationStatus.READ },
      },
    });
  }

  /**
   * Backward-compatible coordinator alert dispatcher.
   */
  public async notifyDonor(
    input: NotifyDonorInput,
    actorUserId?: string
  ): Promise<any> {
    const { donorId, bloodRequestId, channel = NotificationChannel.IN_APP, message } = input;

    const [donor, request] = await Promise.all([
      prisma.donorProfile.findUnique({
        where: { id: donorId },
        include: { user: { select: { id: true, email: true } } },
      }),
      prisma.bloodRequest.findUnique({
        where: { id: bloodRequestId },
      }),
    ]);

    if (!donor) {
      throw new NotFoundError(`Donor with ID ${donorId} was not found.`);
    }
    if (!request) {
      throw new NotFoundError(`Blood request with ID ${bloodRequestId} was not found.`);
    }

    if (donor.deletedAt) {
      throw new BadRequestError('Cannot send notification to a deactivated donor profile.');
    }

    if (request.status === 'CANCELLED' || request.status === 'EXPIRED') {
      throw new BadRequestError(`Cannot contact donors for a ${request.status.toLowerCase()} blood request.`);
    }

    const title = `Urgent Blood Request: ${request.bloodGroup.replace('_', '+')}`;
    const defaultMsg = `A patient at ${request.hospitalName} (${request.location}) needs ${request.unitsRequired} unit(s) of ${request.bloodGroup.replace('_', '+')} blood by ${new Date(request.requiredBy).toLocaleDateString()}.`;

    const dispatched = await this.sendNotification(
      {
        userId: donor.user.id,
        channel,
        type: NotificationType.OPPORTUNITY_ALERT,
        title,
        message: message || defaultMsg,
      },
      actorUserId
    );

    return {
      success: true,
      channel,
      donorId,
      bloodRequestId,
      timestamp: new Date().toISOString(),
      messageId: dispatched.id,
    };
  }
}

export const notificationService = new NotificationService();
