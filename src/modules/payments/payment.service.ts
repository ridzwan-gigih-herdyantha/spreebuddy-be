import type Stripe from 'stripe';
import { ApiError } from '../../common/errors/ApiError.js';
import { env } from '../../config/env.js';
import Order, { OrderStatus } from '../orders/order.model.js';
import type { OrderDocument } from '../orders/order.model.js';
import * as lifecycle from '../orders/order.lifecycle.js';
import type { ProductDocument } from '../products/product.model.js';
import Payment, {
  OrderPaymentStatus,
  PaymentStatus,
  ShippingAddress,
} from './payment.model.js';
import type { PaymentDocument } from './payment.model.js';
import { totalsFor, toMinor } from './payment.pricing.js';
import { stripe } from './stripe.client.js';

// Sessions Stripe keeps open; past this the checkout.session.expired event
// fires. Stripe's own floor is 30 minutes, so this stays clear of it.
const SESSION_TTL_MINUTES = 60;

async function loadPayment(id: string): Promise<PaymentDocument> {
  const payment = await Payment.findById(id);
  if (!payment) throw ApiError.notFound('Payment not found');
  return payment;
}

// Ownership is checked before populating: once userId holds the User document,
// String() renders the whole document and never matches an id.
export async function getPayment(id: string, isAdmin: boolean, userId: string) {
  const payment = await loadPayment(id);
  if (!isAdmin && String(payment.userId) !== userId) {
    throw ApiError.forbidden('This is not your payment');
  }
  return payment.populate('orderIds');
}

export async function getPaymentBySession(
  providerRef: string,
  isAdmin: boolean,
  userId: string,
) {
  const payment = await Payment.findOne({ providerRef });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (!isAdmin && String(payment.userId) !== userId) {
    throw ApiError.forbidden('This is not your payment');
  }
  return payment.populate('orderIds');
}

export async function listPayments(
  isAdmin: boolean,
  userId: string,
  skip: number,
  limit: number,
) {
  const filter = isAdmin ? {} : { userId };
  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return { payments, total };
}

// --- Checkout ---------------------------------------------------------------

// Only lines that are still pending and not already awaiting or settled by
// another payment may enter a new checkout.
async function collectPayableOrders(userId: string, orderIds: string[]) {
  const orders = await Order.find({ _id: { $in: orderIds } }).populate('productId');

  const details = [];
  const seen = new Set(orders.map((o) => String(o._id)));
  for (const id of orderIds) {
    if (!seen.has(id)) details.push({ field: 'orderIds', message: `Order ${id} not found` });
  }

  for (const order of orders) {
    if (String(order.userId) !== userId) {
      details.push({ field: 'orderIds', message: `Order ${order.id} is not yours` });
    } else if (order.status !== OrderStatus.PENDING) {
      details.push({
        field: 'orderIds',
        message: `Order ${order.id} is "${order.status}" and can no longer be paid`,
      });
    } else if (order.paymentStatus === OrderPaymentStatus.PAID) {
      details.push({ field: 'orderIds', message: `Order ${order.id} is already paid` });
    } else if (order.paymentStatus === OrderPaymentStatus.AWAITING) {
      details.push({
        field: 'orderIds',
        message: `Order ${order.id} already has a checkout in progress`,
      });
    }
  }

  if (details.length) throw ApiError.badRequest('These orders cannot be paid for', details);
  return orders;
}

function lineItems(orders: OrderDocument[], currency: string, tax: number, shipping: number) {
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = orders.map((order) => {
    const product = order.populated('productId')
      ? (order.productId as unknown as ProductDocument)
      : null;
    return {
      quantity: order.quantity,
      price_data: {
        currency,
        unit_amount: toMinor(order.price),
        product_data: { name: product?.name ?? 'Product' },
      },
    };
  });

  // Shipping and tax ride as their own lines so the Stripe total is identical to
  // the total stored on the Payment, with no second rounding path.
  if (shipping > 0) {
    items.push({
      quantity: 1,
      price_data: { currency, unit_amount: shipping, product_data: { name: 'Shipping' } },
    });
  }
  if (tax > 0) {
    items.push({
      quantity: 1,
      price_data: { currency, unit_amount: tax, product_data: { name: 'Tax' } },
    });
  }
  return items;
}

export async function createCheckout(
  userId: string,
  orderIds: string[],
  shippingAddress: ShippingAddress,
) {
  const orders = await collectPayableOrders(userId, orderIds);
  const totals = totalsFor(orders);
  const currency = env.stripe.currency;
  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);

  // The session is created first because its id is the payment's provider
  // reference. Metadata carries our own ids so a webhook can still be traced
  // back if the write below never lands.
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems(orders, currency, totals.tax, totals.shipping),
    client_reference_id: userId,
    metadata: { userId, orderIds: orderIds.join(',') },
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    success_url: `${env.appUrl}/checkout/success?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/checkout/cancelled?session={CHECKOUT_SESSION_ID}`,
  });

  const payment = await Payment.create({
    userId,
    orderIds: orders.map((o) => o._id),
    provider: 'stripe',
    providerRef: session.id,
    checkoutUrl: session.url ?? undefined,
    ...totals,
    currency,
    status: PaymentStatus.CREATED,
    shippingAddress,
    expiresAt,
  });

  await Order.updateMany(
    { _id: { $in: orders.map((o) => o._id) } },
    { $set: { paymentId: payment._id, paymentStatus: OrderPaymentStatus.AWAITING } },
  );

  return { payment, checkoutUrl: session.url };
}

// --- Settlement (driven by the webhook, never by the client) -----------------

export const findByProviderRef = (providerRef: string) => Payment.findOne({ providerRef });

async function setOrderPaymentStatus(payment: PaymentDocument, status: OrderPaymentStatus) {
  await Order.updateMany({ _id: { $in: payment.orderIds } }, { $set: { paymentStatus: status } });
}

export async function markPaid(payment: PaymentDocument, paymentIntentId?: string) {
  if (payment.status === PaymentStatus.PAID) return payment;

  payment.status = PaymentStatus.PAID;
  payment.paidAt = new Date();
  if (paymentIntentId) payment.paymentIntentId = paymentIntentId;
  await payment.save();

  await setOrderPaymentStatus(payment, OrderPaymentStatus.PAID);

  // Paying is what moves the order forward; the client is never trusted for this.
  const orders = await Order.find({ _id: { $in: payment.orderIds } });
  for (const order of orders) {
    if (order.status === OrderStatus.PENDING) {
      await lifecycle.transition(order, OrderStatus.PROCESSING);
    }
  }
  return payment;
}

export async function markFailed(payment: PaymentDocument, reason?: string) {
  if (payment.status === PaymentStatus.PAID) return payment;

  payment.status = PaymentStatus.FAILED;
  payment.failureReason = reason;
  await payment.save();

  // The orders stay pending so the customer can start a new checkout.
  await setOrderPaymentStatus(payment, OrderPaymentStatus.FAILED);
  return payment;
}

// An abandoned checkout must not hold stock forever, so its still-pending lines
// are cancelled, which releases the reservation through the ledger.
export async function markExpired(payment: PaymentDocument) {
  if (payment.status === PaymentStatus.PAID) return payment;

  payment.status = PaymentStatus.EXPIRED;
  await payment.save();
  await setOrderPaymentStatus(payment, OrderPaymentStatus.UNPAID);

  const orders = await Order.find({ _id: { $in: payment.orderIds } });
  for (const order of orders) {
    if (order.status === OrderStatus.PENDING) {
      await lifecycle.transition(order, OrderStatus.CANCELLED);
    }
  }
  return payment;
}
