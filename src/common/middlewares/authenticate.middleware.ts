import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies the JWT and populates `req.user`.
 * Accepts the token from an `Authorization: Bearer <token>` header or a `token` cookie.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const token = bearer ?? req.cookies?.token;

  if (!token) {
    return next(ApiError.unauthorized('Authentication token missing'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
