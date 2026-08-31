import { Router } from 'express';
import { donorController } from '../controllers/donor.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateDonorProfileSchema } from '../validators/donor.validator.js';
import { Role } from '../types/index.js';

const router = Router();

// All donor endpoints require authentication and DONOR or ADMIN role
router.use(authenticate, requireRole(Role.DONOR, Role.ADMIN));

router.get('/me', donorController.getProfile);
router.patch('/me', validateBody(updateDonorProfileSchema), donorController.updateProfile);
router.get('/me/donations', donorController.getDonations);
router.get('/me/eligibility', donorController.getEligibility);

export default router;
