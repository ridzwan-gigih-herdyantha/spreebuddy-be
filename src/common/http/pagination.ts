import { z } from 'zod';
import { ApiError } from '../errors/ApiError.js';

const MAX_LIMIT = 100;

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(10),
});

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

// Parses & validates ?page & ?limit from a query object.
export function parsePagination(query: unknown): Pagination {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.') || undefined,
      message: i.message,
    }));
    throw ApiError.validation('Invalid pagination query', details);
  }
  const { page, limit } = result.data;
  return { page, limit, skip: (page - 1) * limit };
}

// Builds the meta block for a paginated response.
export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    total,
    page,
    limit,
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  };
}
