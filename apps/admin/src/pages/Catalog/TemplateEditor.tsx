import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form, Input, Select, Button, Card, Space, App, Spin, Divider, Tag, Row, Col, Checkbox,
} from 'antd'
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons'
import { http } from '../../utils/api'

interface AvailableField {
  value: string
  label: string
  type: string
}

interface CatalogTemplate {
  id: string
  name: string
  layout: 'single' | 'double' | 'quad'
  fields: string[]
  description?: string
}

const LAYOUT_OPTIONS = [
  { value: 'single', label: '单列', desc: '每页 1 个产品，大图展示' },
  { value: 'double', label: '双列', desc: '每页 2 个产品' },
  { value: 'quad', label: '四格', desc: '每页 4 个产品' },
]

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'default',
  code: 'blue',
  dimension: 'orange',
  color: 'magenta',
  image: 'green',
}

// 预览卡片：模拟单个产品格子
function ProductCardPreview({ fields, availableFields }: { fields: string[]; availableFields: AvailableField[] }) {
  const fieldMap = Object.fromEntries(availableFields.map((f) => [f.value, f]))
  const hasImage = fields.includes('mainImage') || fields.includes('images')
  const textFields = fields.filter((f) => f !== 'mainImage' && f !== 'images')

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#fff',
      fontSize: 12,
    }}>
      {hasImage && (
        <div style={{
          background: '#f0f0f0',
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}>
          产品图片
        </div>
      )}
      <div style={{ padding: '8px 10px' }}>
        {textFields.map((f) => (
          <div key={f} style={{ marginBottom: 3, display: 'flex', gap: 4 }}>
            <span style={{ color: '#999', minWidth: 48 }}>{fieldMap[f]?.label ?? f}:</span>
            <span style={{ color: '#333' }}>示例值</span>
          </div>
        ))}
        {textFields.length === 0 && !hasImage && (
          <div style={{ color: '#bbb', textAlign: 'center', padding: '8px 0' }}>请选择字段</div>
        )}
      </div>
    </div>
  )
}

// 布局预览
function LayoutPreview({ layout, fields, availableFields }: {
  layout: string
  fields: string[]
  availableFields: AvailableField[]
}) {
  const cols = layout === 'single' ? 1 : layout === 'double' ? 2 : 4
  const span = 24 / cols

  return (
    <div style={{ background: '#f5f5f7', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' }}>
        <EyeOutlined /> 预览（{LAYOUT_OPTIONS.find(l => l.value === layout)?.label ?? layout}布局）
      </div>
      <Row gutter={[12, 12]}>
        {Array.from({ length: cols }).map((_, i) => (
          <Col key={i} span={span}>
            <ProductCardPreview fields={fields} availableFields={availableFields} />
          </Col>
        ))}
      </Row>
    </div>
  )
}

function TemplateEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([])
  const [previewLayout, setPreviewLayout] = useState<string>('double')
  const [previewFields, setPreviewFields] = useState<string[]>([])

  const isEdit = Boolean(id)

  const fetchFields = useCallback(async () => {
    try {
      const data = await http.get<AvailableField[]>('/catalog-templates/available-fields')
      setAvailableFields(data)
    } catch {
      message.error('获取字段列表失败')
    }
  }, [message])

  const fetchTemplate = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await http.get<CatalogTemplate>(`/catalog-templates/${id}`)
      form.setFieldsValue({
        name: data.name,
        layout: data.layout,
        fields: data.fields,
        description: data.description,
      })
      setPreviewLayout(data.layout)
      setPreviewFields(data.fields)
    } catch {
      message.error('获取模板失败')
    } finally {
      setLoading(false)
    }
  }, [id, form, message])

  useEffect(() => { fetchFields() }, [fetchFields])
  useEffect(() => { fetchTemplate() }, [fetchTemplate])

  const handleValuesChange = (_: any, all: any) => {
    if (all.layout) setPreviewLayout(all.layout)
    if (all.fields) setPreviewFields(all.fields)
  }

  const handleSave = async (values: { name: string; layout: string; fields: string[]; description?: string }) => {
    setSaving(true)
    try {
      if (isEdit) {
        await http.put(`/catalog-templates/${id}`, values)
        message.success('更新成功')
      } else {
        await http.post('/catalog-templates', values)
        message.success('创建成功')
      }
      navigate('/catalog/templates')
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // Group fields by type
  const fieldGroups = availableFields.reduce<Record<string, AvailableField[]>>((acc, f) => {
    if (!acc[f.type]) acc[f.type] = []
    acc[f.type].push(f)
    return acc
  }, {})

  const TYPE_LABELS: Record<string, string> = {
    image: '图片',
    text: '文本',
    code: '编码',
    dimension: '尺寸',
    color: '颜色',
  }

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalog/templates')}>返回</Button>
          <h1 style={{ margin: 0 }}>{isEdit ? '编辑模板' : '新建模板'}</h1>
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Card title="模板配置">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                onValuesChange={handleValuesChange}
                initialValues={{ layout: 'double', fields: [] }}
              >
                <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
                  <Input placeholder="如：标准双列模板" />
                </Form.Item>

                <Form.Item name="layout" label="布局" rules={[{ required: true }]}>
                  <Select>
                    {LAYOUT_OPTIONS.map((o) => (
                      <Select.Option key={o.value} value={o.value}>
                        <Space>
                          <strong>{o.label}</strong>
                          <span style={{ color: '#999', fontSize: 12 }}>{o.desc}</span>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="fields"
                  label="展示字段"
                  rules={[{ required: true, message: '请至少选择一个字段' }]}
                >
                  <Checkbox.Group style={{ width: '100%' }}>
                    {Object.entries(fieldGroups).map(([type, flds]) => (
                      <div key={type} style={{ marginBottom: 12 }}>
                        <div style={{ marginBottom: 6 }}>
                          <Tag color={FIELD_TYPE_COLORS[type]}>{TYPE_LABELS[type] ?? type}</Tag>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 8 }}>
                          {flds.map((f) => (
                            <Checkbox key={f.value} value={f.value}>{f.label}</Checkbox>
                          ))}
                        </div>
                      </div>
                    ))}
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item name="description" label="描述">
                  <Input.TextArea rows={2} placeholder="可选备注" />
                </Form.Item>

                <Divider />

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    block
                  >
                    {isEdit ? '保存更改' : '创建模板'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="实时预览" style={{ position: 'sticky', top: 24 }}>
              <LayoutPreview
                layout={previewLayout}
                fields={previewFields}
                availableFields={availableFields}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default TemplateEditor
