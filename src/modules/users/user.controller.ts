import { Request, Response } from 'express';
import { User } from './user.model.js';

// Admin-only: list all users.
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().sort({ createdAt: 1 });
  res.json({ success: true, count: users.length, users });
}
