import { Request, Response } from 'express';
import * as userService from './user.service.js';
import { UserResource } from './user.resource.js';
import { sendSuccess } from '../../common/http/response.js';
import { parsePagination, paginationMeta } from '../../common/http/pagination.js';
import { fileService } from '../../common/services/file.service.js';
import { UpdateUserBody } from './user.schema.js';

// Admin-only: paginated list of users. Query: ?page=1&limit=10
export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = parsePagination(req.query);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const { users, total } = await userService.listUsers(skip, limit, search || undefined);

  return sendSuccess(
    res,
    UserResource.collection(users),
    'Users retrieved',
    200,
    paginationMeta(total, page, limit),
  );
}

// Admin-only: update a user. Accepts JSON or multipart (with an `avatar` file).
export async function updateUserHandler(req: Request, res: Response) {
  const id = String(req.params.id);
  const update: userService.UpdateUserInput = { ...(req.body as UpdateUserBody) };
  if (req.file) update.avatar = fileService.publicPath('avatars', req.file.filename);

  try {
    const user = await userService.updateUser(id, update);
    return sendSuccess(res, UserResource.item(user), 'User updated successfully');
  } catch (err) {
    // Clean up the just-uploaded avatar if the update fails.
    if (req.file) await fileService.remove(req.file.path);
    throw err;
  }
}
