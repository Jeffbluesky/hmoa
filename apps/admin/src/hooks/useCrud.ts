import { useState, useEffect, useCallback } from 'react'
import { App } from 'antd'
import { http } from '../utils/api'

interface UseCrudOptions {
  /** 列表接口地址 */
  listUrl: string
  /** 初始分页 */
  initialPageSize?: number
  /** 额外的固定查询参数 */
  fixedParams?: Record<string, any>
  /** 是否立即加载 */
  immediate?: boolean
  /** 是否使用分页接口（默认 true） */
  pagination?: boolean
}

interface UseCrudReturn<T> {
  list: T[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  keyword: string
  setKeyword: (k: string) => void
  refresh: () => Promise<void>
  changePage: (p: number, ps?: number) => void
  submitting: boolean
  deletingId: string | null
  modalVisible: boolean
  editingItem: T | null
  openModal: (item?: T) => void
  closeModal: () => void
  handleSubmit: (url: string, payload: any, method?: 'post' | 'put') => Promise<boolean>
  handleDelete: (url: string) => Promise<boolean>
}

export function useCrud<T>(options: UseCrudOptions): UseCrudReturn<T> {
  const { message } = App.useApp()
  const { listUrl, initialPageSize = 20, fixedParams = {}, immediate = true } = options

  const [list, setList] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fixedParamsKey = JSON.stringify(fixedParams)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      if (options.pagination !== false) {
        const params: Record<string, any> = {
          page,
          pageSize,
          ...fixedParams,
        }
        if (keyword.trim()) {
          params.keyword = keyword.trim()
        }
        const res = await http.getPage<T>(listUrl, { params })
        setList(res.list)
        setTotal(res.meta.total)
        if (res.meta.totalPages > 0 && page > res.meta.totalPages) {
          setPage(res.meta.totalPages)
        }
      } else {
        const params: Record<string, any> = { ...fixedParams }
        if (keyword.trim()) {
          params.keyword = keyword.trim()
        }
        const res = await http.get<T[]>(listUrl, { params })
        setList(res)
        setTotal(res.length)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [listUrl, page, pageSize, keyword, fixedParamsKey, message, options.pagination])

  useEffect(() => {
    if (immediate) {
      fetchList()
    }
  }, [fetchList, immediate])

  const refresh = fetchList

  const changePage = useCallback((p: number, ps?: number) => {
    setPage(p)
    if (ps) setPageSize(ps)
  }, [])

  const openModal = useCallback((item?: T) => {
    setEditingItem(item || null)
    setModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalVisible(false)
    setEditingItem(null)
  }, [])

  const handleSubmit = useCallback(
    async (url: string, payload: any, method: 'post' | 'put' = 'post'): Promise<boolean> => {
      setSubmitting(true)
      try {
        if (method === 'put') {
          await http.put(url, payload)
          message.success('更新成功')
        } else {
          await http.post(url, payload)
          message.success('创建成功')
        }
        setModalVisible(false)
        setEditingItem(null)
        await fetchList()
        return true
      } catch (err: any) {
        message.error(err.response?.data?.message || '提交失败')
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [fetchList, message]
  )

  const handleDelete = useCallback(
    async (url: string): Promise<boolean> => {
      setDeletingId(url)
      try {
        await http.delete(url)
        message.success('删除成功')
        await fetchList()
        return true
      } catch (err: any) {
        message.error(err.response?.data?.message || '删除失败')
        return false
      } finally {
        setDeletingId(null)
      }
    },
    [fetchList, message]
  )

  return {
    list,
    loading,
    page,
    pageSize,
    total,
    keyword,
    setKeyword,
    refresh,
    changePage,
    submitting,
    deletingId,
    modalVisible,
    editingItem,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
  }
}
