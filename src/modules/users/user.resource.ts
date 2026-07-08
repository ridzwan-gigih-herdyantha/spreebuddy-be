import { makeResource } from '../../common/http/resource.js';
import { Address, UserDocument } from './user.model.js';
import { Role } from '../../common/constants/roles.js';

export interface UserResponse {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string|null;
  phone: string;
  address?: Address|null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Shapes a User document into the public API payload
export const UserResource = makeResource<UserDocument, UserResponse>((u) => ({
  id: u.id,
  name: u.name,
  username: u.username,
  email: u.email,
  avatar: u.avatar||null,
  role: u.role,
  phone: u.phone,
  address: u.address||null,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
}));
