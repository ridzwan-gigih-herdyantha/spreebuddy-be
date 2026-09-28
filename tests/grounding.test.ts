import { describe, expect, it } from 'vitest';
import {
  checkGrounding,
  collectGrounded,
  correctionPrompt,
  type GroundedProduct,
} from '../src/modules/AI/ai.grounding.js';

const rows: GroundedProduct[] = [
  {
    id: 'a1b2c3d4e5f6a7b8c9d0e1f2',
    name: 'JLab Go Air Pop',
    slug: 'jlab-go-air-pop',
    regularPrice: 25,
    salePrice: null,
    stock: 15,
  },
  {
    id: 'b1b2c3d4e5f6a7b8c9d0e1f2',
    name: 'Skullcandy Dime 3',
    slug: 'skullcandy-dime-3',
    regularPrice: 34.99,
    salePrice: 29.99,
    stock: 29,
  },
];

const kinds = (reply: string, userText = '') =>
  checkGrounding(reply, rows, userText).violations.map((v) => v.kind);

describe('what a grounded reply is allowed to say', () => {
  it('accepts prices and links taken from the rows', () => {
    const reply = 'The JLab is $25.00 (/product/jlab-go-air-pop) and the Dime 3 is $29.99.';
    expect(checkGrounding(reply, rows, '').ok).toBe(true);
  });

  it('accepts the price something was discounted from', () => {
    expect(checkGrounding('Down from $34.99 to $29.99.', rows, '').ok).toBe(true);
  });

  it('accepts the gap between two rows', () => {
    expect(checkGrounding('That is $4.99 cheaper.', rows, '').ok).toBe(true);
  });

  it('accepts a budget the customer named themselves', () => {
    expect(checkGrounding('Both are under $150 as you asked.', rows, 'earbuds under $150').ok).toBe(
      true,
    );
  });

  it('accepts a stock level straight from the rows', () => {
    expect(checkGrounding('There are 29 in stock.', rows, '').ok).toBe(true);
  });

  it('does not mistake a percentage for a price', () => {
    expect(checkGrounding('Save 14% today.', rows, '').ok).toBe(true);
  });
});

describe('what it catches', () => {
  it('flags a price that belongs to no row', () => {
    expect(kinds('A steal at $19.99.')).toEqual(['unsupported-price']);
  });

  it('flags rupiah, because the catalogue is priced in dollars', () => {
    expect(kinds('Harganya Rp 428,31 saja.')).toContain('wrong-currency');
  });

  it('flags a link to a product the tools never returned', () => {
    expect(kinds('See /product/sony-wh-1000xm5 for more.')).toContain('unknown-product-link');
  });

  it('flags an invented product id', () => {
    expect(kinds('Product ffffffffffffffffffffffff is similar.')).toContain('unknown-product-id');
  });

  it('flags a stock level that matches no row', () => {
    expect(kinds('We have 999 in stock.')).toContain('unsupported-stock');
  });

  it('treats every price as ungrounded when no rows were returned', () => {
    expect(checkGrounding('It costs $10.00.', [], '').violations).toHaveLength(1);
  });

  it('reports the same problem once however often it is repeated', () => {
    expect(checkGrounding('$19.99 today, $19.99 tomorrow.', rows, '').violations).toHaveLength(1);
  });

  it('counts the rows it had to work from', () => {
    expect(checkGrounding('anything', rows, '').checked).toBe(2);
  });
});

describe('picking rows out of tool results', () => {
  it('reads a keyword search result', () => {
    const found = collectGrounded({ products: [{ id: 'x'.repeat(24), name: 'A', slug: 'a' }] });
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('A');
  });

  it('reads a wishlist result', () => {
    expect(collectGrounded({ items: [{ id: 'y'.repeat(24), name: 'B', slug: 'b' }] })).toHaveLength(
      1,
    );
  });

  it('reads a comparison, keeping the effective price', () => {
    const found = collectGrounded({
      type: 'comparison',
      fields: [{ key: 'regularPrice', label: 'Regular Price' }],
      products: [{ id: 'z'.repeat(24), name: 'C', slug: 'c', effectivePrice: 5 }],
    });
    expect(found).toHaveLength(1);
    expect(found[0].effectivePrice).toBe(5);
  });

  it('reads nothing out of a failed tool call', () => {
    expect(collectGrounded({ error: 'nope' })).toHaveLength(0);
  });

  it('does not mistake comparison column labels for products', () => {
    expect(collectGrounded({ fields: [{ key: 'regularPrice', label: 'Regular Price' }] })).toHaveLength(
      0,
    );
  });
});

describe('the correction handed back to the model', () => {
  it('lists the rows it is allowed to use and what went wrong', () => {
    const verdict = checkGrounding('A steal at $19.99.', rows, '');
    const prompt = correctionPrompt(verdict, rows);

    expect(prompt).toContain('unsupported-price: $19.99');
    expect(prompt).toContain('/product/jlab-go-air-pop');
    expect(prompt).toContain('$29.99');
    expect(prompt).toContain('US dollars');
  });

  it('tells the model to state nothing when there were no rows', () => {
    const verdict = checkGrounding('It costs $10.00.', [], '');
    expect(correctionPrompt(verdict, [])).toContain('No catalogue rows');
  });
});
