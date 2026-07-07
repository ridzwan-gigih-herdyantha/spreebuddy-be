import { Router } from 'express';
import { listUsers } from './user.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { ROLES } from '../../common/constants/roles.js';

const router = Router();

// GET /api/v1/users — authenticated + admin only.
router.get('/', authenticate, requireRole(ROLES.ADMIN), listUsers);

export default router;
