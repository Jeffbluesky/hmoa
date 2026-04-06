import { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, Modal, Form, Input, Select, AutoComplete, App, Row, Col } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import { renderAutoCompleteOptions } from '../utils/autocomplete'
import type { MaterialWithRelations, Dictionary, Supplier } from '@hmoa/types'

const { Option } = Select

function Materials() {
  const { message } = App.useApp()

  const [units, setUnits] = useState<Dictionary[]>([])
  const [colors, setColors] = useState<Dictionary[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierCity, setSupplierCity] = useState<string | undefined>()
  const [form] = Form.useForm()
  const [materialNames, setMaterialNames] = useState<string[]>([])
  const [loadingNames, setLoadingNames] = useState(false)
  const [materialNameValue, setMaterialNameValue] = useState<string>('')

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
  } = useCrud<MaterialWithRelations>({ listUrl: '/materials', initialPageSize: 10 })

  const fetchMaterialNames = useCallback(async (page: number = 1, keyword?: string) => {
    setLoadingNames(true)
    try {
      const res = await http.getPage<string>('/materials/names', { params: { page, pageSize: 10, keyword } })
      setMaterialNames(page === 1 ? res.list : (prev) => [...prev, ...res.list])
    } catch {
      message.error('获取材料名称列表失败')
    } finally {
      setLoadingNames(false)
    }
  }, [message])

  useEffect(() => {
    http.get<Dictionary[]>('/dictionaries/by-type-code/规格单位')
      .then((res) => setUnits(res))
      .catch(() => message.error('获取单位列表失败'))
    http.get<Dictionary[]>('/dictionaries/by-type-code/颜色')
      .then((res) => setColors(res))
      .catch(() => message.error('获取颜色列表失败'))
    http.get<Supplier[]>('/suppliers/all')
      .then((res) => setSuppliers(Array.isArray(res) ? res : []))
      .catch(() => message.error('获取供应商列表失败'))
    fetchMaterialNames(1)
  }, [fetchMaterialNames, message])

  const onFinish = async (values: any) => {
    const name = values.name?.trim()
    if (!name) { message.error('请输入材料名称'); return }
    const url = editingItem ? `/materials/${editingItem.id}` : '/materials'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, { ...values, name }, method)
    if (ok) {
      form.resetFields()
      fetchMaterialNames(1)
    }
  }

  const handleOpen = (item?: MaterialWithRelations) => {
    openModal(item)
    fetchMaterialNames(1)
    if (item) {
      const itemSupplier = suppliers.find(s => s.id === item.supplierId)
      setSupplierCity(itemSupplier?.city || undefined)
      setMaterialNameValue(item.name || '')
      form.setFieldsValue({
        name: item.name || undefined,
        specification: item.specification || undefined,
        unitId: item.unitId || undefined,
        supplierId: item.supplierId || undefined,
        color: item.color || undefined,
        colorCode: item.colorCode || undefined,
        remark: item.remark || undefined,
      })
    } else {
      setSupplierCity(undefined)
      setMaterialNameValue('')
      form.resetFields()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>基础材料</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>
          新建材料
        </Button>
      </div>

      <Table
        columns={[
          { title: '编号', dataIndex: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
          { title: '材料名称', dataIndex: 'name' },
          { title: '规格', dataIndex: 'specification', render: (v: string | null) => v || '-' },
          { title: '单位', dataIndex: 'unit', render: (unit: Dictionary | null) => unit?.name || '-' },
          { title: '供应商', dataIndex: 'supplier', render: (s: { name: string } | null) => s?.name || '-' },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
          },
          {
            title: '操作',
            render: (_, record: MaterialWithRelations) => (
              <TableActions
                record={record}
                onEdit={handleOpen}
                onDelete={async () => { await handleDelete(`/materials/${record.id}`) }}
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
        title={editingItem ? '编辑材料' : '新建材料'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        confirmLoading={submitting}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {editingItem && (
            <Form.Item label="编号"><Input value={editingItem.code} disabled /></Form.Item>
          )}

          <Form.Item name="name" label="材料名称" validateFirst rules={[{ required: true, message: '请输入材料名称' }]}>
            <AutoComplete
              onSearch={(kw) => fetchMaterialNames(1, kw || '')}
              onFocus={() => fetchMaterialNames(1, form.getFieldValue('name') || '')}
              onChange={(value) => setMaterialNameValue(value || '')}
              placeholder="输入或选择材料名称"
              style={{ width: '100%' }}
              allowClear
              notFoundContent={loadingNames ? '加载中...' : '无匹配结果'}
            >
              {renderAutoCompleteOptions(materialNames, materialNameValue, '创建')}
            </AutoComplete>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="specification" label="规格" rules={[{ required: true, message: '请输入规格' }]}>
                <Input placeholder="如：30*30*20CM" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitId" label="单位" rules={[{ required: true, message: '请选择单位' }]}>
                <Select placeholder="选择单位">
                  {units.map((unit) => <Option key={unit.id} value={unit.id}>{unit.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="供应商城市" required>
                <Select
                  placeholder="选择城市"
                  allowClear
                  value={supplierCity}
                  onChange={(val) => { setSupplierCity(val); form.setFieldValue('supplierId', undefined) }}
                >
                  {Array.from(new Set(suppliers.map(s => s.city).filter(Boolean))).sort().map(city => (
                    <Option key={city!} value={city!}>{city}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="supplierId" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
                <Select
                  placeholder={supplierCity ? '选择供应商' : '请先选择城市'}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  disabled={!supplierCity}
                >
                  {suppliers.filter(s => s.city === supplierCity).map(s => (
                    <Option key={s.id} value={s.id}>{s.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="color" label="颜色（可选）">
                <Select placeholder="选择颜色" allowClear showSearch>
                  {colors.map((c) => <Option key={c.id} value={c.name}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="colorCode" label="色号（可选）">
                <Input placeholder="如：Pantone 185C" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注（可选）">
            <Input.TextArea rows={4} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Materials
