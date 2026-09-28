import { describe, expect, it } from 'vitest';
import { LEASE_MS, decideClaim } from '../src/modules/payments/payment.idempotency.js';

const NOW = new Date('2026-09-28T12:00:00Z').getTime();
const agedBy = (ms: number) => new Date(NOW - ms);

describe('deciding what a webhook delivery may do', () => {
  it('applies an event nobody has seen', () => {
    expect(decideClaim(null, NOW)).toBe('apply');
  });

  it('acknowledges a redelivery of something already applied', () => {
    expect(decideClaim({ status: 'applied', receivedAt: agedBy(0) }, NOW)).toBe('duplicate');
  });

  it('acknowledges it however old the original was', () => {
    expect(decideClaim({ status: 'applied', receivedAt: agedBy(30 * 86_400_000) }, NOW)).toBe(
      'duplicate',
    );
  });

  it('stands aside while another delivery is genuinely working on it', () => {
    expect(decideClaim({ status: 'processing', receivedAt: agedBy(5_000) }, NOW)).toBe(
      'in-progress',
    );
  });

  it('takes over a claim whose holder went away mid-apply', () => {
    expect(decideClaim({ status: 'processing', receivedAt: agedBy(LEASE_MS + 1) }, NOW)).toBe(
      'retry',
    );
  });

  it('takes over the moment the lease is up, not a beat later', () => {
    expect(decideClaim({ status: 'processing', receivedAt: agedBy(LEASE_MS) }, NOW)).toBe('retry');
    expect(decideClaim({ status: 'processing', receivedAt: agedBy(LEASE_MS - 1) }, NOW)).toBe(
      'in-progress',
    );
  });

  it('retries an attempt that failed, without waiting for any lease', () => {
    expect(decideClaim({ status: 'failed', receivedAt: agedBy(0) }, NOW)).toBe('retry');
  });

  it('gives the lease enough room for a slow handler but not an abandoned one', () => {
    // A serverless invocation is capped well under a minute; the lease has to
    // outlast that, and still be short next to Stripe's days of retries.
    expect(LEASE_MS).toBeGreaterThan(60_000);
    expect(LEASE_MS).toBeLessThan(10 * 60_000);
  });

  it('treats a row written before this lifecycle existed as already applied', () => {
    // The old code only ever wrote the row after a successful apply, and
    // deleted it on failure, so its mere existence means the work is done.
    expect(decideClaim({ receivedAt: agedBy(86_400_000) }, NOW)).toBe('duplicate');
    expect(decideClaim({ status: undefined, receivedAt: agedBy(0) }, NOW)).toBe('duplicate');
  });

  it('never decides to apply an event it has a record of', () => {
    for (const status of ['processing', 'applied', 'failed', undefined] as const) {
      for (const age of [0, 1_000, LEASE_MS, 86_400_000]) {
        expect(decideClaim({ status, receivedAt: agedBy(age) }, NOW)).not.toBe('apply');
      }
    }
  });
});
