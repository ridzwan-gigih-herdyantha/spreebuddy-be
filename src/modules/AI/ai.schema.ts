import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1, 'message is required').max(4000, 'message is too long'),
});

export type CreateSessionBody = z.infer<typeof createSessionSchema>;
export type SendMessageBody = z.infer<typeof sendMessageSchema>;
