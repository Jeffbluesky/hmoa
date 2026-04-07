import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Popconfirm, App, Tag, Input } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { http } from '../../utils/api'
import type { ColumnsType } from 'antd/es/table'

interface TemplateConfig {
  columns: number
  fields: Array<{ productField: string; label: string; type: string; visible: boolean; order: number }>
}

interface CatalogTemplate {
  id: string
  name: string
  description?: string
  config: TemplateConfig
  createdAt: string
  updatedAt: string
}

const COLS_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: '单列', color: 'blue' },
  2: { label: '双列', color: 'green' },
  4: { label: '四格', color: 'purple' },
}

function Templates() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<CatalogTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await http.getPage<CatalogTemplate>('/catalog-templates', {
        params: { page, pageSize: 10, keyword: keyword || undefined },
      })
      setTemplates(res.list)
      setTotal(res.meta.total)
    } catch {
      message.error('获取模板列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, keyword, message])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/catalog-templates/${id}`)
      message.success('删除成功')
      fetchTemplates()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  const columns: ColumnsType<CatalogTemplate> = [
    {
      title: '模板名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '布局',
      key: 'layout',
      width: 100,
      render: (_, record) => {
        const cols = record.config?.columns ?? 2
        const info = COLS_LABEL[cols] ?? { label: `${cols}列`, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      },
    },
    {
      title: '字段数',
      key: 'fields',
      width: 80,
      render: (_, record) => record.config?.fields?.length ?? 0,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/catalog/templates/${record.id}/edit`)}
          />
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
        <h1 style={{ margin: 0 }}>目录模板</h1>
        <Space>
          <Input.Search
            placeholder="搜索模板名称"
            allowClear
            style={{ width: 220 }}
            onSearch={(v) => { setKeyword(v); setPage(1) }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/catalog/templates/new')}>
            新建模板
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={templates}
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

export default Templates
