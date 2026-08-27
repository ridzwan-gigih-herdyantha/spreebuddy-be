import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  updateMeHandler,
} from './auth.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { registerSchema } from './auth.schema.js';
import { updateUserSchema } from '../users/user.schema.js';
import { uploadAvatar } from '../users/user.upload.js';

const router = Router();

// multer parses the multipart body first, then zod validates it.
router.post('/register', uploadAvatar, validateBody(registerSchema), registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, uploadAvatar, validateBody(updateUserSchema), updateMeHandler);

export default router;
