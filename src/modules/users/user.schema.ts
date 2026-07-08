import { z } from 'zod';
import { addressSchema } from '../../common/validation/address.schema.js';

// All fields optional (PATCH). avatar is handled as an uploaded file, not here.
export const updateUserSchema = z.object({
  name: z.string().trim().min(1, 'name must not be empty').optional(),
  username: z.string().trim().min(1, 'username must not be empty').optional(),
  email: z.email('email must be a valid email address').optional(),
  password: z.string().min(6, 'password must be at least 6 characters').optional(),
  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'phone must be a valid phone number')
    .optional(),
  address: addressSchema,
});

export type UpdateUserBody = z.infer<typeof updateUserSchema>;
