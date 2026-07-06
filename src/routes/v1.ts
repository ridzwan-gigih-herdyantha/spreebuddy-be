import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';

const router = Router();

// API v1 index — lists available endpoints.
router.get('/', (_req, res) => {
  res.json({
    success: true,
    version: 'v1',
    endpoints: {
      health: '/api/v1/health',
    },
  });
});

// Mount v1 feature routers here.
router.use('/health', healthRoutes);
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

export default router;
