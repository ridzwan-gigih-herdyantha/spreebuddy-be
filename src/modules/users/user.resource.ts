import { makeResource } from '../../common/http/resource.js';
import { formatDateDMY } from '../../common/utils/formatDate.js';
import { fileService } from '../../common/services/file.service.js';
import { Address, UserDocument } from './user.model.js';
import { Role } from '../../common/constants/roles.js';

export interface UserResponse {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string|null;
  avatarUrl?: string|null; // presigned, time-limited URL for direct access
  phone: string;
  address?: Address|null;
  role: Role;
  createdAt: string | null;
  updatedAt: string | null;
}

// Shapes a User document into the public API payload
export const UserResource = makeResource<UserDocument, UserResponse>((u) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  avatar: u.avatar||null,
  avatarUrl: null, // populated by serializeUser(s)WithUrls when needed
  role: u.role,
  phone: u.phone,
  address: u.address||null,
  createdAt: formatDateDMY(u.createdAt),
  updatedAt: formatDateDMY(u.updatedAt),
}));

// Async variant: attaches a presigned `avatarUrl` for the stored avatar path.
export async function serializeUserWithUrls(u: UserDocument): Promise<UserResponse> {
  const base = UserResource.item(u);
  return { ...base, avatarUrl: await fileService.getTemporaryUrl(u.avatar) };
}

export function serializeUsersWithUrls(users: UserDocument[]): Promise<UserResponse[]> {
  return Promise.all(users.map(serializeUserWithUrls));
}
