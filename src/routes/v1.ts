import { Router } from 'express';
import { sendSuccess } from '../common/http/response.js';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import productRoutes from '../modules/products/product.route.js';
import wishlistRoutes from '../modules/wishlists/wishlist.route.js';
import orderRoutes from '../modules/orders/order.route.js';

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
        products: 'GET /api/v1/products',
        wishlist: 'GET /api/v1/wishlists',
        orders: 'GET /api/v1/orders',
      },
    },
    'API v1',
  );
});

// Mount v1 feature routers here.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/wishlists', wishlistRoutes);
router.use('/orders', orderRoutes);

export default router;
