import { ApiError } from '../../common/errors/ApiError.js';
import Wishlist from './wishlist.model.js';
import Product from '../products/product.model.js';

export async function listWishlist(userId: string, skip: number, limit: number) {
  const [items, total] = await Promise.all([
    Wishlist.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('productId'),
    Wishlist.countDocuments({ userId }),
  ]);
  return { items, total };
}

export async function addToWishlist(userId: string, productId: string, note?: string) {
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) throw ApiError.conflict('Product already in wishlist');

  const item = await Wishlist.create({ userId, productId, note });
  return item.populate('productId');
}

export async function removeFromWishlist(userId: string, productId: string) {
  const item = await Wishlist.findOneAndDelete({ userId, productId });
  if (!item) throw ApiError.notFound('Wishlist item not found');
  return item;
}

export async function isWishlisted(userId: string, productId: string) {
  const exists = await Wishlist.exists({ userId, productId });
  return Boolean(exists);
}
