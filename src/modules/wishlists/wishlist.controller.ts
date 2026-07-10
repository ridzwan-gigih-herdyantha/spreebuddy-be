import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';
import * as wishlistService from './wishlist.service.js';
import { WishlistResource } from './wishlist.resource.js';
import { AddWishlistBody } from './wishlist.schema.js';

// All handlers operate on the authenticated user's own wishlist (req.user.id).
export async function listWishlistHandler(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await wishlistService.listWishlist(req.user!.id, skip, limit);
  return sendSuccess(
    res,
    WishlistResource.collection(items),
    'Wishlist retrieved',
    200,
    paginationMeta(total, page, limit),
  );
}

export async function addWishlistHandler(req: Request, res: Response) {
  const { productId, note } = req.body as AddWishlistBody;
  const item = await wishlistService.addToWishlist(req.user!.id, productId, note);
  return sendCreated(res, WishlistResource.item(item), 'Added to wishlist');
}

export async function removeWishlistHandler(req: Request, res: Response) {
  const productId = String(req.params.productId);
  await wishlistService.removeFromWishlist(req.user!.id, productId);
  return sendSuccess(res, null, 'Removed from wishlist');
}

export async function checkWishlistHandler(req: Request, res: Response) {
  const productId = String(req.params.productId);
  const wishlisted = await wishlistService.isWishlisted(req.user!.id, productId);
  return sendSuccess(res, { wishlisted }, 'Wishlist status');
}
