import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, registerHandler } from './auth.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
