import { z } from 'zod';

// String that must be present and non-empty, with a uniform "required" message.
const requiredString = (label: string) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`);

// Multipart sends everything as strings; parse a JSON string back into an object.
const tryParseJson = (v: unknown) => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

export const registerSchema = z.object({
  name: requiredString('name'),
  username: requiredString('username'),
  email: requiredString('email').pipe(z.email('email must be a valid email address')),
  password: z
    .string({ error: 'password is required' })
    .min(6, 'password must be at least 6 characters'),
  phone: requiredString('phone').pipe(z.string().regex(/^\+?\d{10,15}$/, 'phone must be a valid phone number')),
  address: z
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
    .nullable(),
});

export type RegisterBody = z.infer<typeof registerSchema>;
