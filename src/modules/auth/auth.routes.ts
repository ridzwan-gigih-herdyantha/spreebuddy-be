import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, registerHandler } from './auth.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { fileService } from '../../common/services/file.service.js';
import { registerSchema } from './auth.schema.js';

const router = Router();

// Avatar upload config (optional image, max 2MB).
const uploadAvatar = fileService.single({
  category: 'avatars',
  field: 'avatar',
  allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeMB: 2,
});

// multer parses the multipart body first, then zod validates it.
router.post('/register', uploadAvatar, validateBody(registerSchema), registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
