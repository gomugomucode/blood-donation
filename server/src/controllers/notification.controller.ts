import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { notificationService } from '../services/notification.service.js';
import { NotificationQueryInput } from '../validators/opportunity.validator.js';
import { UnauthorizedError } from '../utils/errors.js';

export class NotificationController {
  /**
   * GET /api/v1/donors/notifications
   * Retrieves paginated notifications for the authenticated user.
   */
  public async getMyNotifications(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User session required.');
      }

      const query = req.query as unknown as NotificationQueryInput;
      const result = await notificationService.getUserNotifications(userId, query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/donors/notifications/unread-count
   * Retrieves the unread notification badge count.
   */
  public async getUnreadCount(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User session required.');
      }

      const unreadCount = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unreadCount },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/donors/notifications/:id/read
   * Marks a notification as read.
   */
  public async markAsRead(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User session required.');
      }

      const notificationId = String(req.params.id);
      const result = await notificationService.markAsRead(userId, notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/donors/notifications/read-all
   * Marks all notifications as read.
   */
  public async markAllAsRead(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User session required.');
      }

      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
