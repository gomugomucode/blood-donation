import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { notificationService } from '../services/notification.service.js';
import { notificationWorker } from '../workers/notification.worker.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.js';
import { NotificationStatus, NotificationChannel } from '../types/index.js';

export class AdminOperationsController {
  /**
   * System health and provider status telemetry.
   */
  public getSystemStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - dbStart;

      const [pendingCount, failedCount, sentCount] = await Promise.all([
        prisma.notification.count({ where: { status: NotificationStatus.PENDING } }),
        prisma.notification.count({ where: { status: NotificationStatus.FAILED } }),
        prisma.notification.count({ where: { status: NotificationStatus.SENT } }),
      ]);

      const workerStatus = notificationWorker.getStatus();

      sendSuccess(res, {
        environment: env.NODE_ENV,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        components: {
          database: {
            status: 'HEALTHY',
            latencyMs: dbLatencyMs,
          },
          notificationWorker: {
            status: workerStatus.isRunning ? 'HEALTHY' : 'IDLE',
            pollIntervalMs: workerStatus.pollIntervalMs,
          },
          emailProvider: {
            provider: env.EMAIL_PROVIDER,
            status: env.EMAIL_PROVIDER === 'mock' ? 'MOCK_ACTIVE' : 'CONFIGURED',
            fromEmail: env.EMAIL_FROM,
          },
          smsProvider: {
            provider: env.SMS_PROVIDER,
            status: env.SMS_PROVIDER === 'mock' ? 'MOCK_ACTIVE' : 'CONFIGURED',
          },
        },
        queueMetrics: {
          pending: pendingCount,
          failed: failedCount,
          sent: sentCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Paginated operational notification logs for coordinator visibility.
   */
  public getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, status, channel } = req.query;

      const result = await notificationService.getAdminNotifications({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as NotificationStatus | undefined,
        channel: channel as NotificationChannel | undefined,
      });

      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Coordinator manual retry for a failed notification.
   */
  public retryNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await notificationService.retryNotification(id);
      sendSuccess(res, result, 'Notification retry dispatched successfully.');
    } catch (error) {
      next(error);
    }
  };
}

export const adminOperationsController = new AdminOperationsController();
