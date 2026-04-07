import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Form, Input, Select, Button, Card, Space, App, Spin, Tag, Row, Col, Divider,
} from 'antd'
import {
  ArrowLeftOutlined, SaveOutlined, DeleteOutlined, HolderOutlined,
} from '@ant-design/icons'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  { value: 'single', label: '单列', desc: '每页 1 个产品' },
  { value: 'double', label: '双列', desc: '每页 2 个产品' },
  { value: 'quad', label: '四格', desc: '每页 4 个产品' },
]

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'default', code: 'blue', dimension: 'orange', color: 'magenta', image: 'green',
}
const TYPE_LABELS: Record<string, string> = {
  image: '图片', text: '文本', code: '编码', dimension: '尺寸', color: '颜色',
}

// ── 可排序的已选字段行 ──────────────────────────────────────────
function SortableFieldRow({
  field, onRemove,
}: {
  field: AvailableField
  onRemove: (value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.value })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: isDragging ? '#e6f4ff' : '#fafafa',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        marginBottom: 6,
        cursor: 'default',
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: '#bbb', display: 'flex', alignItems: 'center' }}
      >
        <HolderOutlined />
      </span>
      <Tag color={FIELD_TYPE_COLORS[field.type]} style={{ margin: 0 }}>
        {TYPE_LABELS[field.type] ?? field.type}
      </Tag>
      <span style={{ flex: 1, fontSize: 13 }}>{field.label}</span>
      <Button
        type="text"
        size="small"
        danger
        icon={<DeleteOutlined />}
        onClick={() => onRemove(field.value)}
      />
    </div>
  )
}

