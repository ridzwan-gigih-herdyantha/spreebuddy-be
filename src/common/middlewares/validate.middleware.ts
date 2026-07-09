import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../errors/ApiError.js';

// Validates req.body against a zod schema; replaces body with the parsed value.
export function validateBody(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || undefined,
        message: i.message,
      }));
      return next(ApiError.validation('Validation failed', details));
    }

    req.body = result.data;
    next();
  };
}
