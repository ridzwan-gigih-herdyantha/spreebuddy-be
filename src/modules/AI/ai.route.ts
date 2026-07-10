import { Router } from 'express';
import {
  createSessionHandler,
  listSessionsHandler,
  getSessionHandler,
  deleteSessionHandler,
  sendMessageHandler,
} from './ai.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { createSessionSchema, sendMessageSchema } from './ai.schema.js';

const router = Router();

// The whole AI chat feature requires a logged-in user.
router.use(authenticate);

router.get('/sessions', listSessionsHandler);
router.post('/sessions', validateBody(createSessionSchema), createSessionHandler);
router.get('/sessions/:id', getSessionHandler);
router.delete('/sessions/:id', deleteSessionHandler);
router.post('/sessions/:id/messages', validateBody(sendMessageSchema), sendMessageHandler);

export default router;
