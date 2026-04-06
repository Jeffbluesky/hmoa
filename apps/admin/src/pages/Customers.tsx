import { useEffect, useState, useRef, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, App, Row, Col, AutoComplete, Switch, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import type { Customer, CustomerWithRelations, Dictionary } from '@hmoa/types'

const { Option } = Select

function Customers() {
  const { message } = App.useApp()
  const messageRef = useRef(message)
  messageRef.current = message

  const [categories, setCategories] = useState<Dictionary[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>()
  const [countryValue, setCountryValue] = useState<string>('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [form] = Form.useForm()

  // 查找代理类型ID - 支持多种可能的名称
  const agentTypeId = categories.find(cat => cat.name === '代理' || cat.name === '客户代理')?.id

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
  } = useCrud<CustomerWithRelations>({ listUrl: '/customers', initialPageSize: 10 })


  const fetchCountries = useCallback(async (page: number = 1, keyword?: string) => {
    try {
      const res = await http.getPage<string>('/customers/countries', {
        params: { page, pageSize: 20, keyword: keyword || '' },
      })
      setCountries(Array.isArray(res.list) ? res.list : [])
    } catch (err) {
      console.error('获取国家列表失败:', err)
      setCountries([])
    }
  }, [])

  const fetchAllCustomers = useCallback(async () => {
    try {
      const res = await http.get<Customer[]>('/customers/all')
      // 确保是数组
      setAllCustomers(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('获取客户列表失败:', err)
      setAllCustomers([])
    }
  }, [])

  // 根据国家筛选客户（排除代理类型，只保留最终客户类型或无类型）
  useEffect(() => {
    if (countryValue && Array.isArray(allCustomers) && allCustomers.length > 0) {
      const filtered = allCustomers.filter(customer =>
        customer &&
        customer.country === countryValue &&
        customer.id !== editingItem?.id &&
        customer.typeId !== agentTypeId
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers([])
    }
  }, [countryValue, allCustomers, editingItem?.id, agentTypeId])

  useEffect(() => {
    // 获取客户类型字典
    http.get<Dictionary[]>('/dictionaries/by-type-code/客户类型')
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => {
        messageRef.current.error('获取客户类型列表失败')
        setCategories([])
      })

    // 获取国家列表和所有客户
    fetchCountries(1)
    fetchAllCustomers()
  }, [fetchCountries, fetchAllCustomers])

  const onFinish = async (values: any) => {
    const name = values.name?.trim()
    if (!name) {
      messageRef.current.error('请输入客户名称')
      return
    }
    const payload = { ...values, name }
    const url = editingItem ? `/customers/${editingItem.id}` : '/customers'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, payload, method)
    if (ok) {
      form.resetFields()
    }
  }

  const handleOpen = (item?: CustomerWithRelations) => {
    openModal(item)
    if (item) {
      form.setFieldsValue({
        name: item.name || undefined,
        shortName: item.shortName || undefined,
        typeId: item.typeId || undefined,
        country: item.country || undefined,
        address: item.address || undefined,
        remark: item.remark || undefined,
        isActive: item.isActive,
        finalCustomerId: item.finalCustomerId || undefined,
        contacts: (item.contacts || []).map(c => ({
          id: c.id,
          name: c.name,
          position: c.position || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
          isPrimary: c.isPrimary,
        })),
      })
      setSelectedTypeId(item.typeId || undefined)
      setCountryValue(item.country || '')
    } else {
      form.resetFields()
      setSelectedTypeId(undefined)
      setCountryValue('')
    }
  }

  // 计算类型标识
  const isAgentType = !!(selectedTypeId && agentTypeId && selectedTypeId === agentTypeId)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>
          新建客户
        </Button>
      </div>

      <Table
        columns={[
          {
            title: '编号',
            dataIndex: 'code',
            render: (code: string) => <Tag color="blue">{code || '-'}</Tag>,
          },
          { title: '客户名称', dataIndex: 'name' },
          {
            title: '类型',
            dataIndex: 'type',
            render: (type: Dictionary | null) => type?.name || '-',
          },
          {
            title: '简称',
            dataIndex: 'shortName',
            render: (shortName: string | null) => shortName || '-',
          },
          {
            title: '国家',
            dataIndex: 'country',
            render: (country: string | null) => country || '-',
          },
          {
            title: '联系人',
            dataIndex: 'contactPerson',
            render: (person: string | null) => person || '-',
          },
          {
            title: '电话',
            dataIndex: 'phone',
            render: (phone: string | null) => phone || '-',
          },
          {
            title: '状态',
            dataIndex: 'isActive',
            render: (active: boolean) => (
              <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '停用'}</Tag>
            ),
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
          },
          {
            title: '操作',
            render: (_, record: CustomerWithRelations) => (
              <TableActions
                record={record}
                onEdit={handleOpen}
                onDelete={async () => {
                  await handleDelete(`/customers/${record.id}`)
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
        title={editingItem ? '编辑客户' : '新建客户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        maskClosable={false}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {editingItem && (
            <Form.Item label="编号">
              <Input value={editingItem.code} disabled />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="客户全称"
            validateFirst
            rules={[{ required: true, message: '请输入客户全称' }]}
          >
            <Input placeholder="请输入客户全称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shortName"
                label="客户简称"
                rules={[{ required: true, message: '请输入客户简称' }]}
              >
                <Input placeholder="请输入客户简称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="country"
                label="国家"
                rules={[{ required: true, message: '请输入国家' }]}
              >
                <AutoComplete
                  onSearch={(keyword) => {
                    fetchCountries(1, keyword || '')
                  }}
                  onFocus={() => {
                    const currentValue = form.getFieldValue('country') || ''
                    fetchCountries(1, currentValue)
                  }}
                  onChange={(value) => setCountryValue(value || '')}
                  placeholder="输入或选择国家"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {(() => {
                    const countriesArray = Array.isArray(countries) ? countries : []
                    const options = countriesArray.map(country => (
                      <AutoComplete.Option key={country} value={country}>
                        {country}
                      </AutoComplete.Option>
                    ))
                    if (countryValue && !countriesArray.includes(countryValue)) {
                      options.push(
                        <AutoComplete.Option
                          key={`__create__:${countryValue}`}
                          value={countryValue}
                          style={{ color: '#1890ff', borderTop: '1px solid #f0f0f0' }}
                        >
                          创建 "{countryValue}"
                        </AutoComplete.Option>
                      )
                    }
                    return options
                  })()}
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="typeId"
                label="客户类型"
                rules={[{ required: true, message: '请选择客户类型' }]}
              >
                <Select
                  placeholder="选择客户类型"
                  onChange={(value) => setSelectedTypeId(value || undefined)}
                >
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="finalCustomerId"
                label="最终客户"
                rules={[
                  {
                    validator: (_, value) => {
                      // 仅当类型为代理且国家不为空时必填
                      if (isAgentType && countryValue) {
                        if (!value) {
                          return Promise.reject(new Error('请选择最终客户'))
                        }
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Select
                  placeholder="选择最终客户"
                  allowClear
                  disabled={!isAgentType}
                >
                  {(() => {
                    try {
                      if (isAgentType && countryValue) {
                        const customers = Array.isArray(filteredCustomers) ? filteredCustomers : []
                        if (customers.length > 0) {
                          return customers.map(customer => (
                            <Option key={customer.id} value={customer.id}>
                              {customer?.shortName || customer?.name || ''}
                            </Option>
                          ))
                        } else {
                          return (
                            <Option disabled value="">
                              暂无符合条件的客户
                            </Option>
                          )
                        }
                      } else if (isAgentType && !countryValue) {
                        return (
                          <Option disabled value="">
                            请先输入国家
                          </Option>
                        )
                      } else {
                        return null
                      }
                    } catch (error) {
                      console.error('渲染最终客户选项时出错:', error)
                      return (
                        <Option disabled value="">
                          加载选项时出错
                        </Option>
                      )
                    }
                  })()}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="地址"
          >
            <Input.TextArea rows={2} placeholder="客户地址" />
          </Form.Item>

          <Form.Item label="联系人">
            <Form.List name="contacts">
              {(fields, { add, remove }) => (
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 60px 36px', gap: 0, background: '#fafafa', padding: '6px 8px', borderBottom: '1px solid #d9d9d9', fontSize: 12, color: '#666' }}>
                    <span>姓名 *</span><span>职位</span><span>电话</span><span>邮箱</span><span style={{ textAlign: 'center' }}>主要</span><span />
                  </div>
                  {fields.map(({ key, name }) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 60px 36px', gap: 4, padding: '4px 8px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                      <Form.Item name={[name, 'name']} rules={[{ required: true, message: '请输入姓名' }]} style={{ margin: 0 }}>
                        <Input placeholder="姓名" size="small" />
                      </Form.Item>
                      <Form.Item name={[name, 'position']} style={{ margin: 0 }}>
                        <Input placeholder="职位" size="small" />
                      </Form.Item>
                      <Form.Item name={[name, 'phone']} style={{ margin: 0 }}>
                        <Input placeholder="电话" size="small" />
                      </Form.Item>
                      <Form.Item name={[name, 'email']} rules={[{ type: 'email', message: '邮箱格式不正确' }]} style={{ margin: 0 }}>
                        <Input placeholder="邮箱" size="small" />
                      </Form.Item>
                      <Form.Item name={[name, 'isPrimary']} valuePropName="checked" initialValue={false} style={{ margin: 0, textAlign: 'center' }}>
                        <Switch size="small" />
                      </Form.Item>
                      <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => remove(name)} />
                    </div>
                  ))}
                  <div style={{ padding: '6px 8px' }}>
                    <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => add()} block>
                      添加联系人
                    </Button>
                  </div>
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            initialValue={true}
          >
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Customers