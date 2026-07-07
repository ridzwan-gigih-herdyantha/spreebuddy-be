import { Router } from 'express';
import { sendSuccess } from '../common/http/response.js';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';

const router = Router();

// API v1 index — lists available endpoints.
router.get('/', (_req, res) => {
  sendSuccess(
    res,
    {
      version: 'v1',
      endpoints: {
        health: '/api/v1/health',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        users: 'GET /api/v1/users (admin)',
      },
    },
    'API v1',
  );
});

// Mount v1 feature routers here.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

export default router;
