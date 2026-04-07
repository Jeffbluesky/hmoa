import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Button, Space, Popconfirm, Tag, App, Input, Tooltip, Progress,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, FilePdfOutlined, DownloadOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { http } from '../../utils/api'
import type { ColumnsType } from 'antd/es/table'

interface Catalog {
  id: string
  name: string
  description?: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  pdfUrl?: string
  pdfSize?: number
  pageCount?: number
  error?: string
  generatedAt?: string
  createdAt: string
  template?: { name: string; config?: { columns: number } }
}

const STATUS_TAG: Record<string, { color: string; label: string }> = {
  pending:    { color: 'default',   label: '待生成' },
  generating: { color: 'processing', label: '生成中' },
  completed:  { color: 'success',   label: '已完成' },
  failed:     { color: 'error',     label: '失败' },
}

const COLS_LABEL: Record<number, string> = { 1: '单列', 2: '双列', 4: '四格' }

function CatalogList() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchCatalogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await http.getPage<Catalog>('/catalogs', {
        params: { page, pageSize: 10, keyword: keyword || undefined },
      })
      setCatalogs(res.list)
      setTotal(res.meta.total)
    } catch {
      message.error('获取目录列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, keyword, message])

  useEffect(() => { fetchCatalogs() }, [fetchCatalogs])

  // 轮询：有 generating 状态时每 3 秒刷新
  useEffect(() => {
    const hasGenerating = catalogs.some(c => c.status === 'generating')
    if (hasGenerating && !pollingRef.current) {
      pollingRef.current = setInterval(fetchCatalogs, 3000)
    } else if (!hasGenerating && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [catalogs, fetchCatalogs])

  const handleGenerate = async (id: string) => {
    try {
      await http.post(`/catalogs/${id}/generate`)
      message.success('PDF 生成任务已启动')
      fetchCatalogs()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '启动生成失败')
    }
  }

  const handleDownload = (id: string, name: string) => {
    const a = document.createElement('a')
    a.href = `/api/catalogs/${id}/download`
    a.download = `${name}.pdf`
    a.click()
  }

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/catalogs/${id}`)
      message.success('删除成功')
      fetchCatalogs()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  const columns: ColumnsType<Catalog> = [
    {
      title: '目录名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '模板',
      key: 'template',
      width: 160,
      render: (_, r) => r.template
        ? <span>{r.template.name} <Tag color="blue">{COLS_LABEL[r.template.config?.columns ?? 2] ?? `${r.template.config?.columns}列`}</Tag></span>
        : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = STATUS_TAG[status] ?? { color: 'default', label: status }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '页数 / 大小',
      key: 'pdf',
      width: 120,
      render: (_, r) => r.status === 'completed'
        ? <span>{r.pageCount ?? '-'} 页 / {r.pdfSize ? `${(r.pdfSize / 1024).toFixed(0)} KB` : '-'}</span>
        : r.status === 'generating'
          ? <Progress percent={99} status="active" size="small" showInfo={false} />
          : r.status === 'failed'
            ? <Tooltip title={r.error}><span style={{ color: '#ff4d4f', fontSize: 12 }}>查看错误</span></Tooltip>
            : '-',
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 160,
      render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space>
          {record.status !== 'generating' && (
            <Tooltip title={record.status === 'completed' ? '重新生成' : '生成 PDF'}>
              <Button
                type="link"
                size="small"
                icon={<FilePdfOutlined />}
                onClick={() => handleGenerate(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'completed' && (
            <Tooltip title="下载 PDF">
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(record.id, record.name)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确认删除"
            description="删除后不可恢复，是否继续？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>产品目录</h1>
        <Space>
          <Input.Search
            placeholder="搜索目录名称"
            allowClear
            style={{ width: 220 }}
            onSearch={(v) => { setKeyword(v); setPage(1) }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchCatalogs} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/catalog/new')}>
            新建目录
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={catalogs}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </div>
  )
}

export default CatalogList
