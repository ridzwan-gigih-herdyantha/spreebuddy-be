import { User, NON_ADMIN_FILTER } from './user.model.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { fileService } from '../../common/services/file.service.js';
import { UpdateUserBody } from './user.schema.js';

// Body fields plus the avatar path derived from an uploaded file.
export type UpdateUserInput = UpdateUserBody & { avatar?: string | null };

// Fetches a page of users plus the total count (for pagination meta).
export async function listUsers(skip: number, limit: number) {
  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: 1 }).noAdmin().skip(skip).limit(limit),
    User.countDocuments(NON_ADMIN_FILTER),
  ]);
  return { users, total };
}

export async function updateUser(id: string, update: UpdateUserInput) {

  const user = await User.findById(id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const oldAvatar = user.avatar ?? null;

  Object.assign(user, update);
  await user.save();

  // Remove the previous avatar file once it has been replaced.
  if (update.avatar && oldAvatar && oldAvatar !== update.avatar) {
    await fileService.removeByPublicPath(oldAvatar);
  }

  return user;
}
