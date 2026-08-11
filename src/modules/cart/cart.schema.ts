import { z } from 'zod';

export const createCartItemSchema = z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'productId must be a valid id'),
    quantity: z.number().int('quantity must be an integer').min(1, 'quantity must be at least 1'),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().int('quantity must be an integer').min(1, 'quantity must be at least 1'),
});

export type CreateCartItemBody = z.infer<typeof createCartItemSchema>;
export type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>;
