import { Types } from 'mongoose';
import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import { CartDocument } from './cart.model.js';
import { ProductResource, ProductResponse } from '../products/product.resource.js';
import { ProductDocument } from '../products/product.model.js';

export interface CartItemResponse {
  id: string;
  product: ProductResponse | null;
  quantity: number;
  status: string;
  total: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  total: number;
  createdAt: string | null;
  updatedAt: string | null;
}

function shapeItem(item: CartDocument['items'][number]): CartItemResponse {
  // productId is populated in the service; null if the product was deleted.
  const prod = item.productId as unknown as ProductDocument | Types.ObjectId | null | undefined;
  const populated = !!prod && !(prod instanceof Types.ObjectId) && 'name' in prod;

  return {
    id: String(item._id),
    product: populated ? ProductResource.item(prod as unknown as ProductDocument) : null,
    quantity: item.quantity,
    status: item.status,
    total: item.total,
    createdAt: formatDateDMY(item.createdAt),
    updatedAt: formatDateDMY(item.updatedAt),
  };
}

export const CartResource = makeResource<CartDocument, CartResponse>((c) => ({
  id: c.id,
  items: c.items.map(shapeItem),
  total: c.total,
  createdAt: formatDateDMY(c.createdAt),
  updatedAt: formatDateDMY(c.updatedAt),
}));
