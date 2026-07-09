import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MulterError } from 'multer';
import { ApiError, ErrorDetail } from '../errors/ApiError.js';
import { ErrorBody } from '../http/response.js';
import { isProduction } from '../../config/env.js';

// Normalize any thrown value into an ApiError so the response is always uniform.
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  // File upload errors (multer), e.g. file too large or unexpected field.
  if (err instanceof MulterError) {
    const field = err.field ? ` for "${err.field}"` : '';
    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: `Uploaded file${field} is too large`,
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field${field}`,
    };
    return ApiError.badRequest(messages[err.code] ?? err.message);
  }

  // Mongoose schema validation → 422 with per-field details.
  if (err instanceof mongoose.Error.ValidationError) {
    const details: ErrorDetail[] = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.validation('Validation failed', details);
  }

  // Invalid ObjectId / cast failure → 400.
  if (err instanceof mongoose.Error.CastError) {
    const field = err.path === '_id' ? 'id' : err.path;
    return ApiError.badRequest(`The ${field} provided is not valid`);
  }

  // Duplicate unique key → 409.
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    const keys = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue ?? {});
    const details: ErrorDetail[] = keys.map((field) => ({
      field,
      message: `${field} already exists`,
    }));
    return ApiError.conflict('Duplicate value', details);
  }

  return ApiError.internal();
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const apiError = toApiError(err);

  // Log unexpected (non-operational) errors with their original stack.
  if (!apiError.isOperational) {
    console.error('[error]', err);
  }

  const body: ErrorBody = {
    success: false,
    message: apiError.message,
    error: {
      code: apiError.code,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  };

  // Only expose a stack for unexpected (non-operational) errors, and only in dev.
  // Expected errors (401/404/422/…) are normal control flow — no stack noise.
  if (!isProduction && !apiError.isOperational && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(apiError.statusCode).json(body);
}
