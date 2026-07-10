import { z } from 'zod';
import { OrderStatus } from './order.model.js';

const orderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'productId must be a valid id'),
  quantity: z.number().int('quantity must be an integer').min(1, 'quantity must be at least 1'),
});

// One or many orders in a single request.
export const createOrdersSchema = z.object({
  orders: z
    .array(orderItemSchema)
    .min(1, 'at least one order is required')
    .max(50, 'at most 50 orders per request'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(OrderStatus),
});

export type CreateOrdersBody = z.infer<typeof createOrdersSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;
