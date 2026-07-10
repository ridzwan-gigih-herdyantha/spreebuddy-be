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

// The whole AI chat feature requires a logged-in user.
router.use(authenticate);

router.get('/', listSessionsHandler);
router.post('/', validateBody(createSessionSchema), createSessionHandler);
router.get('/:id', getSessionHandler);
router.delete('/:id', deleteSessionHandler);
router.post('/:id/messages', validateBody(sendMessageSchema), sendMessageHandler);
router.post('/:id/stream', validateBody(sendMessageSchema), streamMessageHandler);

export default router;
