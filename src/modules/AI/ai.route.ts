import { Router } from 'express';
import {
  createSessionHandler,
  listSessionsHandler,
  getSessionHandler,
  deleteSessionHandler,
  sendMessageHandler,
  streamMessageHandler,
} from './ai.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { createSessionSchema, sendMessageSchema } from './ai.schema.js';

const router = Router();

router.use(authenticate);

router.get('/sessions', listSessionsHandler);
router.post('/sessions', validateBody(createSessionSchema), createSessionHandler);
router.get('/sessions/:id', getSessionHandler);
router.delete('/sessions/:id', deleteSessionHandler);
router.post('/sessions/:id/messages', validateBody(sendMessageSchema), sendMessageHandler);
router.post('/sessions/:id/stream', validateBody(sendMessageSchema), streamMessageHandler);

export default router;
