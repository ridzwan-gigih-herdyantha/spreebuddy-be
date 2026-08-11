import { Types } from 'mongoose';
import { ApiError } from '../../common/errors/ApiError.js';
import Cart, { CartDocument, CartItemStatus, ICartItem } from './cart.model.js';
import Product, { ProductDocument } from '../products/product.model.js';

function effectivePrice(product: ProductDocument): number {
  return product.salePrice ?? product.regularPrice;
}

// Cart total = sum of the ACTIVE items' line totals.
function recalcTotal(cart: CartDocument) {
  cart.total = cart.items
    .filter((i) => i.status === CartItemStatus.ACTIVE)
    .reduce((sum, i) => sum + i.total, 0);
}

async function getOrCreateCart(userId: string): Promise<CartDocument> {
  const cart = await Cart.findOne({ userId });
  if (cart) return cart;
  return Cart.create({ userId, items: [], total: 0 });
}

function findActiveItem(cart: CartDocument, productId: string) {
  return cart.items.find(
    (i) => String(i.productId) === productId && i.status === CartItemStatus.ACTIVE,
  );
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  return cart.populate('items.productId');
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const cart = await getOrCreateCart(userId);
  const existing = findActiveItem(cart, productId);
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (nextQuantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} unit(s) of this product are in stock`);
  }

  const price = effectivePrice(product);
  if (existing) {
    existing.quantity = nextQuantity;
    existing.total = price * nextQuantity;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(productId),
      quantity,
      status: CartItemStatus.ACTIVE,
      total: price * quantity,
    } as unknown as ICartItem);
  }

  recalcTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
}

export async function updateItemQuantity(userId: string, productId: string, quantity: number) {
  const cart = await getOrCreateCart(userId);
  const item = findActiveItem(cart, productId);
  if (!item) throw ApiError.notFound('Cart item not found');

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (quantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} unit(s) of this product are in stock`);
  }

  item.quantity = quantity;
  item.total = effectivePrice(product) * quantity;

  recalcTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
}

export async function removeFromCart(userId: string, productId: string) {
  const cart = await getOrCreateCart(userId);
  const item = findActiveItem(cart, productId);
  if (!item) throw ApiError.notFound('Cart item not found');

  item.deleteOne();
  recalcTotal(cart);
  await cart.save();
  return cart.populate('items.productId');
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  cart.items.splice(0, cart.items.length);
  cart.total = 0;
  await cart.save();
  return cart;
}
