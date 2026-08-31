import { Response, NextFunction } from 'express';
import { donorService } from '../services/donor.service.js';
import { sendSuccess } from '../utils/response.js';
import { AuthenticatedRequest } from '../types/index.js';
import { UnauthorizedError } from '../utils/errors.js';

export class DonorController {
  public getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const profile = await donorService.getOwnProfile(req.user.id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const updated = await donorService.updateOwnProfile(req.user.id, req.body);
      sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public getDonations = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const donations = await donorService.getOwnDonations(req.user.id);
      sendSuccess(res, donations);
    } catch (error) {
      next(error);
    }
  };

  public getEligibility = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const eligibility = await donorService.getOwnEligibility(req.user.id);
      sendSuccess(res, eligibility);
    } catch (error) {
      next(error);
    }
  };
}

export const donorController = new DonorController();
