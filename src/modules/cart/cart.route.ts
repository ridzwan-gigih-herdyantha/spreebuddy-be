import { Router } from 'express';

import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import {
  getCartHandler,
  addToCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler,
} from './cart.controller.js';
import { createCartItemSchema, updateCartItemSchema } from './cart.schema.js';

const router = Router();

// Every cart route requires a logged-in user (their own cart).
router.use(authenticate);

router.get('/', getCartHandler);
router.post('/', validateBody(createCartItemSchema), addToCartHandler);
router.patch('/:productId', validateBody(updateCartItemSchema), updateCartItemHandler);
router.delete('/', clearCartHandler);
router.delete('/:productId', removeFromCartHandler);

export default router;
