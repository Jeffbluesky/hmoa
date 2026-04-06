import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form, Input, Button, Tabs, Select, Card, Space, Table, Popconfirm,
  Modal, InputNumber, Row, Col, Upload, App, Image
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, ArrowLeftOutlined, UploadOutlined,
  EyeOutlined, DeleteFilled
} from '@ant-design/icons'
import { http } from '../../utils/api'
import type { Dictionary, MaterialWithRelations, ProductWithBOM } from '@hmoa/types'
import type { UploadFile } from 'antd/es/upload/interface'

const { Option } = Select
const { TextArea } = Input

type FileItem = UploadFile<string>

interface BOMFormItem {
  key: string
  materialId?: string
  childProductId?: string
  quantity: number
  remark?: string
}

function ProductForm() {
  const { message } = App.useApp()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [categories, setCategories] = useState<Dictionary[]>([])
  const [colors, setColors] = useState<Dictionary[]>([])
  const [materials, setMaterials] = useState<MaterialWithRelations[]>([])
  const [products, setProducts] = useState<ProductWithBOM[]>([])
  const [bomItems, setBomItems] = useState<BOMFormItem[]>([])
  const [bomModalVisible, setBomModalVisible] = useState(false)
  const [editingBomIndex, setEditingBomIndex] = useState<number | null>(null)
  const [bomForm] = Form.useForm()
  const [allImages, setAllImages] = useState<FileItem[]>([])
  const [attachmentList, setAttachmentList] = useState<FileItem[]>([])
  const [replaceModalVisible, setReplaceModalVisible] = useState(false)

  const isEditing = !!id

  useEffect(() => {
    fetchDictionaries()
    fetchMaterials()
    fetchProducts()
    if (isEditing) {
      fetchProduct()
    }
  }, [id])

  const fetchDictionaries = async () => {
    try {
      const [catRes, colorRes] = await Promise.all([
        http.get<Dictionary[]>('/dictionaries/by-type-code/产品分类'),
        http.get<Dictionary[]>('/dictionaries/by-type-code/颜色'),
      ])
      setCategories(catRes)
      setColors(colorRes)
    } catch {
      message.error('获取字典数据失败')
    }
  }

  const fetchMaterials = async () => {
    try {
      const res = await http.get<MaterialWithRelations[]>('/materials')
      setMaterials(res)
    } catch {
      /* handled by interceptor */
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await http.get<ProductWithBOM[]>('/products/all')
      setProducts(res.filter((p) => p.id !== id))
    } catch {
      /* handled by interceptor */
    }
  }

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const res = await http.get<ProductWithBOM>(`/products/${id}`)
      const product = res

      form.setFieldsValue({
        name: product.name,
        itemNo: product.itemNo,
        length: product.length,
        width: product.width,
        height: product.height,
        seatH: product.seatH,
        color: product.color,
        colorCode: product.colorCode,
        categoryId: product.categoryId,
        colorDictId: product.colorDictId,
        materialId: product.materialId,
        remark: product.remark,
      })
      form.setFieldValue('internalCode', product.internalCode)

      if (product.images) {
        try {
          const images = JSON.parse(product.images) as string[]
          setAllImages(
            images.map((url, index) => ({
              uid: `-${index}`,
              name: index === 0 ? '主图' : `附图${index}`,
              status: 'done' as const,
              url,
            }))
          )
        } catch {
          setAllImages([])
        }
      } else {
        setAllImages([])
      }

      if (product.attachments) {
        try {
          const attachments = JSON.parse(product.attachments) as { name: string; url: string }[]
          setAttachmentList(
            attachments.map((att, index) => ({
              uid: `-${index}`,
              name: att.name,
              status: 'done' as const,
              url: att.url,
            }))
          )
        } catch {
          setAttachmentList([])
        }
      } else {
        setAttachmentList([])
      }

      const items: BOMFormItem[] = product.boms.map((bom, index) => ({
        key: `${index}`,
        materialId: bom.materialId || undefined,
        childProductId: bom.childProductId || undefined,
        quantity: bom.quantity,
        remark: bom.remark || undefined,
      }))
      setBomItems(items)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    if (allImages.length === 0) {
      message.error('请至少上传一张产品图片')
      return
    }

    const images = allImages
      .filter((f) => f.status === 'done' && f.url)
      .map((f) => f.url!)

    const attachments = attachmentList
      .filter((f) => f.status === 'done' && f.url)
      .map((f) => ({ name: f.name, url: f.url! }))

    const payload = {
      ...values,
      images,
      attachments,
      boms: bomItems.map((item) => ({
        materialId: item.materialId,
        childProductId: item.childProductId,
        quantity: item.quantity,
        remark: item.remark,
      })),
    }

    try {
      if (isEditing) {
        await http.put(`/products/${id}`, payload)
        message.success('更新成功')
      } else {
        await http.post('/products', payload)
        message.success('创建成功')
      }
      navigate('/products')
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败')
    }
  }

  const handleAddBOM = () => {
    setEditingBomIndex(null)
    bomForm.resetFields()
    bomForm.setFieldsValue({
      matSpecification: '',
      matColor: '',
      matColorCode: '',
      matUnit: '',
      matRemark: '',
      prodItemNo: '',
      prodColor: '',
      prodLength: '',
      prodWidth: '',
      prodHeight: '',
    })
    setBomModalVisible(true)
  }

  const handleEditBOM = (index: number) => {
    setEditingBomIndex(index)
    const item = bomItems[index]
    const mat = item.materialId ? materials.find((m) => m.id === item.materialId) : null
    const prod = item.childProductId ? products.find((p) => p.id === item.childProductId) : null
    bomForm.setFieldsValue({
      type: item.materialId ? 'material' : 'product',
      materialId: item.materialId,
      childProductId: item.childProductId,
      quantity: item.quantity,
      remark: item.remark,
      matSpecification: mat?.specification || '',
      matColor: mat?.color || '',
      matColorCode: mat?.colorCode || '',
      matUnit: mat?.unit?.name || '',
      matRemark: mat?.remark || '',
      prodItemNo: prod?.itemNo || '',
      prodColor: prod?.colorDict?.name || prod?.color || '',
      prodLength: prod?.length || '',
      prodWidth: prod?.width || '',
      prodHeight: prod?.height || '',
    })
    setBomModalVisible(true)
  }

  const handleDeleteBOM = (index: number) => {
    const newItems = [...bomItems]
    newItems.splice(index, 1)
    setBomItems(newItems)
  }

  const handleBomSubmit = (values: any) => {
    const item: BOMFormItem = {
      key: editingBomIndex !== null ? bomItems[editingBomIndex].key : `${Date.now()}`,
      materialId: values.type === 'material' ? values.materialId : undefined,
      childProductId: values.type === 'product' ? values.childProductId : undefined,
      quantity: values.quantity,
      remark: values.remark,
    }

    if (editingBomIndex !== null) {
      const newItems = [...bomItems]
      newItems[editingBomIndex] = item
      setBomItems(newItems)
    } else {
      setBomItems([...bomItems, item])
    }

    setBomModalVisible(false)
    bomForm.resetFields()
  }

  const handleDeleteImage = (index: number) => {
    const newList = [...allImages]
    newList.splice(index, 1)
    newList.forEach((f, i) => {
      f.name = i === 0 ? '主图' : `附图${i}`
    })
    setAllImages(newList)
  }

  const handleAttachmentChange = ({ fileList }: { fileList: FileItem[] }) => {
    fileList.forEach((f: any) => {
      if (f.response?.url && !f.url) f.url = f.response.url
    })
    setAttachmentList(fileList)
  }

  const customUpload = async (options: any) => {
    const { onSuccess, onError, file } = options
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await http.post<{ url: string; name: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } as any,
      })
      const url = res.url
      onSuccess?.({ url })
    } catch (err) {
      message.error('上传失败')
      onError?.(err)
    }
  }

  const bomColumns = [
    {
      title: '类型',
      key: 'type',
      render: (_: any, record: BOMFormItem) => (
        <span>{record.materialId ? '基础材料' : '成品'}</span>
      ),
    },
    {
      title: '物料',
      key: 'item',
      render: (_: any, record: BOMFormItem) => {
        if (record.materialId) {
          const m = materials.find((x) => x.id === record.materialId)
          return m ? `${m.name} (${m.code})` : record.materialId
        }
        if (record.childProductId) {
          const p = products.find((x) => x.id === record.childProductId)
          return p ? `${p.name} (${p.code})` : record.childProductId
        }
        return '-'
      },
    },
    {
      title: '货号',
      key: 'itemNo',
      render: (_: any, record: BOMFormItem) => {
        if (!record.childProductId) return '-'
        const p = products.find((x) => x.id === record.childProductId)
        return p?.itemNo || '-'
      },
    },
    {
      title: '颜色',
      key: 'prodColor',
      render: (_: any, record: BOMFormItem) => {
        if (!record.childProductId) return '-'
        const p = products.find((x) => x.id === record.childProductId)
        return p?.colorDict?.name || p?.color || '-'
      },
    },
    {
      title: 'L',
      key: 'prodLength',
      render: (_: any, record: BOMFormItem) => {
        if (!record.childProductId) return '-'
        const p = products.find((x) => x.id === record.childProductId)
        return p?.length || '-'
      },
    },
    {
      title: 'W',
      key: 'prodWidth',
      render: (_: any, record: BOMFormItem) => {
        if (!record.childProductId) return '-'
        const p = products.find((x) => x.id === record.childProductId)
        return p?.width || '-'
      },
    },
    {
      title: 'H',
      key: 'prodHeight',
      render: (_: any, record: BOMFormItem) => {
        if (!record.childProductId) return '-'
        const p = products.find((x) => x.id === record.childProductId)
        return p?.height || '-'
      },
    },
    {
      title: '规格',
      key: 'spec',
      render: (_: any, record: BOMFormItem) => {
        if (!record.materialId) return '-'
        const m = materials.find((x) => x.id === record.materialId)
        return m?.specification || '-'
      },
    },
    {
      title: '颜色',
      key: 'color',
      render: (_: any, record: BOMFormItem) => {
        if (!record.materialId) return '-'
        const m = materials.find((x) => x.id === record.materialId)
        return m?.color || '-'
      },
    },
    {
      title: '色号',
      key: 'colorCode',
      render: (_: any, record: BOMFormItem) => {
        if (!record.materialId) return '-'
        const m = materials.find((x) => x.id === record.materialId)
        return m?.colorCode || '-'
      },
    },
    {
      title: '用量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'BOM备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark: string | undefined) => remark || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, __: BOMFormItem, index: number) => (
        <Space>
          <Button type="link" onClick={() => handleEditBOM(index)}>
            编辑
          </Button>
          <Popconfirm title="确认删除" onConfirm={() => handleDeleteBOM(index)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const basicTabContent = (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Row gutter={24}>
        <Col span={8}>
          {isEditing ? (
            <Form.Item name="internalCode" label="内部编号">
              <Input disabled />
            </Form.Item>
          ) : (
            <Form.Item label="内部编号">
              <Input disabled placeholder="保存后自动生成" />
            </Form.Item>
          )}

          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input placeholder="如：户外折叠椅" />
          </Form.Item>

          <Form.Item name="itemNo" label="货号" rules={[{ required: true }]}>
            <Input placeholder="请输入货号" />
          </Form.Item>

          <Form.Item name="categoryId" label="产品分类" rules={[{ required: true }]}>
            <Select placeholder="选择产品分类" allowClear>
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="colorDictId" label="颜色" rules={[{ required: true }]}>
            <Select
              placeholder="选择颜色"
              allowClear
              onChange={(value) => {
                const color = colors.find((c) => c.id === value)
                if (color) form.setFieldsValue({ color: color.name })
              }}
            >
              {colors.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="colorCode" label="色号">
            <Input placeholder="如：Pantone 185C" />
          </Form.Item>

          <Space size="small">
            <Form.Item name="length" label="L（长）" style={{ width: 80, marginBottom: 0 }}>
              <Input placeholder="长" />
            </Form.Item>
            <Form.Item name="width" label="W（宽）" style={{ width: 80, marginBottom: 0 }}>
              <Input placeholder="宽" />
            </Form.Item>
            <Form.Item name="height" label="H（高）" style={{ width: 80, marginBottom: 0 }}>
              <Input placeholder="高" />
            </Form.Item>
            <Form.Item name="seatH" label="SH（座高）" style={{ width: 100, marginBottom: 0 }}>
              <Input placeholder="座高" />
            </Form.Item>
          </Space>
        </Col>

        <Col span={16}>
          <Form.Item
            label="产品图片（第一张为主图，最多上传7张）"
            required
            rules={[{ required: true, message: '请至少上传一张产品图片' }]}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {allImages.map((file, index) => (
                <div
                  key={file.uid}
                  style={{
                    width: 180,
                    height: 180,
                    border: index === 0 ? '3px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Image
                    src={file.url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    preview={{ mask: <EyeOutlined style={{ fontSize: 24 }} /> }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteFilled />}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(255,255,255,0.8)',
                      padding: '4px 8px',
                      minWidth: 'auto',
                    }}
                    onClick={() => handleDeleteImage(index)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      background: index === 0 ? '#1890ff' : 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    {file.name}
                  </div>
                </div>
              ))}

              <Upload
                showUploadList={false}
                fileList={allImages}
                beforeUpload={() => {
                  if (allImages.length >= 7) {
                    setReplaceModalVisible(true)
                    return false
                  }
                  return true
                }}
                onChange={(info) => {
                  const { fileList } = info
                  setAllImages(
                    fileList
                      .map((f: any) => {
                        if (f.response?.url && !f.url) f.url = f.response.url
                        return f
                      })
                      .slice(0, 7)
                      .map((f, index) => ({
                        ...f,
                        name: index === 0 ? '主图' : `附图${index}`,
                      }))
                  )
                }}
                customRequest={customUpload}
                multiple={allImages.length < 7}
                accept="image/*"
              >
                <div
                  style={{
                    width: 180,
                    height: 180,
                    border: '1px dashed #d9d9d9',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#fafafa',
                  }}
                >
                  <UploadOutlined style={{ fontSize: 36, color: '#999' }} />
                  <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>
                    {allImages.length >= 7 ? '替换图片' : '上传图片'}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                    {allImages.length}/7
                  </div>
                </div>
              </Upload>
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Form.Item name="remark" label="备注">
            <TextArea rows={4} placeholder="备注信息" />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={24}>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {isEditing ? '更新产品' : '创建产品'}
              </Button>
              <Button onClick={() => navigate('/products')}>取消</Button>
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )

  const bomTabContent = (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBOM}>
          添加物料
        </Button>
      </div>
      <Table
        columns={bomColumns}
        dataSource={bomItems}
        rowKey="key"
        pagination={false}
        locale={{ emptyText: '暂无BOM数据，请点击上方按钮添加' }}
      />

      <div
        style={{
          marginTop: 24,
          padding: '16px',
          background: '#fafafa',
          borderRadius: '8px',
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: 500 }}>附件</div>
        <Upload
          fileList={attachmentList}
          onChange={handleAttachmentChange}
          customRequest={customUpload}
          multiple
          maxCount={28}
          className="attachment-upload-grid"
        >
          <Button icon={<UploadOutlined />}>上传附件</Button>
        </Upload>
        <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
          最大上传文件数为28个，如果超过请自行打包成zip或者rar
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <Space>
          <Button type="primary" onClick={() => form.submit()}>
            {isEditing ? '更新产品' : '创建产品'}
          </Button>
          <Button onClick={() => navigate('/products')}>取消</Button>
        </Space>
      </div>
    </>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>{isEditing ? '编辑产品' : '新建产品'}</h1>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>
          返回列表
        </Button>
      </div>

      <Card loading={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'basic', label: '基础信息', children: basicTabContent },
            { key: 'bom', label: 'BOM表', children: bomTabContent },
            {
              key: 'quote',
              label: '产品报价',
              children: (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>
                  <p>产品报价功能将在后续版本中实现</p>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingBomIndex !== null ? '编辑物料' : '添加物料'}
        open={bomModalVisible}
        onOk={() => bomForm.submit()}
        width={720}
        onCancel={() => {
          setBomModalVisible(false)
          bomForm.resetFields()
        }}
        maskClosable={false}
      >
        <Form form={bomForm} layout="vertical" onFinish={handleBomSubmit}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="type" label="物料类型" initialValue="material" rules={[{ required: true }]}>
                <Select>
                  <Option value="material">基础材料</Option>
                  <Option value="product">成品（套装组合）</Option>
                </Select>
              </Form.Item>

              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                {({ getFieldValue }) => {
                  const type = getFieldValue('type')
                  return type === 'material' ? (
                    <Form.Item
                      name="materialId"
                      label="选择材料"
                      rules={[{ required: true, message: '请选择材料' }]}
                    >
                      <Select
                        placeholder="选择材料"
                        showSearch
                        optionFilterProp="label"
                        optionLabelProp="label"
                        labelRender={(props) => {
                          // props.label 是 option 的 label 属性值
                          return props.label || props.value
                        }}
                        filterOption={(input, option) =>
                          String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(id) => {
                          const m = materials.find((x) => x.id === id)
                          if (m) {
                            bomForm.setFieldsValue({
                              matSpecification: m.specification || '',
                              matColor: m.color || '',
                              matColorCode: m.colorCode || '',
                              matUnit: m.unit?.name || '',
                              matRemark: m.remark || '',
                            })
                          } else {
                            bomForm.setFieldsValue({
                              matSpecification: '',
                              matColor: '',
                              matColorCode: '',
                              matUnit: '',
                              matRemark: '',
                            })
                          }
                        }}
                      >
                        {materials.map((m) => {
                          const parts = [
                            m.specification,
                            m.color,
                            m.colorCode,
                            m.unit?.name,
                            m.remark,
                          ].filter(Boolean)
                          return (
                            <Option key={m.id} value={m.id} label={m.name}>
                              <div>
                                <span style={{ fontWeight: 500 }}>{m.name}</span>
                                {parts.length > 0 && (
                                  <div style={{ color: '#888', fontSize: 12 }}>
                                    {parts.join(' / ')}
                                  </div>
                                )}
                              </div>
                            </Option>
                          )
                        })}
                      </Select>
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="childProductId"
                      label="选择成品"
                      rules={[{ required: true, message: '请选择成品' }]}
                    >
                      <Select
                        placeholder="选择成品"
                        showSearch
                        optionFilterProp="label"
                        optionLabelProp="label"
                        labelRender={(props) => {
                          // props.label 是 option 的 label 属性值
                          return props.label || props.value
                        }}
                        filterOption={(input, option) =>
                          String(option?.label || '').toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={(id) => {
                          const p = products.find((x) => x.id === id)
                          if (p) {
                            bomForm.setFieldsValue({
                              prodItemNo: p.itemNo || '',
                              prodColor: p.colorDict?.name || p.color || '',
                              prodLength: p.length || '',
                              prodWidth: p.width || '',
                              prodHeight: p.height || '',
                            })
                          } else {
                            bomForm.setFieldsValue({
                              prodItemNo: '',
                              prodColor: '',
                              prodLength: '',
                              prodWidth: '',
                              prodHeight: '',
                            })
                          }
                        }}
                      >
                        {products.map((p) => {
                          const sizeParts = [p.length, p.width, p.height].filter(Boolean)
                          const sizeStr = sizeParts.length > 0 ? ` ${sizeParts.join('×')}` : ''
                          const colorStr = p.colorDict?.name || p.color || ''
                          return (
                            <Option key={p.id} value={p.id} label={p.name}>
                              <div>
                                <span style={{ fontWeight: 500 }}>{p.name}</span>
                                <span style={{ color: '#888', fontSize: 12 }}>
                                  {` / ${[p.itemNo, colorStr, sizeStr].filter(Boolean).join(' / ')}`}
                                </span>
                              </div>
                            </Option>
                          )
                        })}
                      </Select>
                    </Form.Item>
                  )
                }}
              </Form.Item>

              <Form.Item name="quantity" label="用量" initialValue={1} rules={[{ required: true, message: '请输入用量' }]}>
                <InputNumber min={0.01} step={0.01} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item name="remark" label="BOM备注">
                <Input.TextArea rows={3} placeholder="备注信息" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.type !== curr.type}>
                {({ getFieldValue }) => {
                  const type = getFieldValue('type')
                  return type === 'material' ? (
                    <React.Fragment>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="matSpecification" label="规格" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="matUnit" label="单位" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="matColor" label="颜色" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="matColorCode" label="色号" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item name="matRemark" label="材料备注" style={{ marginBottom: 12 }}>
                            <Input.TextArea disabled rows={4} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item name="prodItemNo" label="货号" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item name="prodColor" label="颜色" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="prodLength" label="L（长）" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="prodWidth" label="W（宽）" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item name="prodHeight" label="H（高）" style={{ marginBottom: 12 }}>
                            <Input disabled />
                          </Form.Item>
                        </Col>
                      </Row>
                    </React.Fragment>
                  )
                }}
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="选择要替换的图片"
        open={replaceModalVisible}
        onCancel={() => setReplaceModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReplaceModalVisible(false)}>
            取消
          </Button>,
        ]}
        maskClosable={false}
      >
        <p>已达到最大图片数量（7张），请选择要替换的图片：</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
          {allImages.map((file, index) => (
            <div
              key={file.uid}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = async (e) => {
                  const target = e.target as HTMLInputElement
                  if (target.files && target.files[0]) {
                    const uploadFile = target.files[0]
                    const formData = new FormData()
                    formData.append('file', uploadFile)
                    try {
                      const res = await http.post<{ url: string }>('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' } as any,
                      })
                      const url = res.url
                      const newList = [...allImages]
                      newList[index] = {
                        ...newList[index],
                        url,
                        name: index === 0 ? '主图' : `附图${index}`,
                        status: 'done',
                      }
                      setAllImages(newList)
                      setReplaceModalVisible(false)
                      message.success('替换成功')
                    } catch {
                      message.error('上传失败')
                    }
                  }
                }
                input.click()
              }}
              style={{
                width: 100,
                height: 100,
                border: index === 0 ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: 4,
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <img src={file.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={file.name} />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '2px 4px',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {file.name}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default ProductForm
