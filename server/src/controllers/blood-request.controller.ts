import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { bloodRequestService } from '../services/blood-request.service.js';
import { notificationService } from '../services/notification.service.js';
import {
  CreateBloodRequestInput,
  UpdateBloodRequestInput,
  CancelBloodRequestInput,
  BloodRequestQueryInput,
  NotifyDonorCandidateInput,
} from '../validators/blood-request.validator.js';

export class BloodRequestController {
  /**
   * POST /api/v1/admin/blood-requests
   * Creates a new blood request.
   */
  public async create(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = req.body as CreateBloodRequestInput;
      const request = await bloodRequestService.createBloodRequest(input, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'Blood request created successfully.',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/blood-requests
   * Lists blood requests with server-side filtering and pagination.
   */
  public async getAll(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as BloodRequestQueryInput;
      const result = await bloodRequestService.getBloodRequests(query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/blood-requests/:id
   * Retrieves single blood request by ID with clinical details and linked donations.
   */
  public async getById(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const request = await bloodRequestService.getBloodRequestById(id);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/admin/blood-requests/:id
   * Updates an existing blood request.
   */
  public async update(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const input = req.body as UpdateBloodRequestInput;
      const updated = await bloodRequestService.updateBloodRequest(id, input, req.user?.id);

      res.status(200).json({
        success: true,
        message: 'Blood request updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/blood-requests/:id/cancel
   * Cancels an active blood request.
   */
  public async cancel(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason } = (req.body || {}) as CancelBloodRequestInput;
      const cancelled = await bloodRequestService.cancelBloodRequest(id, req.user?.id, reason);

      res.status(200).json({
        success: true,
        message: 'Blood request cancelled successfully.',
        data: cancelled,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/blood-requests/:id/matches
   * Evaluates and returns ranked candidate donors for the blood request.
   */
  public async getMatches(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const matches = await bloodRequestService.getMatches(id, req.user?.id);

      res.status(200).json({
        success: true,
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/blood-requests/:id/notify
   * Dispatches coordination notification alert to a candidate donor.
   */
  public async notifyCandidate(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = String(req.params.id);
      const { donorId, channel, message } = req.body as NotifyDonorCandidateInput;

      const result = await notificationService.notifyDonor(
        {
          donorId,
          bloodRequestId: id,
          channel,
          message,
        },
        req.user?.id
      );

      res.status(200).json({
        success: true,
        message: `Notification alert recorded via ${result.channel}.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bloodRequestController = new BloodRequestController();
