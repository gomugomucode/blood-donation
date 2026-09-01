import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types/index.js';
import { opportunityService } from '../services/opportunity.service.js';
import {
  CreateOpportunitiesBatchInput,
  DeclineOpportunityInput,
  CancelOpportunityInput,
  OpportunityQueryInput,
} from '../validators/opportunity.validator.js';
import { UnauthorizedError } from '../utils/errors.js';

export class OpportunityController {
  /**
   * POST /api/v1/admin/blood-requests/:id/opportunities
   * Batch creates donor opportunities for selected candidates.
   */
  public async createBatch(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const bloodRequestId = String(req.params.id);
      const { donorIds } = req.body as CreateOpportunitiesBatchInput;

      const result = await opportunityService.createOpportunities(
        {
          bloodRequestId,
          donorIds,
        },
        req.user?.id
      );

      res.status(201).json({
        success: true,
        message: `Successfully created ${result.created} donor opportunity notifications (${result.skipped} skipped).`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/blood-requests/:id/opportunities
   * Retrieves outreach statistics and all opportunities created for a blood request.
   */
  public async getForBloodRequest(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const bloodRequestId = String(req.params.id);
      const result = await opportunityService.getOpportunitiesForBloodRequest(bloodRequestId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/opportunities/:id/cancel
   * Cancels an active donor opportunity.
   */
  public async cancel(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const opportunityId = String(req.params.id);
      const { reason } = (req.body || {}) as CancelOpportunityInput;

      const result = await opportunityService.cancelOpportunity(
        opportunityId,
        req.user?.id,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'Opportunity cancelled successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/donors/opportunities
   * Retrieves paginated opportunities for the authenticated donor.
   */
  public async getMyOpportunities(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const donorId = req.user?.donorProfileId;
      if (!donorId) {
        throw new UnauthorizedError('Donor profile not found for active user session.');
      }

      const query = req.query as unknown as OpportunityQueryInput;
      const result = await opportunityService.getDonorOpportunities(donorId, query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/donors/opportunities/:id
   * Retrieves a single opportunity with ownership check and privacy redaction.
   */
  public async getMyOpportunityById(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const donorId = req.user?.donorProfileId;
      if (!donorId) {
        throw new UnauthorizedError('Donor profile not found for active user session.');
      }

      const opportunityId = String(req.params.id);
      const result = await opportunityService.getDonorOpportunityById(donorId, opportunityId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/donors/opportunities/:id/view
   * Marks opportunity as viewed.
   */
  public async view(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const donorId = req.user?.donorProfileId;
      if (!donorId) {
        throw new UnauthorizedError('Donor profile not found for active user session.');
      }

      const opportunityId = String(req.params.id);
      const result = await opportunityService.viewOpportunity(donorId, opportunityId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/donors/opportunities/:id/accept
   * Accepts opportunity with fresh server-side basic eligibility recheck.
   */
  public async accept(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const donorId = req.user?.donorProfileId;
      if (!donorId) {
        throw new UnauthorizedError('Donor profile not found for active user session.');
      }

      const opportunityId = String(req.params.id);
      const result = await opportunityService.acceptOpportunity(donorId, opportunityId);

      res.status(200).json({
        success: true,
        message: 'Thank you for accepting! Blood bank coordinators have been notified.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/donors/opportunities/:id/decline
   * Declines opportunity with optional structured reason.
   */
  public async decline(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const donorId = req.user?.donorProfileId;
      if (!donorId) {
        throw new UnauthorizedError('Donor profile not found for active user session.');
      }

      const opportunityId = String(req.params.id);
      const body = req.body as DeclineOpportunityInput;
      const result = await opportunityService.declineOpportunity(donorId, opportunityId, body);

      res.status(200).json({
        success: true,
        message: 'Opportunity response recorded.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const opportunityController = new OpportunityController();
