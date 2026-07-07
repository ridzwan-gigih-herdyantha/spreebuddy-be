import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { Role } from '../constants/roles.js';

/**
 * RBAC guard.
 *
 * Usage: router.get('/admin', authenticate, requireRole(ROLES.ADMIN), handler)
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    next();
  };
}
