import { Router } from 'express';
import authRoutes from './auth.routes.js';
import donorRoutes from './donor.routes.js';
import adminRoutes from './admin.routes.js';
import bloodRequestRoutes from './blood-request.routes.js';

const router = Router();

// Base API V1 routes
router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/donor', donorRoutes); // Phase 12 singular route alias
router.use('/admin', adminRoutes);
router.use('/admin/blood-requests', bloodRequestRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Blood Donation Management API',
    version: '1.0.0',
  });
});

export default router;
