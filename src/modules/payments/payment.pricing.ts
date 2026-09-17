// Money is handled in integer minor units everywhere below the API boundary.
// The store runs in IDR, which Stripe treats as a zero-decimal currency: the
// minor unit *is* the rupiah, so converting is a rounding step rather than a
// x100. Product prices are already stored as whole rupiah, which is why both
// helpers below are near-identities — they stay so the boundary is still
// explicit if a decimal currency is ever added.

export const TAX_RATE = 0.11;
export const FREE_SHIPPING_FROM = 300_000; // Rp300.000
export const SHIPPING_FLAT = 20_000; // Rp20.000

export const toMinor = (amount: number) => Math.round(amount);
export const toMajor = (minor: number) => minor;

export interface Totals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function totalsFor(lines: { price: number; quantity: number }[]): Totals {
  const subtotal = lines.reduce((sum, l) => sum + toMinor(l.price) * l.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}
