import { Request, Response } from 'express';
import type Stripe from 'stripe';
import { env } from '../../config/env.js';
import { stripe } from './stripe.client.js';
import WebhookEvent from './webhookEvent.model.js';
import * as paymentService from './payment.service.js';

const PROVIDER = 'stripe';

const isDuplicateKey = (err: unknown) =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

const intentId = (value: Stripe.Checkout.Session['payment_intent']) =>
  typeof value === 'string' ? value : (value?.id ?? undefined);

async function apply(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const payment = await paymentService.findByProviderRef(session.id);

  // A session we have no record of: nothing to settle, and retrying will not
  // help, so it is acknowledged rather than failed.
  if (!payment) {
    console.warn(`[payments] ${event.type} for unknown session ${session.id}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Delayed methods complete the session while still unpaid; the
      // async_payment_* event settles those.
      if (session.payment_status === 'paid') {
        await paymentService.markPaid(payment, intentId(session.payment_intent));
      }
      return;

    case 'checkout.session.async_payment_succeeded':
      await paymentService.markPaid(payment, intentId(session.payment_intent));
      return;

    case 'checkout.session.async_payment_failed':
      await paymentService.markFailed(payment, 'The payment was declined');
      return;

    case 'checkout.session.expired':
      await paymentService.markExpired(payment);
      return;

    default:
      return;
  }
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'];
  const secret = env.stripe.webhookSecret;

  if (!secret) {
    console.error('[payments] webhook received but STRIPE_WEBHOOK_SECRET is not set');
    return res.status(503).json({ success: false, message: 'Webhook is not configured' });
  }

  let event: Stripe.Event;
  try {
    // Verified against the raw body; express.json() must not run on this route.
    event = stripe().webhooks.constructEvent(req.body, String(signature ?? ''), secret);
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'invalid signature';
    console.warn(`[payments] rejected webhook: ${reason}`);
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  // Claim the event before acting on it. The unique index means a redelivery
  // of an event we already applied stops here.
  try {
    await WebhookEvent.create({ provider: PROVIDER, eventId: event.id, type: event.type });
  } catch (err) {
    if (isDuplicateKey(err)) return res.json({ received: true, duplicate: true });
    throw err;
  }

  try {
    await apply(event);
  } catch (err) {
    // Release the claim so the provider's retry can apply it properly.
    await WebhookEvent.deleteOne({ eventId: event.id });
    console.error(`[payments] failed to apply ${event.type} (${event.id})`, err);
    return res.status(500).json({ success: false, message: 'Failed to process the event' });
  }

  return res.json({ received: true });
}
