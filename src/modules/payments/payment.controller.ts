import { Request, Response } from 'express';
import { sendCreated, sendSuccess } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';
import { ROLES } from '../../common/constants/roles.js';
import * as paymentService from './payment.service.js';
import { PaymentResource } from './payment.resource.js';
import { CreateCheckoutBody } from './payment.schema.js';
import { FREE_SHIPPING_FROM, SHIPPING_FLAT, TAX_RATE, toMajor } from './payment.pricing.js';
import { paymentsConfigured } from './stripe.client.js';

const isAdmin = (req: Request) => req.user!.role === ROLES.ADMIN;

// Lets the storefront render the same totals the server will charge, instead of
// hard-coding a second copy of the rules.
export async function paymentConfigHandler(_req: Request, res: Response) {
  return sendSuccess(
    res,
    {
      enabled: paymentsConfigured(),
      provider: 'stripe',
      taxRate: TAX_RATE,
      freeShippingFrom: toMajor(FREE_SHIPPING_FROM),
      shippingFlat: toMajor(SHIPPING_FLAT),
    },
    'Payment config retrieved',
  );
}

export async function createCheckoutHandler(req: Request, res: Response) {
  const { orderIds, shippingAddress } = req.body as CreateCheckoutBody;
  const { payment, checkoutUrl } = await paymentService.createCheckout(
    req.user!.id,
    orderIds,
    shippingAddress,
  );
  return sendCreated(
    res,
    { ...PaymentResource.item(payment), checkoutUrl },
    'Checkout session created',
  );
}

export async function listPaymentsHandler(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);
  const { payments, total } = await paymentService.listPayments(
    isAdmin(req),
    req.user!.id,
    skip,
    limit,
  );
  return sendSuccess(
    res,
    PaymentResource.collection(payments),
    'Payments retrieved',
    200,
    paginationMeta(total, page, limit),
  );
}

export async function getPaymentBySessionHandler(req: Request, res: Response) {
  const payment = await paymentService.getPaymentBySession(
    String(req.params.providerRef),
    isAdmin(req),
    req.user!.id,
  );
  return sendSuccess(res, PaymentResource.item(payment), 'Payment retrieved');
}

export async function getPaymentHandler(req: Request, res: Response) {
  const payment = await paymentService.getPayment(
    String(req.params.id),
    isAdmin(req),
    req.user!.id,
  );
  return sendSuccess(res, PaymentResource.item(payment), 'Payment retrieved');
}
