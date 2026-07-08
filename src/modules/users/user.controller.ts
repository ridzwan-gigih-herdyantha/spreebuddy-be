import { Request, Response } from 'express';
import * as userService from './user.service.js';
import { UserResource } from './user.resource.js';
import { sendSuccess } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';

// Admin-only: paginated list of users. Query: ?page=1&limit=10
export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);
  const { users, total } = await userService.listUsers(skip, limit);

  return sendSuccess(
    res,
    UserResource.collection(users),
    'Users retrieved',
    200,
    paginationMeta(total, page, limit),
  );
}
