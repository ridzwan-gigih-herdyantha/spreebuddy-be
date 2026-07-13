import { Request, Response } from 'express';
import { login, register } from './auth.service.js';
import { RegisterBody } from './auth.schema.js';
import { ApiError } from '../../common/errors/ApiError.js';
import { sendSuccess, sendCreated } from '../../common/http/response.js';
import { isProduction } from '../../config/env.js';
import { User } from '../users/user.model.js';
import { serializeUserWithUrls } from '../users/user.resource.js';
import { fileService } from '../../common/services/file.service.js';

const TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Express 5 forwards rejected promises to the error middleware automatically.
export async function registerHandler(req: Request, res: Response) {
  const { 
    name, 
    username, 
    email, 
    password,
    phone,
    address
  } = req.body as RegisterBody;
  // `avatar` arrives as an uploaded file (optional) — upload it to storage first.
  const avatar = req.file ? await fileService.upload(req.file, 'avatars') : undefined;

  try {
    const user = await register({ name, username, email, password, phone, avatar, address });
    return sendCreated(res, await serializeUserWithUrls(user), 'Registration successful');
  } catch (err) {
    // Remove the just-uploaded avatar if registration fails.
    if (avatar) await fileService.removeByStoredPath(avatar);
    throw err;
  }
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

  return sendSuccess(res, { token, user: await serializeUserWithUrls(user) }, 'Login successful');
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie('token');
  return sendSuccess(res, null, 'Logged out');
}

// Returns the currently authenticated user (requires the `authenticate` middleware).
export async function meHandler(req: Request, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  return sendSuccess(res, await serializeUserWithUrls(user), 'Current user');
}
