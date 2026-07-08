import { Address, User } from '../users/user.model.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { signToken } from '../../common/utils/jwt.js';

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  avatar?: string|null;
  address?: Address|null;
}

export async function register(input: RegisterInput) {
  const email = input.email.toLowerCase();

  // Friendly pre-check; the unique index is the real safety net (maps to CONFLICT).
  const existing = await User.findOne({
    $or: [{ username: input.username }, { email }, { phone: input.phone }],
  });
  if (existing) {
    const field =
      existing.email === email
        ? 'email'
        : existing.username === input.username
          ? 'username'
          : 'phone';
    throw ApiError.conflict(`${field} already registered`, [
      { field, message: `${field} already exists` },
    ]);
  }

  // password is hashed by the model's pre-save hook; role defaults to 'user'.
  const user = await User.create({
    name: input.name,
    username: input.username,
    email,
    password: input.password,
    avatar: input.avatar,
    address: input.address,
    phone: input.phone,
  });

  return user;
}

export interface LoginInput {
  identifier: string; // email or username
  password: string;
}

export async function login({ identifier, password }: LoginInput) {
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Return the document; the controller shapes it via UserResource.
  return { token, user };
}
