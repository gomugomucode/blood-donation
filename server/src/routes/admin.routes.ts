import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { opportunityController } from '../controllers/opportunity.controller.js';
import { adminOperationsController } from '../controllers/admin-operations.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware.js';
import {
  adminDonorQuerySchema,
  adminUpdateDonorSchema,
  adminCreateDonationSchema,
  donorIdParamSchema,
  auditLogQuerySchema,
} from '../validators/admin.validator.js';
import {
  opportunityIdParamSchema,
  cancelOpportunitySchema,
} from '../validators/opportunity.validator.js';
import { Role } from '../types/index.js';

const router = Router();

// Strict security invariant: All /api/v1/admin/* routes require ADMIN role
router.use(authenticate);
router.use(requireRole(Role.ADMIN));

router.get('/dashboard', adminController.getDashboard);

router.get('/donors', validateQuery(adminDonorQuerySchema), adminController.getDonors);

router.get(
  '/donors/:id',
  validateParams(donorIdParamSchema),
  adminController.getDonorById
);

router.patch(
  '/donors/:id',
  validateParams(donorIdParamSchema),
  validateBody(adminUpdateDonorSchema),
  adminController.updateDonor
);

router.delete(
  '/donors/:id',
  validateParams(donorIdParamSchema),
  adminController.deactivateDonor
);

router.get(
  '/donors/:id/donations',
  validateParams(donorIdParamSchema),
  adminController.getDonorDonations
);

router.post(
  '/donors/:id/donations',
  validateParams(donorIdParamSchema),
  validateBody(adminCreateDonationSchema),
  adminController.recordDonation
);

router.get(
  '/audit-logs',
  validateQuery(auditLogQuerySchema),
  adminController.getAuditLogs
);

// Operations, Telemetry & Failed Notification Controls (Phase 14)
router.get('/operations/system-status', adminOperationsController.getSystemStatus);
router.get('/operations/notifications', adminOperationsController.getNotifications);
router.post('/operations/notifications/:id/retry', adminOperationsController.retryNotification);

// Opportunities management
router.post(
  '/opportunities/:id/cancel',
  validateParams(opportunityIdParamSchema),
  validateBody(cancelOpportunitySchema),
  opportunityController.cancel
);

export default router;
