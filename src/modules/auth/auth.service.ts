import { User } from '../users/user.model.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { signToken } from '../../common/utils/jwt.js';

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