// ── 产品卡片预览 ────────────────────────────────────────────────
function ProductCardPreview({ fields, fieldMap }: { fields: AvailableField[]; fieldMap: Record<string, AvailableField> }) {
  const imageFields = fields.filter(f => f.type === 'image')
  const textFields = fields.filter(f => f.type !== 'image')
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', background: '#fff', fontSize: 12 }}>
      {imageFields.length > 0 && (
        <div style={{ background: '#f0f0f0', height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 11 }}>
          {imageFields.map(f => f.label).join(' / ')}
        </div>
      )}
      <div style={{ padding: '8px 10px' }}>
        {textFields.length === 0 && imageFields.length === 0 && (
          <div style={{ color: '#ccc', textAlign: 'center', padding: '8px 0' }}>拖入字段</div>
        )}
        {textFields.map(f => (
          <div key={f.value} style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
            <span style={{ color: '#999', minWidth: 52 }}>{f.label}:</span>
            <span style={{ color: '#333' }}>示例值</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 布局预览画布 ────────────────────────────────────────────────
function LayoutCanvas({ layout, fields, fieldMap }: {
  layout: string
  fields: AvailableField[]
  fieldMap: Record<string, AvailableField>
}) {
  const cols = layout === 'single' ? 1 : layout === 'double' ? 2 : 4
  const colSpan = 24 / cols
  return (
    <div style={{ background: '#f5f5f7', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 12 }}>
        A4 页面预览 · {LAYOUT_OPTIONS.find(l => l.value === layout)?.label}布局
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 6,
        padding: 16,
        boxShadow: '0 1px 6px #0001',
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12,
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <ProductCardPreview key={i} fields={fields} fieldMap={fieldMap} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 8 }}>
        每页显示 {cols} 个产品
      </div>
    </div>
  )
}

// ── 主组件 ──────────────────────────────────────────────────────
function TemplateEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([])
  const [selectedFields, setSelectedFields] = useState<AvailableField[]>([])
  const [layout, setLayout] = useState('double')
  const [activeField, setActiveField] = useState<AvailableField | null>(null)

  const isEdit = Boolean(id)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fieldMap = Object.fromEntries(availableFields.map(f => [f.value, f]))
  const selectedValues = new Set(selectedFields.map(f => f.value))

  const fetchFields = useCallback(async () => {
    try {
      const data = await http.get<AvailableField[]>('/catalog-templates/available-fields')
      setAvailableFields(data)
    } catch { message.error('获取字段列表失败') }
  }, [message])

  const fetchTemplate = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await http.get<CatalogTemplate>(`/catalog-templates/${id}`)
      form.setFieldsValue({ name: data.name, layout: data.layout, description: data.description })
      setLayout(data.layout)
      // 等 availableFields 加载后再设置，用 setTimeout 确保 availableFields 已就绪
      setSelectedFields(
        data.fields
          .map(v => ({ value: v, label: v, type: 'text' })) // 临时占位，fetchFields 后替换
      )
    } catch { message.error('获取模板失败') }
    finally { setLoading(false) }
  }, [id, form, message])

  useEffect(() => { fetchFields() }, [fetchFields])
  useEffect(() => { fetchTemplate() }, [fetchTemplate])

  // 当 availableFields 加载完成后，用真实字段信息替换占位
  useEffect(() => {
    if (availableFields.length === 0) return
    setSelectedFields(prev =>
      prev.map(f => fieldMap[f.value] ?? f).filter(f => fieldMap[f.value])
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableFields])

  const addField = (field: AvailableField) => {
    if (selectedValues.has(field.value)) return
    setSelectedFields(prev => [...prev, field])
  }

  const removeField = (value: string) => {
    setSelectedFields(prev => prev.filter(f => f.value !== value))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const f = selectedFields.find(f => f.value === event.active.id)
    setActiveField(f ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveField(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSelectedFields(prev => {
      const oldIndex = prev.findIndex(f => f.value === active.id)
      const newIndex = prev.findIndex(f => f.value === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleSave = async (values: { name: string; layout: string; description?: string }) => {
    if (selectedFields.length === 0) { message.warning('请至少添加一个展示字段'); return }
    setSaving(true)
    try {
      const payload = { ...values, fields: selectedFields.map(f => f.value) }
      if (isEdit) {
        await http.put(`/catalog-templates/${id}`, payload)
        message.success('更新成功')
      } else {
        await http.post('/catalog-templates', payload)
        message.success('创建成功')
      }
      navigate('/catalog/templates')
    } catch (err: any) {
      message.error(err?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 按 type 分组可用字段
  const fieldGroups = availableFields.reduce<Record<string, AvailableField[]>>((acc, f) => {
    if (!acc[f.type]) acc[f.type] = []
    acc[f.type].push(f)
    return acc
  }, {})

  return (
    <Spin spinning={loading}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalog/templates')}>返回</Button>
          <h1 style={{ margin: 0 }}>{isEdit ? '编辑模板' : '新建模板'}</h1>
        </div>

        <Row gutter={24}>
          {/* 左栏：配置 */}
          <Col span={10}>
            <Card title="模板设置" style={{ marginBottom: 16 }}>
              <Form form={form} layout="vertical" onFinish={handleSave}
                initialValues={{ layout: 'double' }}
                onValuesChange={(_, all) => { if (all.layout) setLayout(all.layout) }}
              >
                <Form.Item name="name" label="模板名称" rules={[{ required: true, message: '请输入模板名称' }]}>
                  <Input placeholder="如：标准双列模板" />
                </Form.Item>
                <Form.Item name="layout" label="布局" rules={[{ required: true }]}>
                  <Select options={LAYOUT_OPTIONS.map(o => ({
                    value: o.value,
                    label: <span>{o.label} <span style={{ color: '#999', fontSize: 12 }}>{o.desc}</span></span>,
                  }))} />
                </Form.Item>
                <Form.Item name="description" label="描述">
                  <Input.TextArea rows={2} placeholder="可选备注" />
                </Form.Item>
              </Form>
            </Card>

            {/* 字段库 */}
            <Card title="字段库" size="small" extra={<span style={{ fontSize: 12, color: '#999' }}>点击添加</span>}>
              {Object.entries(fieldGroups).map(([type, flds]) => (
                <div key={type} style={{ marginBottom: 12 }}>
                  <Tag color={FIELD_TYPE_COLORS[type]} style={{ marginBottom: 6 }}>{TYPE_LABELS[type] ?? type}</Tag>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                    {flds.map(f => (
                      <Button
                        key={f.value}
                        size="small"
                        type={selectedValues.has(f.value) ? 'primary' : 'default'}
                        disabled={selectedValues.has(f.value)}
                        onClick={() => addField(f)}
                        style={{ fontSize: 12 }}
                      >
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </Col>

          {/* 中栏：已选字段（可拖拽排序） */}
          <Col span={6}>
            <Card
              title={<span>已选字段 <Tag>{selectedFields.length}</Tag></span>}
              extra={<span style={{ fontSize: 12, color: '#999' }}>拖拽排序</span>}
              style={{ height: '100%' }}
            >
              {selectedFields.length === 0 ? (
                <div style={{ color: '#ccc', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>
                  从字段库点击添加字段
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedFields.map(f => f.value)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedFields.map(f => (
                      <SortableFieldRow key={f.value} field={f} onRemove={removeField} />
                    ))}
                  </SortableContext>
                  <DragOverlay>
                    {activeField && (
                      <div style={{
                        padding: '6px 10px', background: '#e6f4ff', border: '1px solid #91caff',
                        borderRadius: 6, fontSize: 13, boxShadow: '0 4px 12px #0002',
                      }}>
                        {activeField.label}
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}

              <Divider style={{ margin: '12px 0' }} />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                block
                onClick={() => form.submit()}
              >
                {isEdit ? '保存更改' : '创建模板'}
              </Button>
            </Card>
          </Col>

          {/* 右栏：实时预览 */}
          <Col span={8}>
            <Card title="实时预览" style={{ position: 'sticky', top: 24 }}>
              <LayoutCanvas layout={layout} fields={selectedFields} fieldMap={fieldMap} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default TemplateEditor
