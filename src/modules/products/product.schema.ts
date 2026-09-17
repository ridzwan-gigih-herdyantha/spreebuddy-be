import { z } from 'zod';
import { ProductType } from './product.model.js';
import { requiredString } from '../../common/validation/zod.helpers.js';

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, 'image url must not be empty')
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith('/'), {
    message: 'image url must be an absolute URL or start with "/"',
  });

const imagesSchema = z.array(imageUrlSchema).max(10, 'at most 10 images');

const dimensionsSchema = z.object({
  length: z.number().min(0, 'length must be >= 0'),
  width: z.number().min(0, 'width must be >= 0'),
  height: z.number().min(0, 'height must be >= 0'),
});

export const createProductSchema = z
  .object({
    name: requiredString('name'),
    type: z.enum(ProductType, { error: 'type must be digital or physical' }),
    description: requiredString('description'),
    images: imagesSchema.optional(),
    regularPrice: z.number({ error: 'regular price is required' }).min(0, 'regular price must be >= 0'),
    salePrice: z.number().min(0, 'sale price must be >= 0').optional(),
    weight: z.number({ error: 'weight is required' }).min(0, 'weight must be >= 0'),
    dimensions: dimensionsSchema.optional(),
    stock: z
      .number({ error: 'stock is required' })
      .int('stock must be an integer')
      .min(0, 'stock must be >= 0'),
    category: requiredString('category'),
  })
  .refine((p) => p.salePrice === undefined || p.salePrice <= p.regularPrice, {
    message: 'sale price must be less than or equal to regular price',
    path: ['salePrice'],
  });

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'name must not be empty').optional(),
  type: z.enum(ProductType).optional(),
  description: z.string().trim().min(1, 'description must not be empty').optional(),
  images: imagesSchema.optional(),
  regularPrice: z.number().min(0, 'regular price must be >= 0').optional(),
  salePrice: z.number().min(0, 'sale price must be >= 0').nullable().optional(),
  weight: z.number().min(0, 'weight must be >= 0').optional(),
  dimensions: dimensionsSchema.nullable().optional(),
  stock: z.number().int('stock must be an integer').min(0, 'stock must be >= 0').optional(),
  category: z.string().trim().min(1, 'category must not be empty').optional(),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
