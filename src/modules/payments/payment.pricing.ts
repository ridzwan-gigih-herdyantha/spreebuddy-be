// Money is handled in integer minor units (cents) everywhere below the API
// boundary; product prices are stored as decimal dollars, so they convert here
// and nowhere else.

export const TAX_RATE = 0.11;
export const FREE_SHIPPING_FROM = 10_000; // $100.00
export const SHIPPING_FLAT = 999; // $9.99

export const toCents = (dollars: number) => Math.round(dollars * 100);
export const toDollars = (cents: number) => cents / 100;

export interface Totals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function totalsFor(lines: { price: number; quantity: number }[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + toCents(l.price) * l.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}
