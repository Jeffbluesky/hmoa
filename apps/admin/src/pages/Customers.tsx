import { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, App, Row, Col, AutoComplete, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import { ContactsFormList } from '../components/ContactsFormList'
import { renderAutoCompleteOptions } from '../utils/autocomplete'
import type { Customer, CustomerWithRelations, Dictionary } from '@hmoa/types'

const { Option } = Select

function Customers() {
  const { message } = App.useApp()

  const [categories, setCategories] = useState<Dictionary[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>()
  const [countryValue, setCountryValue] = useState<string>('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [form] = Form.useForm()

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
    } catch {
      setCountries([])
    }
  }, [])

  const fetchAllCustomers = useCallback(async () => {
    try {
      const res = await http.get<Customer[]>('/customers/all')
      setAllCustomers(Array.isArray(res) ? res : [])
    } catch {
      setAllCustomers([])
    }
  }, [])

  useEffect(() => {
    if (countryValue && allCustomers.length > 0) {
      setFilteredCustomers(
        allCustomers.filter(
          c => c.country === countryValue && c.id !== editingItem?.id && c.typeId !== agentTypeId
        )
      )
    } else {
      setFilteredCustomers([])
    }
  }, [countryValue, allCustomers, editingItem?.id, agentTypeId])

  useEffect(() => {
    http.get<Dictionary[]>('/dictionaries/by-type-code/客户类型')
      .then((res) => setCategories(Array.isArray(res) ? res : []))
      .catch(() => message.error('获取客户类型列表失败'))
    fetchCountries(1)
    fetchAllCustomers()
  }, [fetchCountries, fetchAllCustomers, message])

  const isAgentType = !!(selectedTypeId && agentTypeId && selectedTypeId === agentTypeId)

  const onFinish = async (values: any) => {
    const name = values.name?.trim()
    if (!name) { message.error('请输入客户名称'); return }
    const url = editingItem ? `/customers/${editingItem.id}` : '/customers'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, { ...values, name }, method)
    if (ok) form.resetFields()
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
          { title: '编号', dataIndex: 'code', render: (code: string) => <Tag color="blue">{code || '-'}</Tag> },
          { title: '客户名称', dataIndex: 'name' },
          { title: '类型', dataIndex: 'type', render: (type: Dictionary | null) => type?.name || '-' },
          { title: '简称', dataIndex: 'shortName', render: (v: string | null) => v || '-' },
          { title: '国家', dataIndex: 'country', render: (v: string | null) => v || '-' },
          { title: '联系人', dataIndex: 'contactPerson', render: (v: string | null) => v || '-' },
          { title: '电话', dataIndex: 'phone', render: (v: string | null) => v || '-' },
          {
            title: '状态',
            dataIndex: 'isActive',
            render: (active: boolean) => <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '停用'}</Tag>,
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
                onDelete={async () => { await handleDelete(`/customers/${record.id}`) }}
              />
            ),
          },
        ]}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, pageSize, total, onChange: changePage, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editingItem ? '编辑客户' : '新建客户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        maskClosable={false}
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {editingItem && (
            <Form.Item label="编号"><Input value={editingItem.code} disabled /></Form.Item>
          )}

          <Form.Item name="name" label="客户全称" validateFirst rules={[{ required: true, message: '请输入客户全称' }]}>
            <Input placeholder="请输入客户全称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shortName" label="客户简称" rules={[{ required: true, message: '请输入客户简称' }]}>
                <Input placeholder="请输入客户简称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="国家" rules={[{ required: true, message: '请输入国家' }]}>
                <AutoComplete
                  onSearch={(kw) => fetchCountries(1, kw || '')}
                  onFocus={() => fetchCountries(1, form.getFieldValue('country') || '')}
                  onChange={(value) => setCountryValue(value || '')}
                  placeholder="输入或选择国家"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {renderAutoCompleteOptions(countries, countryValue)}
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="typeId" label="客户类型" rules={[{ required: true, message: '请选择客户类型' }]}>
                <Select
                  placeholder="选择客户类型"
                  onChange={(value) => {
                    setSelectedTypeId(value || undefined)
                    // 非代理类型时清空最终客户
                    const newAgentTypeId = categories.find(cat => cat.name === '代理' || cat.name === '客户代理')?.id
                    if (value !== newAgentTypeId) {
                      form.setFieldValue('finalCustomerId', undefined)
                    }
                  }}
                >
                  {categories.map((cat) => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="finalCustomerId"
                label="最终客户"
                rules={[{
                  validator: (_, value) => {
                    if (isAgentType && countryValue && !value) {
                      return Promise.reject(new Error('请选择最终客户'))
                    }
                    return Promise.resolve()
                  }
                }]}
              >
                <Select placeholder={isAgentType && !countryValue ? '请先输入国家' : '选择最终客户'} allowClear disabled={!isAgentType}>
                  {isAgentType && countryValue
                    ? filteredCustomers.length > 0
                      ? filteredCustomers.map(c => <Option key={c.id} value={c.id}>{c.shortName || c.name}</Option>)
                      : <Option disabled value="">暂无符合条件的客户</Option>
                    : null}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} placeholder="客户地址" />
          </Form.Item>

          <ContactsFormList />

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>

          <Form.Item name="isActive" label="状态" initialValue={true}>
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
