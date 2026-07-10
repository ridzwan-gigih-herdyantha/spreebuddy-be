import { Router } from 'express';
import {
  listWishlistHandler,
  addWishlistHandler,
  removeWishlistHandler,
  checkWishlistHandler,
} from './wishlist.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { addWishlistSchema } from './wishlist.schema.js';

const router = Router();

// Every wishlist route requires a logged-in user (their own wishlist).
router.use(authenticate);

router.get('/', listWishlistHandler);
router.post('/', validateBody(addWishlistSchema), addWishlistHandler);
router.get('/check/:productId', checkWishlistHandler);
router.delete('/:productId', removeWishlistHandler);

export default router;
