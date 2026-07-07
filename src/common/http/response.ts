import { Response } from 'express';
import { ErrorCode } from '../errors/errorCodes.js';
import { ErrorDetail } from '../errors/ApiError.js';

/** Extra info attached alongside data (pagination, counts, etc.). */
export type ResponseMeta = Record<string, unknown>;

export interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: ResponseMeta;
}

export interface ErrorBody {
  success: false;
  message: string;
  error: {
    code: ErrorCode;
    details?: ErrorDetail[];
  };
  stack?: string;
}

/** Uniform success response. `data` is already-shaped (e.g. via a Resource). */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: ResponseMeta,
): Response {
  const body: SuccessBody<T> = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/** Convenience for 201 Created. */
export function sendCreated<T>(
  res: Response,
  data: T,
  message = 'Created',
  meta?: ResponseMeta,
): Response {
  return sendSuccess(res, data, message, 201, meta);
}
