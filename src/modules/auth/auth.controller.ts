import { Request, Response } from 'express';
import { login, register } from './auth.service.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { isProduction } from '../../config/env.js';
import { User } from '../users/user.model.js';
import { UserResource } from '../users/user.resource.js';

const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Express 5 forwards rejected promises to the error middleware automatically.
export async function registerHandler(req: Request, res: Response) {
  const { name, username, email, password, avatar } = req.body ?? {};

  if (!name || !username || !email || !password) {
    throw ApiError.badRequest('name, username, email, and password are required');
  }

  const user = await register({
    name: String(name),
    username: String(username),
    email: String(email),
    password: String(password),
    avatar: avatar ? String(avatar) : undefined, // optional
  });

  return sendCreated(res, UserResource.item(user), 'Registration successful');
}

export async function loginHandler(req: Request, res: Response) {
  const { identifier, email, username, password } = req.body ?? {};
  const id = identifier ?? email ?? username;

  if (!id || !password) {
    throw ApiError.badRequest('identifier (email or username) and password are required');
  }

  const { token, user } = await login({ identifier: String(id), password: String(password) });

  // Also set an httpOnly cookie so browser clients don't have to store the token manually.
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_COOKIE_MAX_AGE,
  });

  return sendSuccess(res, { token, user: UserResource.item(user) }, 'Login successful');
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('token');
  return sendSuccess(res, null, 'Logged out');
}

// Returns the currently authenticated user (requires the `authenticate` middleware).
export async function meHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, UserResource.item(user), 'Current user');
}
