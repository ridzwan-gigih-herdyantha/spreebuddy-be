import { describe, expect, it } from 'vitest';
import { createOrdersSchema, updateOrderStatusSchema } from '../src/modules/orders/order.schema.js';
import { createCheckoutSchema } from '../src/modules/payments/payment.schema.js';
import { sendMessageSchema } from '../src/modules/AI/ai.schema.js';
import { slugify } from '../src/common/utils/slug.js';
import { escapeRegExp } from '../src/common/utils/escapeRegex.js';
import { formatDateDMY } from '../src/common/utils/formatDate.js';

const address = {
  street: '10 Test Street',
  district: 'Central',
  city: 'Jakarta',
  state: 'DKI',
  zip: '10110',
  fullAddress: '10 Test Street, Central, Jakarta',
};
const orderId = 'a'.repeat(24);

describe('placing orders', () => {
  it('accepts a basket of valid lines', () => {
    const parsed = createOrdersSchema.safeParse({
      orders: [{ productId: orderId, quantity: 2 }],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an id that is not a mongo id', () => {
    expect(createOrdersSchema.safeParse({ orders: [{ productId: 'abc', quantity: 1 }] }).success).toBe(
      false,
    );
  });

  it('rejects a quantity below one, or a fractional one', () => {
    expect(createOrdersSchema.safeParse({ orders: [{ productId: orderId, quantity: 0 }] }).success).toBe(false);
    expect(createOrdersSchema.safeParse({ orders: [{ productId: orderId, quantity: 1.5 }] }).success).toBe(false);
  });

  it('rejects an empty basket', () => {
    expect(createOrdersSchema.safeParse({ orders: [] }).success).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'refunded' }).success).toBe(false);
    expect(updateOrderStatusSchema.safeParse({ status: 'shipped' }).success).toBe(true);
  });
});

describe('starting a checkout', () => {
  it('accepts order ids with a full address', () => {
    expect(
      createCheckoutSchema.safeParse({ orderIds: [orderId], shippingAddress: address }).success,
    ).toBe(true);
  });

  it('refuses a half-filled address', () => {
    const { zip: _zip, ...partial } = address;
    expect(
      createCheckoutSchema.safeParse({ orderIds: [orderId], shippingAddress: partial }).success,
    ).toBe(false);
  });

  it('refuses an address field that is only whitespace', () => {
    expect(
      createCheckoutSchema.safeParse({
        orderIds: [orderId],
        shippingAddress: { ...address, city: '   ' },
      }).success,
    ).toBe(false);
  });

  it('refuses a checkout with no orders', () => {
    expect(createCheckoutSchema.safeParse({ orderIds: [], shippingAddress: address }).success).toBe(
      false,
    );
  });
});

describe('chat messages', () => {
  it('trims the message, which is what ends up stored', () => {
    const parsed = sendMessageSchema.parse({ message: '  hello  ' });
    expect(parsed.message).toBe('hello');
  });

  it('refuses a message that is only whitespace', () => {
    expect(sendMessageSchema.safeParse({ message: '   ' }).success).toBe(false);
  });

  it('refuses a message beyond the length cap', () => {
    expect(sendMessageSchema.safeParse({ message: 'x'.repeat(4001) }).success).toBe(false);
  });
});

describe('small utilities', () => {
  it('slugifies names into url-safe text', () => {
    expect(slugify('Meja Kayu Jati!')).toBe('meja-kayu-jati');
    expect(slugify('  Hello   World  ')).toBe('hello-world');
    expect(slugify('Buku & Alat Tulis')).toBe('buku-alat-tulis');
  });

  it('escapes user input before it reaches a regular expression', () => {
    const escaped = escapeRegExp('price (50%) + tax [a.b]');
    expect(() => new RegExp(escaped)).not.toThrow();
    expect(new RegExp(escaped).test('price (50%) + tax [a.b]')).toBe(true);
  });

  it('formats dates the way the API exposes them', () => {
    expect(formatDateDMY(new Date(2026, 8, 5))).toBe('05/09/2026');
    expect(formatDateDMY(null)).toBeNull();
    expect(formatDateDMY('not a date')).toBeNull();
  });
});
