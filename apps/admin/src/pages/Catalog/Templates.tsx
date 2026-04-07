import { useEffect, useState, useCallback } from 'react'
import { Table, Button, Space, Popconfirm, Modal, Form, Input, Select, App, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { http } from '../../utils/api'
import type { ColumnsType } from 'antd/es/table'

interface CatalogTemplate {
  id: string
  name: string
  layout: 'single' | 'double' | 'quad'
  fields: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

const LAYOUT_LABELS: Record<string, string> = {
  single: '单列',
  double: '双列',
  quad: '四格',
}

const LAYOUT_COLORS: Record<string, string> = {
  single: 'blue',
  double: 'green',
  quad: 'purple',
}

function Templates() {
  const { message } = App.useApp()
  const [templates, setTemplates] = useState<CatalogTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [availableFields, setAvailableFields] = useState<{ value: string; label: string; type: string }[]>([])
  const [form] = Form.useForm()

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

  const fetchFields = useCallback(async () => {
    try {
      const data = await http.get<{ key: string; label: string }[]>('/catalog-templates/available-fields')
      setAvailableFields(data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])
  useEffect(() => { fetchFields() }, [fetchFields])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: CatalogTemplate) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      layout: record.layout,
      fields: record.fields,
      description: record.description,
    })
    setModalOpen(true)
  }

  const handleSave = async (values: { name: string; layout: string; fields: string[]; description?: string }) => {
    setSaving(true)
    try {
      if (editing) {
        await http.put(`/catalog-templates/${editing.id}`, values)
        message.success('更新成功')
      } else {
        await http.post('/catalog-templates', values)
        message.success('创建成功')
      }
      setModalOpen(false)
      fetchTemplates()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

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
      dataIndex: 'layout',
      key: 'layout',
      width: 100,
      render: (layout: string) => (
        <Tag color={LAYOUT_COLORS[layout]}>{LAYOUT_LABELS[layout] ?? layout}</Tag>
      ),
    },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fields',
      width: 80,
      render: (fields: string[]) => fields?.length ?? 0,
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
            onClick={() => openEdit(record)}
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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

      <Modal
        title={
          <Space>
            <SettingOutlined />
            {editing ? '编辑模板' : '新建模板'}
          </Space>
        }
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        confirmLoading={saving}
        maskClosable={false}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSave} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="如：标准双列模板" />
          </Form.Item>
          <Form.Item name="layout" label="布局" rules={[{ required: true, message: '请选择布局' }]}>
            <Select
              options={[
                { value: 'single', label: '单列 — 每页1个产品，大图展示' },
                { value: 'double', label: '双列 — 每页2个产品' },
                { value: 'quad', label: '四格 — 每页4个产品' },
              ]}
            />
          </Form.Item>
          <Form.Item name="fields" label="展示字段" rules={[{ required: true, message: '请至少选择一个字段' }]}>
            <Select
              mode="multiple"
              placeholder="选择要在目录中展示的产品字段"
              options={availableFields.map((f) => ({ value: f.value, label: f.label }))}
            />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="可选备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Templates
