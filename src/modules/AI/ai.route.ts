import { Router } from 'express';
import {
  aiUsageHandler,
  chatStatsHandler,
  createSessionHandler,
  listSessionsHandler,
  getSessionHandler,
  deleteSessionHandler,
  sendMessageHandler,
  streamMessageHandler,
} from './ai.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { requireRole } from '../../common/middlewares/authorize.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { createSessionSchema, sendMessageSchema } from './ai.schema.js';

const router = Router();

router.use(authenticate);

router.get('/stats', requireRole(ROLES.ADMIN), chatStatsHandler);
router.get('/usage', requireRole(ROLES.ADMIN), aiUsageHandler);

router.get('/', listSessionsHandler);
router.post('/', validateBody(createSessionSchema), createSessionHandler);
router.get('/:id', getSessionHandler);
router.delete('/:id', deleteSessionHandler);
router.post('/:id/messages', validateBody(sendMessageSchema), sendMessageHandler);
router.post('/:id/stream', validateBody(sendMessageSchema), streamMessageHandler);

export default router;
