import { useEffect, useRef, useState } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, Switch, Tooltip, App
} from 'antd'
import { PlusOutlined, LockOutlined, UnlockOutlined, SortAscendingOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import type { DictionaryType } from '@hmoa/types'

function DictionaryTypes() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const formReady = useRef(false)
  const [sortEditable, setSortEditable] = useState(false)

  const {
    list,
    loading,
    submitting,
    modalVisible,
    editingItem,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
    refresh,
  } = useCrud<DictionaryType>({ listUrl: '/dictionary-types', pagination: false })

  useEffect(() => {
    if (!modalVisible) {
      setSortEditable(false)
    }
  }, [modalVisible])

  const onFinish = async (values: any) => {
    const url = editingItem ? `/dictionary-types/${(editingItem as DictionaryType).id}` : '/dictionary-types'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, { ...values, sortOrder: Number(values.sortOrder) || 1 }, method)
    if (ok) {
      form.resetFields()
      formReady.current = false
    }
  }

  const afterOpenChange = (open: boolean) => {
    if (open && !formReady.current) {
      formReady.current = true
      if (editingItem) {
        form.setFieldsValue({
          name: editingItem.name,
          sortOrder: editingItem.sortOrder,
          isActive: editingItem.isActive,
        })
      } else {
        const nextSort = list.length > 0 ? Math.max(...list.map((t) => t.sortOrder || 0)) + 1 : 1
        form.resetFields()
        form.setFieldsValue({
          name: '',
          sortOrder: nextSort,
          isActive: true,
        })
      }
    }
    if (!open) {
      formReady.current = false
      form.resetFields()
    }
  }

  const handleReorder = async () => {
    try {
      await http.post('/dictionary-types/reorder')
      message.success('序号重排成功')
      refresh()
    } catch (err: any) {
      message.error(err.response?.data?.message || '重排失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1>字典类型</h1>
          <p style={{ color: '#666', marginTop: 8 }}>
            管理数据字典的分类，如：单位、颜色、货币、材料类型等
          </p>
        </div>
        <Space>
          <Button icon={<SortAscendingOutlined />} onClick={handleReorder}>
            序号重排
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新建类型
          </Button>
        </Space>
      </div>

      <Table
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '排序', dataIndex: 'sortOrder' },
          {
            title: '状态',
            dataIndex: 'isActive',
            render: (isActive: boolean) => (
              <Tag color={isActive ? 'success' : 'default'}>{isActive ? '启用' : '禁用'}</Tag>
            ),
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
          },
          {
            title: '操作',
            render: (_, record: DictionaryType) => {
              const isProtected = ['颜色', '货币', '单位'].includes(record.name)
              return (
                <TableActions
                  record={record}
                  onEdit={openModal}
                  onDelete={async () => {
                    await handleDelete(`/dictionary-types/${record.id}`)
                  }}
                  hideDelete={isProtected}
                />
              )
            },
          },
        ]}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingItem ? '编辑字典类型' : '新建字典类型'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        afterOpenChange={afterOpenChange}
        confirmLoading={submitting}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]} tooltip="显示名称，如：单位、颜色、货币">
            <Input placeholder="如：单位、颜色、货币" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            label={
              <span>
                排序
                <Tooltip title={sortEditable ? '点击锁定排序' : '点击解锁编辑排序'}>
                  <Button
                    type="link"
                    size="small"
                    icon={sortEditable ? <UnlockOutlined /> : <LockOutlined />}
                    onClick={() => setSortEditable(!sortEditable)}
                    style={{ marginLeft: 8, padding: '0 4px' }}
                  >
                    {sortEditable ? '已解锁' : '已锁定'}
                  </Button>
                </Tooltip>
              </span>
            }
          >
            <Input
              type="number"
              min={1}
              disabled={!sortEditable}
              placeholder={sortEditable ? '请输入排序数字' : '点击右侧按钮解锁编辑'}
            />
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DictionaryTypes
