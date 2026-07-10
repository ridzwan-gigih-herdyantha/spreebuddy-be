import { makeResource } from '../../common/http/resource.js';
import { OrderDocument } from './order.model.js';
import { ProductResource, ProductResponse } from '../products/product.resource.js';
import { ProductDocument } from '../products/product.model.js';

export interface OrderResponse {
  id: string;
  userId: string;
  quantity: number;
  price: number;
  total: number;
  status: string;
  product: ProductResponse | null;
  createdAt: Date;
  updatedAt: Date;
}

export const OrderResource = makeResource<OrderDocument, OrderResponse>((o) => ({
  id: o.id,
  userId: String(o.userId),
  quantity: o.quantity,
  price: o.price,
  total: o.total,
  status: o.status,
  // productId is populated in the service; null if the product was deleted.
  product: o.populated('productId')
    ? ProductResource.item(o.productId as unknown as ProductDocument)
    : null,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
}));
