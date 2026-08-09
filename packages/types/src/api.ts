import { z } from 'zod';

/** Uniform success envelope returned by the API (TransformInterceptor). */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiMeta {
  requestId?: string;
  page?: number;
  pageSize?: number;
  total?: number;
  nextCursor?: string | null;
  hasMore?: boolean;
}

/** Uniform error envelope (HttpExceptionFilter). */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

/** Cursor pagination query — reused across list endpoints. */
export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().cuid().optional(),
});
export type CursorPagination = z.infer<typeof cursorPaginationSchema>;

/** Offset pagination query — for admin tables. */
export const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type OffsetPagination = z.infer<typeof offsetPaginationSchema>;

export interface Paginated<T> {
  items: T[];
  meta: ApiMeta;
}
