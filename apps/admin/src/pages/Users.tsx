import { useRef } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { useAuthStore } from '../stores/auth'
import { SearchBar } from '../components/SearchBar'
import { TableActions } from '../components/TableActions'
import type { UserWithoutPassword, UserRole } from '@hmoa/types'

const { Option } = Select

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  EDITOR: '编辑',
}

const roleColors: Record<UserRole, string> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'orange',
  EDITOR: 'blue',
}

function Users() {
  const { user: currentUser } = useAuthStore()
  const [form] = Form.useForm()
  const formReady = useRef(false)

  const {
    list,
    loading,
    page,
    pageSize,
    total,
    keyword,
    setKeyword,
    changePage,
    submitting,
    modalVisible,
    editingItem,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<UserWithoutPassword>({ listUrl: '/users', initialPageSize: 10 })

  const onModalOk = () => form.submit()

  const onFinish = async (values: any) => {
    const payload = { ...values }
    if (!payload.password) delete payload.password
    const url = editingItem ? `/users/${editingItem.id}` : '/users'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, payload, method)
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
          username: editingItem.username,
          email: editingItem.email,
          role: editingItem.role,
          isActive: editingItem.isActive,
          password: undefined,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ isActive: true })
      }
    }
    if (!open) {
      formReady.current = false
      form.resetFields()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h1>用户管理</h1>
        <Space>
          <SearchBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={() => changePage(1)}
            placeholder="搜索用户名/邮箱"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新建用户
          </Button>
        </Space>
      </div>

      <Table
        columns={[
          { title: '用户名', dataIndex: 'username' },
          {
            title: '邮箱',
            dataIndex: 'email',
            render: (email: string | null) => email || '-',
          },
          {
            title: '角色',
            dataIndex: 'role',
            render: (role: UserRole) => (
              <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
            ),
          },
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
            render: (_, record: UserWithoutPassword) => (
              <TableActions
                record={record}
                onEdit={openModal}
                onDelete={async () => {
                  await handleDelete(`/users/${record.id}`)
                }}
                deleteDisabled={record.id === currentUser?.id}
                deleteConfirmProps={{
                  disabled: record.id === currentUser?.id,
                }}
              />
            ),
          },
        ]}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: changePage,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />

      <Modal
        title={editingItem ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={onModalOk}
        onCancel={closeModal}
        afterOpenChange={afterOpenChange}
        confirmLoading={submitting}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingItem} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱（可选）"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="选填" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingItem ? '密码（留空则不修改）' : '密码'}
            rules={editingItem ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="选择角色">
              <Option value="SUPER_ADMIN">超级管理员</Option>
              <Option value="ADMIN">管理员</Option>
              <Option value="EDITOR">编辑</Option>
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
