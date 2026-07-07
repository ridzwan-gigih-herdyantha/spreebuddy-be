import { ERROR_CODES, ErrorCode } from './errorCodes.js';

/** Field-level detail, mainly for validation errors. */
export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Operational error carrying an HTTP status code and a machine-readable code.
 * Thrown from controllers/services and handled by the error middleware.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: ErrorDetail[];
  readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code: ErrorCode,
    details?: ErrorDetail[],
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details?: ErrorDetail[]) {
    return new ApiError(400, message, ERROR_CODES.BAD_REQUEST, details);
  }

  static validation(message = 'Validation failed', details?: ErrorDetail[]) {
    return new ApiError(422, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Not Found') {
    return new ApiError(404, message, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Conflict', details?: ErrorDetail[]) {
    return new ApiError(409, message, ERROR_CODES.CONFLICT, details);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message, ERROR_CODES.INTERNAL, undefined, false);
  }
}
