import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { ApiError } from '../../common/errors/ApiError.js';

let client: Stripe | null = null;

export const paymentsConfigured = () => Boolean(env.stripe.secretKey);

// Built on first use rather than at import time, so the app still boots (and
// every other module still works) when no key is configured.
export function stripe(): Stripe {
  if (!env.stripe.secretKey) {
    throw ApiError.serviceUnavailable(
      'Payments are not configured on this server (STRIPE_SECRET_KEY is missing)',
    );
  }
  if (!client) {
    const base = env.stripe.apiBase ? new URL(env.stripe.apiBase) : null;
    client = new Stripe(env.stripe.secretKey, base
      ? {
          host: base.hostname,
          port: Number(base.port || (base.protocol === 'https:' ? 443 : 80)),
          protocol: base.protocol === 'https:' ? 'https' : 'http',
        }
      : undefined);
  }
  return client;
}
