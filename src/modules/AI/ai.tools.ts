import type { OpenAI } from 'openai';
import * as wishlistService from '../wishlists/wishlist.service.js';
import * as productService from '../products/product.service.js';
import Product, { ProductDocument } from '../products/product.model.js';

function shapeProduct(p: ProductDocument) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice ?? null,
    stock: p.stock,
    type: p.type,
  };
}

// Structured side-by-side comparison the FE can render as a table.
export function buildComparison(products: ProductDocument[]) {
  return {
    type: 'comparison' as const,
    fields: [
      { key: 'regularPrice', label: 'Regular Price' },
      { key: 'salePrice', label: 'Sale Price' },
      { key: 'effectivePrice', label: 'Effective Price' },
      { key: 'stock', label: 'Stock' },
      { key: 'category', label: 'Category' },
      { key: 'type', label: 'Type' },
    ],
    products: products.map((p) => ({
      ...shapeProduct(p),
      effectivePrice: p.salePrice ?? p.regularPrice,
    })),
  };
}

export const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_wishlist',
      description: "Get the current user's wishlist (their saved products).",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'modify_wishlist',
      description: "Add or remove a product from the current user's wishlist.",
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Product id (24-hex).' },
          action: { type: 'string', enum: ['add', 'remove'] },
        },
        required: ['productId', 'action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products_by_keywords',
      description: 'Search the catalog by keywords (name, description, category). Returns up to 3.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: "The user's search keywords." } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_products_by_ids',
      description: 'Fetch specific products by their ids.',
      parameters: {
        type: 'object',
        properties: {
          productIds: { type: 'array', items: { type: 'string' }, description: 'Product ids.' },
        },
        required: ['productIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_products',
      description: 'Build a structured comparison of 2-3 products by id, then summarize + recommend.',
      parameters: {
        type: 'object',
        properties: {
          productIds: { type: 'array', items: { type: 'string' }, description: '2-3 product ids.' },
        },
        required: ['productIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_products',
      description: 'List products from the catalog (to suggest alternatives). Returns up to 20.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

type ToolArgs = Record<string, unknown>;

export async function executeTool(
  name: string,
  args: ToolArgs,
  ctx: { userId: string },
): Promise<Record<string, unknown>> {
  try {
    switch (name) {
      case 'get_wishlist': {
        const { items } = await wishlistService.listWishlist(ctx.userId, { skip: 0, limit: 50 });
        return {
          items: items
            .filter((w) => w.populated('productId'))
            .map((w) => shapeProduct(w.productId as unknown as ProductDocument)),
        };
      }
      case 'modify_wishlist': {
        const productId = String(args.productId);
        if (args.action === 'remove') {
          await wishlistService.removeFromWishlist(ctx.userId, productId);
          return { success: true, message: 'Removed from wishlist' };
        }
        await wishlistService.addToWishlist(ctx.userId, productId);
        return { success: true, message: 'Added to wishlist' };
      }
      case 'search_products_by_keywords': {
        const { products } = await productService.listProducts({
          skip: 0,
          limit: 3,
          search: String(args.query ?? ''),
        });
        return { products: products.map(shapeProduct) };
      }
      case 'get_products_by_ids': {
        const ids = Array.isArray(args.productIds) ? args.productIds.map(String) : [];
        const products = await productService.getProductByMultiId(ids);
        return { products: products.map(shapeProduct) };
      }
      case 'compare_products': {
        const ids = Array.isArray(args.productIds) ? args.productIds.map(String) : [];
        const products = await productService.getProductByMultiId(ids);
        if (products.length < 2) return { error: 'Need at least 2 valid products to compare.' };
        return buildComparison(products);
      }
      case 'list_products': {
        const products = await Product.find().limit(20);
        return { products: products.map(shapeProduct) };
      }
      default:
        return { error: `Unknown tool "${name}"` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Tool execution failed' };
  }
}
