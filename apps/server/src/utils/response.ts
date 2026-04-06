/**
 * 统一 API 响应格式工具
 * 所有路由层输出均通过此工具封装，保证 { code, message, data } 结构一致。
 */

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> {
  code: number;
  message: string;
  data: T[];
  meta: PaginatedMeta;
}

export function createResponse<T>(data: T, message = 'OK', code = 200): ApiResponse<T> {
  return { code, message, data };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message = 'OK'
): PaginatedResponse<T> {
  return {
    code: 200,
    message,
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
