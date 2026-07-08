import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from './product.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { createProductSchema, updateProductSchema } from './product.schema.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createProductSchema),
  createProductHandler,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(updateProductSchema),
  updateProductHandler,
);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), deleteProductHandler);

export default router;

