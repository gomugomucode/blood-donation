import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.js';

export class AdminController {
  public getDashboard = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const metrics = await adminService.getDashboardMetrics();
      sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  };

  public getDonors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const donors = await adminService.getDonors(req.query as any);
      sendSuccess(res, donors);
    } catch (error) {
      next(error);
    }
  };

  public getDonorById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const donor = await adminService.getDonorById(req.params.id);
      sendSuccess(res, donor);
    } catch (error) {
      next(error);
    }
  };

  public updateDonor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await adminService.updateDonor(req.params.id, req.body);
      sendSuccess(res, updated, 'Donor record updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public deactivateDonor = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await adminService.deactivateDonor(req.params.id);
      sendSuccess(res, result, 'Donor record deactivated successfully');
    } catch (error) {
      next(error);
    }
  };

  public getDonorDonations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const donations = await adminService.getDonorDonations(req.params.id);
      sendSuccess(res, donations);
    } catch (error) {
      next(error);
    }
  };

  public recordDonation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const donation = await adminService.recordDonation(req.params.id, req.body);
      sendSuccess(res, donation, 'Donation recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
