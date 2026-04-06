import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import type { ApiResponse, PaginatedApiResponse } from '@hmoa/types'

interface CustomConfig extends AxiosRequestConfig {
  skipAuthRedirect?: boolean
}

export interface PaginatedData<T> {
  list: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor: 直接剥掉 axios 外层，返回后端封装的 { code, message, data }
api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<any>) => {
    const config = error.config as CustomConfig | undefined
    if (error.response?.status === 401 && !config?.skipAuthRedirect) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * 类型安全的 HTTP 辅助方法
 * 正常使用：const res = await http.get<User[]>('/users')
 * 分页使用：const res = await http.getPage<User>('/users', { page: 1 })
 */
export const http = {
  get: <T>(url: string, config?: Omit<CustomConfig, 'skipAuthRedirect'> & { skipAuthRedirect?: boolean }) =>
    api.get<any, ApiResponse<T>>(url, config).then((res) => res.data),

  getPage: <T>(url: string, config?: Omit<CustomConfig, 'skipAuthRedirect'> & { skipAuthRedirect?: boolean }) =>
    api.get<any, PaginatedApiResponse<T>>(url, config).then((res) => ({
      list: res.data,
      meta: res.meta,
    }) as PaginatedData<T>),

  post: <T>(url: string, data?: any, config?: Omit<CustomConfig, 'skipAuthRedirect'> & { skipAuthRedirect?: boolean }) =>
    api.post<any, ApiResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: any, config?: Omit<CustomConfig, 'skipAuthRedirect'> & { skipAuthRedirect?: boolean }) =>
    api.put<any, ApiResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: Omit<CustomConfig, 'skipAuthRedirect'> & { skipAuthRedirect?: boolean }) =>
    api.delete<any, ApiResponse<T>>(url, config).then((res) => res.data),
}

export default api
