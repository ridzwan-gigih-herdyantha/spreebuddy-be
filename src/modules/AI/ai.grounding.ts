// Checks a generated reply against the catalogue rows the tools actually
// returned during the same turn. Only objective, checkable claims are examined
// — product links, ids, prices, currency and stock — because a guard that
// fires on a false positive costs a wasted model call and a worse answer.

export type GroundedProduct = {
  id?: string;
  name?: string;
  slug?: string;
  regularPrice?: number | null;
  salePrice?: number | null;
  effectivePrice?: number | null;
  stock?: number | null;
};

export type ViolationKind =
  | 'unknown-product-link'
  | 'unknown-product-id'
  | 'unsupported-price'
  | 'unsupported-stock'
  | 'wrong-currency';

export interface Violation {
  kind: ViolationKind;
  value: string;
}

export interface GroundingVerdict {
  ok: boolean;
  checked: number;
  violations: Violation[];
}

const OBJECT_ID = /\b[0-9a-f]{24}\b/gi;
const PRODUCT_LINK = /\/product\/([a-z0-9-]+)/gi;
const USD = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;
const RUPIAH = /\bRp\.?\s?([\d.,]+)/gi;
const STOCK = /(\d[\d.,]*)\s*(?:in stock|left in stock|units? in stock|stok|tersisa)/gi;
const NUMBER = /\d+(?:[.,]\d+)?/g;

const money = (value: number) => value.toFixed(2);

// A reply is allowed to name a product row's price, the gap between two of
// them, the sum of two, or any number the customer themselves mentioned.
function allowedAmounts(products: GroundedProduct[], userText: string): Set<string> {
  const prices: number[] = [];
  for (const product of products) {
    for (const value of [product.regularPrice, product.salePrice, product.effectivePrice]) {
      if (typeof value === 'number' && Number.isFinite(value)) prices.push(value);
    }
  }

  const allowed = new Set<string>();
  for (const price of prices) allowed.add(money(price));
  for (const a of prices) {
    for (const b of prices) {
      allowed.add(money(Math.abs(a - b)));
      allowed.add(money(a + b));
    }
  }
  for (const match of userText.match(NUMBER) ?? []) {
    const parsed = Number(match.replace(',', '.'));
    if (Number.isFinite(parsed)) allowed.add(money(parsed));
  }
  return allowed;
}

const parseUsd = (raw: string) => Number(raw.replace(/,/g, ''));

// "Rp 428,31" is 428.31: Indonesian formatting puts the decimal after a comma
// and groups thousands with dots.
function parseRupiah(raw: string): number {
  const clean = raw.replace(/\s/g, '');
  if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(clean)) {
    return Number(clean.replace(/\./g, '').replace(',', '.'));
  }
  return Number(clean.replace(/[.,]/g, ''));
}

function collectFrom(value: unknown, into: GroundedProduct[]): void {
  if (Array.isArray(value)) {
    for (const entry of value) collectFrom(entry, into);
    return;
  }
  if (!value || typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  if (typeof record.id === 'string' && typeof record.name === 'string') {
    into.push(record as GroundedProduct);
  }
  for (const nested of Object.values(record)) {
    if (nested && typeof nested === 'object') collectFrom(nested, into);
  }
}

// Tool results carry catalogue rows under different keys (products, items, a
// comparison), so rows are picked out by shape rather than by key.
export function collectGrounded(toolResult: unknown): GroundedProduct[] {
  const found: GroundedProduct[] = [];
  collectFrom(toolResult, found);
  return found;
}

export function checkGrounding(
  reply: string,
  products: GroundedProduct[],
  userText: string,
): GroundingVerdict {
  const violations: Violation[] = [];
  const seen = new Set<string>();
  const add = (kind: ViolationKind, value: string) => {
    const key = `${kind}:${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    violations.push({ kind, value });
  };

  const slugs = new Set(products.map((p) => p.slug).filter(Boolean) as string[]);
  const ids = new Set(products.map((p) => p.id).filter(Boolean) as string[]);
  const stocks = new Set(
    products
      .map((p) => p.stock)
      .filter((value): value is number => typeof value === 'number')
      .map(String),
  );
  const amounts = allowedAmounts(products, userText);

  for (const [, slug] of reply.matchAll(PRODUCT_LINK)) {
    if (!slugs.has(slug)) add('unknown-product-link', slug);
  }

  for (const [id] of reply.matchAll(OBJECT_ID)) {
    if (!ids.has(id.toLowerCase())) add('unknown-product-id', id);
  }

  for (const [, raw] of reply.matchAll(USD)) {
    const value = parseUsd(raw);
    if (Number.isFinite(value) && !amounts.has(money(value))) {
      add('unsupported-price', `$${raw}`);
    }
  }

  // Prices are stored and charged in USD, so a rupiah figure is wrong whatever
  // the number says.
  for (const [, raw] of reply.matchAll(RUPIAH)) {
    add('wrong-currency', `Rp ${raw}`);
    const value = parseRupiah(raw);
    if (Number.isFinite(value) && !amounts.has(money(value))) {
      add('unsupported-price', `Rp ${raw}`);
    }
  }

  for (const [, raw] of reply.matchAll(STOCK)) {
    const value = raw.replace(/[.,]/g, '');
    if (!stocks.has(value)) add('unsupported-stock', value);
  }

  return { ok: violations.length === 0, checked: products.length, violations };
}

export function correctionPrompt(verdict: GroundingVerdict, products: GroundedProduct[]): string {
  const rows = products
    .map((p) => {
      const price = p.salePrice ?? p.effectivePrice ?? p.regularPrice;
      return `- ${p.name} (id ${p.id}, /product/${p.slug}) — $${typeof price === 'number' ? money(price) : '?'}, stock ${p.stock ?? '?'}`;
    })
    .join('\n');

  const listed = verdict.violations.map((v) => `${v.kind}: ${v.value}`).join('; ');

  return [
    'Your previous answer contained details that are not in the catalogue data you were given.',
    `Problems found — ${listed}.`,
    'Rewrite the answer for the user using ONLY these rows, in plain text, calling no tools.',
    'Prices are in US dollars. Never convert them, and never write a price, stock level, id or product link that is not listed here.',
    products.length ? `Catalogue rows:\n${rows}` : 'No catalogue rows were returned, so do not state any product facts.',
  ].join('\n');
}
