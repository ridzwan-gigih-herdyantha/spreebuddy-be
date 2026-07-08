import { FilterQuery } from 'mongoose';
import { User, NON_ADMIN_FILTER, IUser } from './user.model.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { fileService } from '../../common/services/file.service.js';
import { UpdateUserBody } from './user.schema.js';

// Body fields plus the avatar path derived from an uploaded file.
export type UpdateUserInput = UpdateUserBody & { avatar?: string | null };

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fetches a page of users plus the total count (for pagination meta).
export async function listUsers(skip: number, limit: number, search?: string) {
  const filter: FilterQuery<IUser> = { ...NON_ADMIN_FILTER };

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i');
    filter.$or = [{ name: regex }, { username: regex }, { email: regex }, { phone: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
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
