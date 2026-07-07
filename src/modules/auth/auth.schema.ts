import { z } from 'zod';

// String that must be present and non-empty, with a uniform "required" message.
const requiredString = (label: string) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`);

export const registerSchema = z.object({
  name: requiredString('name'),
  username: requiredString('username'),
  email: requiredString('email').pipe(z.email('email must be a valid email address')),
  password: z
    .string({ error: 'password is required' })
    .min(6, 'password must be at least 6 characters'),
});

export type RegisterBody = z.infer<typeof registerSchema>;
