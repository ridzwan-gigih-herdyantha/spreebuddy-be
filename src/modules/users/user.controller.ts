import { Request, Response } from 'express';
import { User } from './user.model.js';
import { UserResource } from './user.resource.js';
import { sendSuccess } from '../../common/http/response.js';

// Admin-only: list all users.
export async function listUsers(_req: Request, res: Response) {
  const users = await User.find().sort({ createdAt: 1 });
  return sendSuccess(res, UserResource.collection(users), 'Users retrieved', 200, {
    count: users.length,
  });
}
