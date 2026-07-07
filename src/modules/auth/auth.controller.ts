import { Request, Response } from 'express';
import { login } from './auth.service.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { isProduction } from '../../config/env.js';
import { User } from '../users/user.model.js';

const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Express 5 forwards rejected promises to the error middleware automatically.
export async function loginHandler(req: Request, res: Response) {
  const { identifier, email, username, password } = req.body ?? {};
  const id = identifier ?? email ?? username;

  if (!id || !password) {
    throw ApiError.badRequest('identifier (email or username) and password are required');
  }

  const result = await login({ identifier: String(id), password: String(password) });

  // Also set an httpOnly cookie so browser clients don't have to store the token manually.
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: TOKEN_COOKIE_MAX_AGE,
  });

  res.json({ success: true, ...result });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
}

// Returns the currently authenticated user (requires the `authenticate` middleware).
export async function meHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, user });
}
