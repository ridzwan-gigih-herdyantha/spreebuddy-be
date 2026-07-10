import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';
import * as orderService from './order.service.js';
import { OrderResource } from './order.resource.js';
import { ROLES } from '../../common/constants/roles.js';
import { CreateOrdersBody, UpdateOrderStatusBody } from './order.schema.js';

const isAdmin = (req: Request) => req.user!.role === ROLES.ADMIN;

export async function createOrdersHandler(req: Request, res: Response) {
  const { orders } = req.body as CreateOrdersBody;
  const created = await orderService.createOrders(req.user!.id, orders);
  return sendCreated(res, OrderResource.collection(created), 'Orders created');
}

// Admin sees all orders; a regular user sees only their own.
export async function listOrdersHandler(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);
  const { orders, total } = await orderService.listOrders(isAdmin(req), req.user!.id, skip, limit);
  return sendSuccess(
    res,
    OrderResource.collection(orders),
    'Orders retrieved',
    200,
    paginationMeta(total, page, limit),
  );
}

export async function getOrderHandler(req: Request, res: Response) {
  const order = await orderService.getOrder(String(req.params.id), isAdmin(req), req.user!.id);
  return sendSuccess(res, OrderResource.item(order), 'Order retrieved');
}

export async function cancelOrderHandler(req: Request, res: Response) {
  const order = await orderService.cancelOrder(String(req.params.id));
  return sendSuccess(res, OrderResource.item(order), 'Order cancelled');
}

export async function updateOrderStatusHandler(req: Request, res: Response) {
  const { status } = req.body as UpdateOrderStatusBody;
  const order = await orderService.updateOrderStatus(String(req.params.id), status);
  return sendSuccess(res, OrderResource.item(order), 'Order status updated');
}

export async function deleteOrderHandler(req: Request, res: Response) {
  await orderService.deleteOrder(String(req.params.id));
  return sendSuccess(res, null, 'Order deleted');
}
