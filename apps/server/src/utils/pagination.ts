import { z } from 'zod';

/**
 * 通用分页参数 Zod Schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export interface PaginationResult {
  page: number;
  pageSize: number;
  skip: number;
}

export function parsePagination(query: unknown): PaginationResult {
  const parsed = paginationSchema.parse(query);
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    skip: (parsed.page - 1) * parsed.pageSize,
  };
}
