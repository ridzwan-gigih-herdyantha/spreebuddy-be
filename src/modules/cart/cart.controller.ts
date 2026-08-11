import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import * as cartService from './cart.service.js';
import { CartResource } from './cart.resource.js';
import { CreateCartItemBody, UpdateCartItemBody } from './cart.schema.js';

// All handlers operate on the authenticated user's own cart (req.user.id).
export async function getCartHandler(req: Request, res: Response) {
  const cart = await cartService.getCart(req.user!.id);
  return sendSuccess(res, CartResource.item(cart), 'Cart retrieved');
}

export async function addToCartHandler(req: Request, res: Response) {
  const { productId, quantity } = req.body as CreateCartItemBody;
  const cart = await cartService.addToCart(req.user!.id, productId, quantity);
  return sendCreated(res, CartResource.item(cart), 'Added to cart');
}

export async function updateCartItemHandler(req: Request, res: Response) {
  const productId = String(req.params.productId);
  const { quantity } = req.body as UpdateCartItemBody;
  const cart = await cartService.updateItemQuantity(req.user!.id, productId, quantity);
  return sendSuccess(res, CartResource.item(cart), 'Cart item updated');
}

export async function removeFromCartHandler(req: Request, res: Response) {
  const productId = String(req.params.productId);
  const cart = await cartService.removeFromCart(req.user!.id, productId);
  return sendSuccess(res, CartResource.item(cart), 'Removed from cart');
}

export async function clearCartHandler(req: Request, res: Response) {
  const cart = await cartService.clearCart(req.user!.id);
  return sendSuccess(res, CartResource.item(cart), 'Cart cleared');
}
