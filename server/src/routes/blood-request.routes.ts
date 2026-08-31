import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { bloodRequestController } from '../controllers/blood-request.controller.js';
import {
  createBloodRequestSchema,
  updateBloodRequestSchema,
  cancelBloodRequestSchema,
  bloodRequestQuerySchema,
  notifyDonorCandidateSchema,
  bloodRequestIdParamSchema,
} from '../validators/blood-request.validator.js';

const router = Router();

// Enforce ADMIN role authentication across all Blood Request routes
router.use(authenticate, requireRole(Role.ADMIN));

router.post(
  '/',
  validateBody(createBloodRequestSchema),
  bloodRequestController.create
);

router.get(
  '/',
  validateQuery(bloodRequestQuerySchema),
  bloodRequestController.getAll
);

router.get(
  '/:id',
  validateParams(bloodRequestIdParamSchema),
  bloodRequestController.getById
);

router.patch(
  '/:id',
  validateParams(bloodRequestIdParamSchema),
  validateBody(updateBloodRequestSchema),
  bloodRequestController.update
);

router.post(
  '/:id/cancel',
  validateParams(bloodRequestIdParamSchema),
  validateBody(cancelBloodRequestSchema),
  bloodRequestController.cancel
);

router.get(
  '/:id/matches',
  validateParams(bloodRequestIdParamSchema),
  bloodRequestController.getMatches
);

router.post(
  '/:id/notify',
  validateParams(bloodRequestIdParamSchema),
  validateBody(notifyDonorCandidateSchema),
  bloodRequestController.notifyCandidate
);

export default router;
