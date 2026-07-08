import { z } from 'zod';
import { requiredString, tryParseJson } from './zod.helpers.js';

// Optional address. If provided, all parts are required (stored/replaced as one
// object). In multipart requests it arrives as a JSON string, so parse it first.
export const addressSchema = z
  .preprocess(
    tryParseJson,
    z.object({
      street: requiredString('street'),
      district: requiredString('district'),
      city: requiredString('city'),
      state: requiredString('state'),
      zip: requiredString('zip'),
      fullAddress: requiredString('fullAddress'),
    }),
  )
  .optional()
  .nullable();
