import { z } from 'zod';

export const addWishlistSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'productId must be a valid id'),
  note: z.string().trim().max(500, 'note must be at most 500 characters').optional(),
});

export type AddWishlistBody = z.infer<typeof addWishlistSchema>;
