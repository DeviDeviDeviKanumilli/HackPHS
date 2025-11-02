// Standardized pagination utilities

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 20)))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination response
 */
export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  nextCursor?: string
): PaginationResponse<T> {
  const pages = Math.ceil(total / limit);
  const hasMore = page < pages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore,
      ...(nextCursor && { nextCursor }),
    },
  };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: number,
  limit: number
): { valid: boolean; error?: string } {
  if (page < 1) {
    return { valid: false, error: 'Page must be at least 1' };
  }
  if (limit < 1) {
    return { valid: false, error: 'Limit must be at least 1' };
  }
  if (limit > 100) {
    return { valid: false, error: 'Limit cannot exceed 100' };
  }
  return { valid: true };
}

