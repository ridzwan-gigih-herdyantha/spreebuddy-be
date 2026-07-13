import { z } from 'zod';
import { requiredString } from '../../common/validation/zod.helpers.js';

export const createCategorySchema = z.object({
  name: requiredString('name'),
  description: z.string().trim().max(500, 'description must be at most 500 characters').optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'name must not be empty').optional(),
  description: z.string().trim().max(500, 'description must be at most 500 characters').nullable().optional(),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>;
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>;
