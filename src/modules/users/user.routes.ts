import { Router } from 'express';
import { getUserHandler, listUsers, updateUserHandler } from './user.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { updateUserSchema } from './user.schema.js';
import { uploadAvatar } from './user.upload.js';

const router = Router();

// All user-management routes are authenticated + admin only.
router.get('/', authenticate, requireRole(ROLES.ADMIN), listUsers);
router.get('/:id', authenticate, requireRole(ROLES.ADMIN), getUserHandler);

// uploadAvatar parses multipart (JSON requests pass straight through), then zod validates.
router.patch(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  uploadAvatar,
  validateBody(updateUserSchema),
  updateUserHandler,
);

export default router;
