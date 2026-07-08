import { z } from 'zod';
import { requiredString } from '../../common/validation/zod.helpers.js';
import { addressSchema } from '../../common/validation/address.schema.js';

export const registerSchema = z.object({
  name: requiredString('name'),
  username: requiredString('username'),
  email: requiredString('email').pipe(z.email('email must be a valid email address')),
  password: z
    .string({ error: 'password is required' })
    .min(6, 'password must be at least 6 characters'),
  phone: requiredString('phone').pipe(
    z.string().regex(/^\+?\d{10,15}$/, 'phone must be a valid phone number'),
  ),
  address: addressSchema,
});

export type RegisterBody = z.infer<typeof registerSchema>;
