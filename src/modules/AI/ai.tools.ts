import { Type, FunctionDeclaration } from '@google/genai';
import * as wishlistService from '../wishlists/wishlist.service.js';
import * as productService from '../products/product.service.js';
import Product, { ProductDocument } from '../products/product.model.js';

// Compact product shape for the model (keeps token usage low).
function shapeProduct(p: ProductDocument) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice ?? null,
    stock: p.stock,
    type: p.type,
  };
}

// Structured, FE-renderable side-by-side comparison (products x attributes).
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
      { key: 'weight', label: 'Weight' },
      { key: 'dimensions', label: 'Dimensions' },
    ],
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice ?? null,
      effectivePrice: p.salePrice ?? p.regularPrice,
      stock: p.stock,
      category: p.category,
      type: p.type,
      weight: p.weight,
      dimensions: p.dimensions ?? null,
    })),
  };
}

// Tool schemas exposed to Gemini (the "List Allowed Queries").
export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_wishlist',
    description: "Get the current user's wishlist (their saved products).",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'modify_wishlist',
    description: "Add or remove a product from the current user's wishlist.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: 'The product id (24-hex string).' },
        action: { type: Type.STRING, enum: ['add', 'remove'], description: 'Whether to add or remove.' },
      },
      required: ['productId', 'action'],
    },
  },
  {
    name: 'search_products_by_keywords',
    description:
      'Search the catalog by keywords (matches name, description, or category). Returns up to 3 matching products.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: "The user's search keywords." } },
      required: ['query'],
    },
  },
  {
    name: 'get_products_by_ids',
    description:
      'Fetch specific products by their ids. Use when you already know the product id(s) (e.g. from a previous search or the wishlist).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'One or more product ids (24-hex strings).',
        },
      },
      required: ['productIds'],
    },
  },
  {
    name: 'compare_products',
    description:
      'Build a structured side-by-side comparison of 2-3 products by their ids. Use this whenever the user wants to compare specific products; then summarize and recommend.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 3 product ids to compare.',
        },
      },
      required: ['productIds'],
    },
  },
  {
    name: 'list_products',
    description: 'List products from the catalog (useful to suggest alternatives). Returns up to 20.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

type ToolArgs = Record<string, unknown>;

// Executes a tool call with the authenticated user's context. Always returns
// a JSON-serializable object (errors included) so the model can react.
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
        if (products.length < 2) {
          return { error: 'Need at least 2 valid products to compare.' };
        }
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
