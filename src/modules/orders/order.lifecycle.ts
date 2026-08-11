import { Types } from 'mongoose';
import { ApiError } from '../../common/errors/ApiError.js';
import Product from '../products/product.model.js';
import Order, { OrderStatus, OrderDocument } from './order.model.js';

export type OrderItemInput = { productId: string; quantity: number };
type ProductRef = string | Types.ObjectId;

// ─── State machine ────────────────────────────────────────────────────────────
// Single source of truth for: which transitions are legal, and what each does to
// stock. Nothing outside this module may change an order's status or touch
// Product.stock for order purposes.

// Statuses that currently hold reserved stock (i.e. deducted from Product.stock).
const HOLDS_STOCK: Record<OrderStatus, boolean> = {
  [OrderStatus.PENDING]: true,
  [OrderStatus.PROCESSING]: true,
  [OrderStatus.SHIPPED]: true,
  [OrderStatus.DELIVERED]: true,
  [OrderStatus.CANCELLED]: false,
};

// Legal transitions (from → allowed to[]). CANCELLED and DELIVERED are terminal,
// so re-activating a cancelled order is rejected by construction.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedNextStatuses(from: OrderStatus): OrderStatus[] {
  return [...TRANSITIONS[from]];
}

// ─── Stock ledger (the only writer of Product.stock for orders) ────────────────

async function releaseStock(productId: ProductRef, quantity: number): Promise<void> {
  await Product.updateOne({ _id: productId }, { $inc: { stock: quantity } });
}

// Atomic reserve; throws if the product no longer has enough stock.
async function reserveStock(productId: ProductRef, quantity: number): Promise<void> {
  const product = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
  );
  if (!product) {
    throw ApiError.conflict('Insufficient stock to reserve for this order');
  }
}

// ─── Operations (the narrow interface controllers/service call) ────────────────

// Place: reserve stock for every line, then create the orders at PENDING.
// All-or-nothing — any shortfall aborts the whole batch and rolls back reserves.
export async function placeOrders(userId: string, items: OrderItemInput[]): Promise<OrderDocument[]> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).select(
    '_id name stock regularPrice salePrice',
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Aggregate requested quantity per product, then collect ALL problems up front.
  const requested = new Map<string, number>();
  for (const item of items) {
    requested.set(item.productId, (requested.get(item.productId) ?? 0) + item.quantity);
  }

  const details = [];
  for (const [productId, qty] of requested) {
    const product = byId.get(productId);
    if (!product) {
      details.push({ field: 'productId', message: `Product ${productId} not found` });
    } else if (product.stock < qty) {
      details.push({
        field: 'productId',
        message: `Insufficient stock for "${product.name}" (available: ${product.stock}, requested: ${qty})`,
      });
    }
  }
  if (details.length) {
    throw ApiError.badRequest('Some orders could not be placed', details);
  }

  const reserved: OrderItemInput[] = [];
  const orderDocs = [];

  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );
      if (!product) {
        throw ApiError.conflict('Stock changed while placing the order, please try again');
      }
      reserved.push(item);
      const price = product.salePrice ?? product.regularPrice;
      orderDocs.push({
        userId,
        productId: item.productId,
        quantity: item.quantity,
        price,
        total: price * item.quantity,
      });
    }

    const created = await Order.create(orderDocs);
    const ids = created.map((o) => o._id);
    return await Order.find({ _id: { $in: ids } }).sort({ createdAt: 1 }).populate('productId');
  } catch (err) {
    await Promise.all(reserved.map((r) => releaseStock(r.productId, r.quantity)));
    throw err;
  }
}

// The ONLY way to change an order's status. Validates the transition and applies
// its stock effect (release when leaving an active state, reserve when entering one).
export async function transition(order: OrderDocument, to: OrderStatus): Promise<OrderDocument> {
  const from = order.status;
  if (from === to) return order;

  if (!canTransition(from, to)) {
    throw ApiError.badRequest(`Cannot change order status from "${from}" to "${to}"`);
  }

  const wasHolding = HOLDS_STOCK[from];
  const willHold = HOLDS_STOCK[to];

  if (wasHolding && !willHold) {
    await releaseStock(order.productId, order.quantity);
  } else if (!wasHolding && willHold) {
    await reserveStock(order.productId, order.quantity); // throws if unavailable
  }

  order.status = to;
  await order.save();
  return order;
}

// Delete: releases stock first if the order is still holding it, then removes it.
export async function removeOrder(order: OrderDocument): Promise<void> {
  if (HOLDS_STOCK[order.status]) {
    await releaseStock(order.productId, order.quantity);
  }
  await order.deleteOne();
}
