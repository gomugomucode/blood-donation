import { Router } from 'express';
import authRoutes from './auth.routes.js';
import donorRoutes from './donor.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Base API V1 routes
router.use('/auth', authRoutes);
router.use('/donors', donorRoutes);
router.use('/admin', adminRoutes);

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
