import { Router } from 'express';
import {
  createCheckoutHandler,
  getPaymentHandler,
  listPaymentsHandler,
  paymentConfigHandler,
} from './payment.controller.js';
import { authenticate } from '../../common/middlewares/authenticate.middleware.js';
import { validateBody } from '../../common/middlewares/validate.middleware.js';
import { createCheckoutSchema } from './payment.schema.js';

const router = Router();

// The webhook is mounted in app.ts instead, ahead of the JSON body parser and
// outside this router, because it is called by Stripe and carries no token.
router.get('/config', paymentConfigHandler);

router.use(authenticate);

router.get('/', listPaymentsHandler);
router.post('/checkout', validateBody(createCheckoutSchema), createCheckoutHandler);
router.get('/:id', getPaymentHandler);

export default router;
