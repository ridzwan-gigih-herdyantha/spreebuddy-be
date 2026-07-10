import { ApiError } from '../../common/errors/ApiError.js';
import Order, { OrderStatus } from './order.model.js';
import Product from '../products/product.model.js';

type OrderItemInput = { productId: string; quantity: number };

export async function createOrders(userId: string, items: OrderItemInput[]) {
  // Fetch all referenced products once.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).select(
    '_id name stock regularPrice salePrice',
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));

  // Aggregate the total requested quantity per product (same product may repeat).
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
  const orderDocs: {
    userId: string;
    productId: string;
    quantity: number;
    price: number;
    total: number;
  }[] = [];

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
    // Restore any stock already reserved in this batch.
    await Promise.all(
      reserved.map((r) => Product.updateOne({ _id: r.productId }, { $inc: { stock: r.quantity } })),
    );
    throw err;
  }
}

export async function listOrders(isAdmin: boolean, userId: string, skip: number, limit: number) {
  const filter = isAdmin ? {} : { userId };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('productId'),
    Order.countDocuments(filter),
  ]);
  return { orders, total };
}

export async function getOrder(id: string, isAdmin: boolean, userId: string) {
  const order = await Order.findById(id).populate('productId');
  if (!order) throw ApiError.notFound('Order not found');
  if (!isAdmin && String(order.userId) !== userId) {
    throw ApiError.forbidden('This is not your order');
  }
  return order;
}

// Cancel: admin only, from pending/processing. Reserved stock is returned.
export async function cancelOrder(id: string) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PROCESSING) {
    throw ApiError.badRequest(`Cannot cancel an order with status "${order.status}"`);
  }
  order.status = OrderStatus.CANCELLED;
  await order.save();
  await Product.updateOne({ _id: order.productId }, { $inc: { stock: order.quantity } });
  return order.populate('productId');
}

// Admin lifecycle updates (not cancellation — that goes through cancelOrder).
export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (status === OrderStatus.CANCELLED) {
    throw ApiError.badRequest('Use the cancel endpoint to cancel an order');
  }
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  order.status = status;
  await order.save();
  return order.populate('productId');
}

// Delete: admin only, only when cancelled.
export async function deleteOrder(id: string) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.CANCELLED) {
    throw ApiError.badRequest(
      `Only cancelled orders can be deleted (current status: "${order.status}")`,
    );
  }
  await order.deleteOne();
  return order;
}
