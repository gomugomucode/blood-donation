import { Router } from 'express';
import { donorController } from '../controllers/donor.controller.js';
import { opportunityController } from '../controllers/opportunity.controller.js';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { updateDonorProfileSchema } from '../validators/donor.validator.js';
import {
  opportunityIdParamSchema,
  notificationIdParamSchema,
  declineOpportunitySchema,
  opportunityQuerySchema,
  notificationQuerySchema,
} from '../validators/opportunity.validator.js';
import { Role } from '../types/index.js';

const router = Router();

// All donor endpoints require authentication and DONOR or ADMIN role
router.use(authenticate);
router.use(requireRole(Role.DONOR, Role.ADMIN));

// Profile & History
router.get('/me', donorController.getProfile);
router.patch('/me', validateBody(updateDonorProfileSchema), donorController.updateProfile);
router.get('/me/donations', donorController.getDonations);
router.get('/me/eligibility', donorController.getEligibility);

// Opportunities
router.get(
  '/opportunities',
  validateQuery(opportunityQuerySchema),
  opportunityController.getMyOpportunities
);
router.get(
  '/opportunities/:id',
  validateParams(opportunityIdParamSchema),
  opportunityController.getMyOpportunityById
);
router.post(
  '/opportunities/:id/view',
  validateParams(opportunityIdParamSchema),
  opportunityController.view
);
router.post(
  '/opportunities/:id/accept',
  validateParams(opportunityIdParamSchema),
  opportunityController.accept
);
router.post(
  '/opportunities/:id/decline',
  validateParams(opportunityIdParamSchema),
  validateBody(declineOpportunitySchema),
  opportunityController.decline
);

// Notifications
router.get(
  '/notifications',
  validateQuery(notificationQuerySchema),
  notificationController.getMyNotifications
);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.post(
  '/notifications/:id/read',
  validateParams(notificationIdParamSchema),
  notificationController.markAsRead
);
router.post('/notifications/read-all', notificationController.markAllAsRead);

export default router;
