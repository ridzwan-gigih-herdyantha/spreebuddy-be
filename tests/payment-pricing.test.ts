import { describe, expect, it } from 'vitest';
import {
  FREE_SHIPPING_FROM,
  SHIPPING_FLAT,
  TAX_RATE,
  toCents,
  toDollars,
  totalsFor,
} from '../src/modules/payments/payment.pricing.js';

describe('converting money', () => {
  it('rounds to whole cents rather than truncating', () => {
    expect(toCents(10.07)).toBe(1007);
    expect(toCents(0.005)).toBe(1);
    expect(toCents(29.99)).toBe(2999);
  });

  it('survives a round trip', () => {
    expect(toDollars(toCents(1234.56))).toBe(1234.56);
  });

  it('never leaves a fraction of a cent for Stripe', () => {
    for (const price of [10.07, 0.1, 33.333, 19.995]) {
      expect(Number.isInteger(toCents(price))).toBe(true);
    }
  });
});

describe('what a basket costs', () => {
  it('adds up the lines in cents', () => {
    const totals = totalsFor([{ price: 25, quantity: 2 }, { price: 29.99, quantity: 1 }]);
    expect(totals.subtotal).toBe(7999);
  });

  it('charges flat shipping below the free threshold', () => {
    const totals = totalsFor([{ price: 20, quantity: 1 }]);
    expect(totals.shipping).toBe(SHIPPING_FLAT);
  });

  it('ships free exactly at the threshold, not just above it', () => {
    const totals = totalsFor([{ price: toDollars(FREE_SHIPPING_FROM), quantity: 1 }]);
    expect(totals.subtotal).toBe(FREE_SHIPPING_FROM);
    expect(totals.shipping).toBe(0);
  });

  it('charges no shipping on an empty basket', () => {
    expect(totalsFor([])).toEqual({ subtotal: 0, shipping: 0, tax: 0, total: 0 });
  });

  it('taxes the goods, not the shipping', () => {
    const totals = totalsFor([{ price: 20, quantity: 1 }]);
    expect(totals.tax).toBe(Math.round(2000 * TAX_RATE));
  });

  it('always reports a total its own parts add up to', () => {
    for (const price of [9.99, 20, 100, 249.95]) {
      const totals = totalsFor([{ price, quantity: 3 }]);
      expect(totals.total).toBe(totals.subtotal + totals.shipping + totals.tax);
      expect(Number.isInteger(totals.total)).toBe(true);
    }
  });
});
