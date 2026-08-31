import { prisma } from '../config/db.js';
import { auditService } from './audit.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export type NotificationChannel = 'SMS' | 'EMAIL' | 'IN_APP';

export interface NotifyDonorInput {
  donorId: string;
  bloodRequestId: string;
  channel?: NotificationChannel;
  message?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  donorId: string;
  bloodRequestId: string;
  timestamp: string;
  messageId: string;
}

export class NotificationService {
  /**
   * Dispatches a coordination alert to a potential donor candidate.
   * Modular abstraction designed to plug into production SMS/Email gateways.
   */
  public async notifyDonor(
    input: NotifyDonorInput,
    actorUserId?: string
  ): Promise<NotificationResult> {
    const { donorId, bloodRequestId, channel = 'IN_APP', message } = input;

    const [donor, request] = await Promise.all([
      prisma.donorProfile.findUnique({
        where: { id: donorId },
        include: { user: { select: { email: true } } },
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

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();

    // In local development / current phase: log outreach event in AuditLog
    await auditService.log({
      actorUserId,
      action: 'DONOR_NOTIFIED',
      targetType: 'DonorProfile',
      targetId: donorId,
      metadata: {
        bloodRequestId,
        channel,
        messageId,
        urgency: request.urgency,
        bloodGroup: request.bloodGroup,
        messagePreview: message ? message.substring(0, 100) : undefined,
      },
    });

    return {
      success: true,
      channel,
      donorId,
      bloodRequestId,
      timestamp,
      messageId,
    };
  }
}

export const notificationService = new NotificationService();
