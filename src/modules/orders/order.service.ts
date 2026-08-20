import { ApiError } from '../../common/errors/ApiError.js';
import Order, { OrderStatus } from './order.model.js';
import * as lifecycle from './order.lifecycle.js';

type OrderItemInput = { productId: string; quantity: number };

export function createOrders(userId: string, items: OrderItemInput[]) {
  return lifecycle.placeOrders(userId, items);
}

export async function listOrders(isAdmin: boolean, userId: string, skip: number, limit: number) {
  const filter = isAdmin ? {} : { userId };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(['productId', 'userId']),
    Order.countDocuments(filter),
  ]);
  return { orders, total };
}

export async function getOrder(id: string, isAdmin: boolean, userId: string) {
  const order = await Order.findById(id).populate(['productId', 'userId']);
  if (!order) throw ApiError.notFound('Order not found');
  if (!isAdmin && String(order.userId) !== userId) {
    throw ApiError.forbidden('This is not your order');
  }
  return order;
}

async function loadOrder(id: string) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  return order;
}

// Cancel is just a transition to CANCELLED (allowed only from pending/processing
// by the state machine); stock is released there.
export async function cancelOrder(id: string) {
  const order = await loadOrder(id);
  await lifecycle.transition(order, OrderStatus.CANCELLED);
  return order.populate(['productId', 'userId']);
}

// Admin lifecycle updates; cancellation goes through the cancel endpoint.
export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (status === OrderStatus.CANCELLED) {
    throw ApiError.badRequest('Use the cancel endpoint to cancel an order');
  }
  const order = await loadOrder(id);
  await lifecycle.transition(order, status);
  return order.populate(['productId', 'userId']);
}

// Delete: only cancelled orders; the ledger releases any held stock (none, since
// cancelled) before removal.
export async function deleteOrder(id: string) {
  const order = await loadOrder(id);
  if (order.status !== OrderStatus.CANCELLED) {
    throw ApiError.badRequest(
      `Only cancelled orders can be deleted (current status: "${order.status}")`,
    );
  }
  await lifecycle.removeOrder(order);
  return order;
}
