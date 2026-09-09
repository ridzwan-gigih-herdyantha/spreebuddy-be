import { z } from 'zod';
import { requiredString } from '../../common/validation/zod.helpers.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a valid id');

// Checkout needs a full address; the one on the profile is optional, so it is
// sent explicitly rather than assumed.
const shippingAddressSchema = z.object({
  street: requiredString('street'),
  district: requiredString('district'),
  city: requiredString('city'),
  state: requiredString('state'),
  zip: requiredString('zip'),
  fullAddress: requiredString('fullAddress'),
});

export const createCheckoutSchema = z.object({
  orderIds: z
    .array(objectId)
    .min(1, 'at least one order is required')
    .max(50, 'at most 50 orders per checkout'),
  shippingAddress: shippingAddressSchema,
});

export type CreateCheckoutBody = z.infer<typeof createCheckoutSchema>;
