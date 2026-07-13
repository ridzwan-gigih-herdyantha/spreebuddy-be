import { Router } from 'express';
import {
  listCategories,
  getCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from './category.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { createCategorySchema, updateCategorySchema } from './category.schema.js';

const router = Router();

router.get('/', listCategories);
router.get('/:id', getCategory);

router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createCategorySchema),
  createCategoryHandler,
);
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(updateCategorySchema),
  updateCategoryHandler,
);
router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), deleteCategoryHandler);

export default router;
