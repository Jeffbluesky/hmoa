import { useEffect, useRef, useState, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, App, Row, Col, AutoComplete, Switch } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import type { SupplierWithRelations, Dictionary } from '@hmoa/types'

const { Option } = Select

function Suppliers() {
  const { message } = App.useApp()
  const messageRef = useRef(message)
  messageRef.current = message

  const [types, setTypes] = useState<Dictionary[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [cityValue, setCityValue] = useState<string>('')
  const [form] = Form.useForm()

  const fetchCities = useCallback(async (page: number = 1, keyword?: string) => {
    try {
      const res = await http.getPage<string>('/suppliers/cities', {
        params: { page, pageSize: 20, keyword: keyword || '' },
      })
      setCities(Array.isArray(res.list) ? res.list : [])
    } catch (err) {
      console.error('获取城市列表失败:', err)
      setCities([])
    }
  }, [])

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
  } = useCrud<SupplierWithRelations>({ listUrl: '/suppliers', initialPageSize: 10 })

  useEffect(() => {
    http.get<Dictionary[]>('/dictionaries/by-type-code/供应商类型')
      .then((res) => setTypes(res))
      .catch(() => messageRef.current.error('获取供应商类型列表失败'))
    fetchCities(1)
  }, [fetchCities])

  const onFinish = async (values: any) => {
    const name = values.name?.trim()
    if (!name) {
      messageRef.current.error('请输入供应商名称')
      return
    }
    const payload = { ...values, name }
    const url = editingItem ? `/suppliers/${editingItem.id}` : '/suppliers'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, payload, method)
    if (ok) {
      form.resetFields()
    }
  }

  const handleOpen = (item?: SupplierWithRelations) => {
    openModal(item)
    if (item) {
      form.setFieldsValue({
        name: item.name || undefined,
        shortName: item.shortName || undefined,
        city: item.city || undefined,
        typeId: item.typeId || undefined,
        address: item.address || undefined,
        remark: item.remark || undefined,
        isActive: item.isActive,
        contacts: (item.contacts || []).map(c => ({
          id: c.id,
          name: c.name,
          position: c.position || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
          isPrimary: c.isPrimary,
        })),
      })
      setCityValue(item.city || '')
    } else {
      form.resetFields()
      setCityValue('')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>供应商管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>
          新建供应商
        </Button>
      </div>

      <Table
        columns={[
          {
            title: '编号',
            dataIndex: 'code',
            render: (code: string) => <Tag color="blue">{code}</Tag>,
          },
          { title: '供应商全称', dataIndex: 'name' },
          {
            title: '简称',
            dataIndex: 'shortName',
            render: (shortName: string | null) => shortName || '-',
          },
          {
            title: '城市',
            dataIndex: 'city',
            render: (city: string | null) => city || '-',
          },
          {
            title: '类型',
            dataIndex: 'type',
            render: (type: Dictionary | null) => type?.name || '-',
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
            title: '邮箱',
            dataIndex: 'email',
            render: (email: string | null) => email || '-',
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
            render: (_, record: SupplierWithRelations) => (
              <TableActions
                record={record}
                onEdit={handleOpen}
                onDelete={async () => {
                  await handleDelete(`/suppliers/${record.id}`)
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
        title={editingItem ? '编辑供应商' : '新建供应商'}
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
            label="供应商全称"
            validateFirst
            rules={[{ required: true, message: '请输入供应商全称' }]}
          >
            <Input placeholder="请输入供应商全称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="shortName"
                label="供应商简称"
                rules={[{ required: true, message: '请输入供应商简称' }]}
              >
                <Input placeholder="请输入供应商简称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city"
                label="城市"
                rules={[{ required: true, message: '请输入城市' }]}
              >
                <AutoComplete
                  onSearch={(keyword) => fetchCities(1, keyword || '')}
                  onFocus={() => fetchCities(1, cityValue)}
                  onChange={(value) => setCityValue(value || '')}
                  placeholder="输入或选择城市"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {(() => {
                    const citiesArray = Array.isArray(cities) ? cities : []
                    const options = citiesArray.map(city => (
                      <AutoComplete.Option key={city} value={city}>
                        {city}
                      </AutoComplete.Option>
                    ))
                    if (cityValue && !citiesArray.includes(cityValue)) {
                      options.push(
                        <AutoComplete.Option
                          key={`__create__:${cityValue}`}
                          value={cityValue}
                          style={{ color: '#1890ff', borderTop: '1px solid #f0f0f0' }}
                        >
                          创建 "{cityValue}"
                        </AutoComplete.Option>
                      )
                    }
                    return options
                  })()}
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="typeId"
            label="供应商类型"
            rules={[{ required: true, message: '请选择供应商类型' }]}
          >
            <Select placeholder="选择供应商类型">
              {types.map((type) => (
                <Option key={type.id} value={type.id}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="地址"
          >
            <Input.TextArea rows={2} placeholder="供应商地址" />
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

export default Suppliers