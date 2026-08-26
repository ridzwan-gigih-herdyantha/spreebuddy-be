import { Router } from 'express';
import {
  createOrdersHandler,
  orderStatsHandler,
  listOrdersHandler,
  getOrderHandler,
  cancelOrderHandler,
  updateOrderStatusHandler,
  deleteOrderHandler,
} from './order.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { createOrdersSchema, updateOrderStatusSchema } from './order.schema.js';

const router = Router();

// Every order route requires a logged-in user.
router.use(authenticate);

router.get('/', listOrdersHandler);
router.post('/', validateBody(createOrdersSchema), createOrdersHandler);
router.get('/stats', requireRole(ROLES.ADMIN), orderStatsHandler);
router.get('/:id', getOrderHandler);

// Admin only, only from pending/processing.
router.patch('/:id/cancel', requireRole(ROLES.ADMIN), cancelOrderHandler);

// Admin lifecycle management.
router.patch('/:id/status', requireRole(ROLES.ADMIN), validateBody(updateOrderStatusSchema), updateOrderStatusHandler);
router.delete('/:id', requireRole(ROLES.ADMIN), deleteOrderHandler);

export default router;
