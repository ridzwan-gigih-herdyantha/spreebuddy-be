import { makeResource } from '../../common/http/resource.js';
import { WishlistDocument } from './wishlist.model.js';
import { ProductResource, ProductResponse } from '../products/product.resource.js';
import { ProductDocument } from '../products/product.model.js';

export interface WishlistResponse {
  id: string;
  note?: string | null;
  product: ProductResponse | null;
  createdAt: Date;
}

export const WishlistResource = makeResource<WishlistDocument, WishlistResponse>((w) => ({
  id: w.id,
  note: w.note ?? null,
  // productId is populated in the service; null if the product was deleted.
  product: w.populated('productId')
    ? ProductResource.item(w.productId as unknown as ProductDocument)
    : null,
  createdAt: w.createdAt,
}));
