import { useEffect, useState, useRef } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, App, Row, Col } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import type { ContactWithRelations, Customer, Supplier } from '@hmoa/types'

const { Option } = Select

function Contacts() {
  const { message } = App.useApp()
  const messageRef = useRef(message)
  messageRef.current = message

  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form] = Form.useForm()

  const {
    list,
    loading,
    page,
    pageSize,
    total,
    changePage,
    submitting,
    modalVisible,
    editingItem,
    openModal,
    closeModal,
    handleSubmit,
    handleDelete,
  } = useCrud<ContactWithRelations>({ listUrl: '/contacts', initialPageSize: 10 })


  useEffect(() => {
    // 获取客户、供应商列表
    Promise.all([
      http.get<Customer[]>('/customers/all').catch(() => []),
      http.get<Supplier[]>('/suppliers/all').catch(() => []),
    ]).then(([custRes, supplierRes]) => {
      setCustomers(custRes)
      setSuppliers(supplierRes)
    }).catch(() => {
      messageRef.current.error('获取关联列表失败')
    })
  }, [])

  const onFinish = async (values: any) => {
    const name = values.name?.trim()
    if (!name) {
      messageRef.current.error('请输入联系人姓名')
      return
    }
    // 确保只关联一个实体
    const payload = {
      ...values,
      name,
      customerId: values.customerId || null,
      supplierId: values.supplierId || null,
    }
    const url = editingItem ? `/contacts/${editingItem.id}` : '/contacts'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, payload, method)
    if (ok) {
      form.resetFields()
    }
  }

  const handleOpen = (item?: ContactWithRelations) => {
    openModal(item)
    if (item) {
      form.setFieldsValue({
        name: item.name || undefined,
        customerId: item.customerId || undefined,
        supplierId: item.supplierId || undefined,
        phone: item.phone || undefined,
        email: item.email || undefined,
        position: item.position || undefined,
        isPrimary: item.isPrimary,
        remark: item.remark || undefined,
      })
    } else {
      form.resetFields()
    }
  }

  const getAssociatedEntity = (record: ContactWithRelations) => {
    if (record.customer) return `客户: ${record.customer.code} - ${record.customer.name}`
    if (record.supplier) return `供应商: ${record.supplier.code} - ${record.supplier.name}`
    return '未关联'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>联系人管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>
          新建联系人
        </Button>
      </div>

      <Table
        columns={[
          {
            title: '联系人姓名',
            dataIndex: 'name',
          },
          {
            title: '关联对象',
            render: (_, record: ContactWithRelations) => (
              <Tag color="blue">{getAssociatedEntity(record)}</Tag>
            ),
          },
          {
            title: '电话',
            dataIndex: 'phone',
            render: (phone: string | null) => phone || '-',
          },
          {
            title: '邮箱',
            dataIndex: 'email',
            render: (email: string | null) => email || '-',
          },
          {
            title: '职位',
            dataIndex: 'position',
            render: (position: string | null) => position || '-',
          },
          {
            title: '主要联系人',
            dataIndex: 'isPrimary',
            render: (primary: boolean) => (
              <Tag color={primary ? 'green' : 'default'}>{primary ? '是' : '否'}</Tag>
            ),
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
          },
          {
            title: '操作',
            render: (_, record: ContactWithRelations) => (
              <TableActions
                record={record}
                onEdit={handleOpen}
                onDelete={async () => {
                  await handleDelete(`/contacts/${record.id}`)
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
        title={editingItem ? '编辑联系人' : '新建联系人'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        maskClosable={false}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label="联系人姓名"
            validateFirst
            rules={[{ required: true, message: '请输入联系人姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="关联客户"
              >
                <Select placeholder="选择客户" allowClear>
                  {customers.map((cust) => (
                    <Option key={cust.id} value={cust.id}>
                      {cust.code} - {cust.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplierId"
                label="关联供应商"
              >
                <Select placeholder="选择供应商" allowClear>
                  {suppliers.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.code} - {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="phone"
            label="联系电话"
          >
            <Input placeholder="联系电话" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="邮箱地址" />
          </Form.Item>

          <Form.Item
            name="position"
            label="职位"
          >
            <Input placeholder="职位" />
          </Form.Item>

          <Form.Item
            name="isPrimary"
            label="主要联系人"
            initialValue={false}
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Contacts