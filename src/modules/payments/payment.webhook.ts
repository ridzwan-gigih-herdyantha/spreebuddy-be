import { Request, Response } from 'express';
import type Stripe from 'stripe';
import { env } from '../../config/env.js';
import { stripe } from './stripe.client.js';
import * as paymentService from './payment.service.js';
import { claimEvent, markEventApplied, markEventFailed } from './payment.idempotency.js';

const PROVIDER = 'stripe';

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

  // Claim the event before acting on it, so a redelivery cannot apply it twice.
  const { decision, attempts } = await claimEvent(PROVIDER, event.id, event.type);

  if (decision === 'duplicate') {
    return res.json({ received: true, duplicate: true });
  }

  // Someone else is mid-apply. Answering with an error asks Stripe to come
  // back later, by which time that delivery has either finished or lost its
  // lease — acknowledging here would risk dropping the event entirely.
  if (decision === 'in-progress') {
    return res.status(409).json({ success: false, message: 'Already being processed' });
  }

  if (decision === 'retry') {
    console.warn(`[payments] retaking ${event.type} (${event.id}), attempt ${attempts}`);
  }

  try {
    await apply(event);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    await markEventFailed(event.id, message);
    console.error(`[payments] failed to apply ${event.type} (${event.id})`, err);
    return res.status(500).json({ success: false, message: 'Failed to process the event' });
  }

  await markEventApplied(event.id);
  return res.json({ received: true });
}
