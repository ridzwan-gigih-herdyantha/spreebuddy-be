import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import { OrderResource, OrderResponse } from '../orders/order.resource.js';
import { OrderDocument } from '../orders/order.model.js';
import { PaymentDocument, ShippingAddress } from './payment.model.js';
import { toMajor } from './payment.pricing.js';

export interface PaymentResponse {
  id: string;
  status: string;
  provider: string;
  providerRef: string;
  currency: string;
  // Amounts leave the API in major units, matching how prices are exposed
  // everywhere else. IDR has no minor unit, so these match the stored integers.
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  checkoutUrl: string | null;
  shippingAddress: ShippingAddress;
  failureReason: string | null;
  orderIds: string[];
  orders: OrderResponse[] | null;
  paidAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export const PaymentResource = makeResource<PaymentDocument, PaymentResponse>((p) => ({
  id: p.id,
  status: p.status,
  provider: p.provider,
  providerRef: p.providerRef,
  currency: p.currency,
  subtotal: toMajor(p.subtotal),
  shipping: toMajor(p.shipping),
  tax: toMajor(p.tax),
  total: toMajor(p.total),
  checkoutUrl: p.checkoutUrl ?? null,
  shippingAddress: p.shippingAddress,
  failureReason: p.failureReason ?? null,
  orderIds: p.orderIds.map((id) => String(id)),
  orders: p.populated('orderIds')
    ? OrderResource.collection(p.orderIds as unknown as OrderDocument[])
    : null,
  paidAt: formatDateDMY(p.paidAt),
  expiresAt: formatDateDMY(p.expiresAt),
  createdAt: formatDateDMY(p.createdAt),
  updatedAt: formatDateDMY(p.updatedAt),
}));
