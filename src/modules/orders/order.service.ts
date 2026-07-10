import { ApiError } from '../../common/errors/ApiError.js';
import Order, { OrderStatus } from './order.model.js';
import Product from '../products/product.model.js';

type OrderItemInput = { productId: string; quantity: number };

export async function createOrders(userId: string, items: OrderItemInput[]) {
  // 1. Validate every referenced product exists.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).select('_id');
  const found = new Set(products.map((p) => String(p._id)));
  const missing = productIds.filter((id) => !found.has(id));
  if (missing.length) {
    throw ApiError.badRequest(
      'Some products do not exist',
      missing.map((id) => ({ field: 'productId', message: `Product ${id} not found` })),
    );
  }

  // 2. Atomically reserve stock per line and snapshot price; roll back on failure.
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
        const current = await Product.findById(item.productId).select('stock name');
        throw ApiError.badRequest(
          current
            ? `Insufficient stock for "${current.name}" (available: ${current.stock}, requested: ${item.quantity})`
            : `Product ${item.productId} not found`,
        );
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

// Delete: admin only, only when pending. Reserved stock is returned.
export async function deleteOrder(id: string) {
  const order = await Order.findById(id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== OrderStatus.PENDING) {
    throw ApiError.badRequest(
      `Only pending orders can be deleted (current status: "${order.status}")`,
    );
  }
  await order.deleteOne();
  await Product.updateOne({ _id: order.productId }, { $inc: { stock: order.quantity } });
  return order;
}
