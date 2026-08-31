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
      const donorId = req.params.id as string;
      const donor = await adminService.getDonorById(donorId);
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
      const donorId = req.params.id as string;
      const updated = await adminService.updateDonor(donorId, req.body);
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
      const donorId = req.params.id as string;
      const result = await adminService.deactivateDonor(donorId);
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
      const donorId = req.params.id as string;
      const donations = await adminService.getDonorDonations(donorId);
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
      const donorId = req.params.id as string;
      const donation = await adminService.recordDonation(donorId, req.body);
      sendSuccess(res, donation, 'Donation recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  };
}

export const adminController = new AdminController();
