import { Router } from 'express';
import { sendSuccess } from '../common/http/response.js';
import healthRoutes from '../modules/health/health.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import productRoutes from '../modules/products/product.route.js';
import categoryRoutes from '../modules/categories/category.route.js';
import wishlistRoutes from '../modules/wishlists/wishlist.route.js';
import orderRoutes from '../modules/orders/order.route.js';
import aiRoutes from '../modules/AI/ai.route.js';
import cartRoutes from '../modules/cart/cart.route.js';

import rateLimit from 'express-rate-limit';
// import MongoStore from 'rate-limit-mongo';
// import { env } from '../config/env.js';
import { ApiError } from '../common/errors/ApiError.js';

const router = Router();

const AuthLimiter = rateLimit({handler: (req, res) => {
    throw ApiError.tooManyRequests('Too many requests from this IP, please try again later.');
  },
  // store: new MongoStore({
  //   uri: `${env.mongoUri}`,
  //   // user: 'mongouser',
  //   // password: 'mongopassword',
  //   // should match windowMs
  //   expireTimeMs: 1 * 60 * 1000,
  //   errorHandler: console.error.bind(null, 'rate-limit-mongo')
  //   // see Configuration section for more options and details
  // }),
	windowMs: 1 * 60 * 1000, // 1 minute
	limit: 6, // Limit each IP to 6 requests per `window` (here, per 1 minute)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

const AiLimiter = rateLimit({
  // store: new MongoStore({
  //   uri: `${process.env.MONGO_URI}`,
  //   user: 'mongouser',
  //   password: 'mongopassword',
  //   // should match windowMs
  //   expireTimeMs: 15 * 60 * 1000,
  //   errorHandler: console.error.bind(null, 'rate-limit-mongo')
  //   // see Configuration section for more options and details
  // }),
	windowMs: 3 * 60 * 1000, // 3 minutes
	limit: 80, // Limit each IP to 80 requests per `window` (here, per 3 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})

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
        categories: 'GET /api/v1/categories',
        wishlist: 'GET /api/v1/wishlists',
        orders: 'GET /api/v1/orders',
        cart: 'GET /api/v1/cart',
      },
    },
    'API v1',
  );
});

// Mount v1 feature routers here.
router.use('/health', healthRoutes);
router.use('/auth', AuthLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/wishlists', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/carts', cartRoutes);
router.use('/sessions', AiLimiter, aiRoutes);

export default router;
