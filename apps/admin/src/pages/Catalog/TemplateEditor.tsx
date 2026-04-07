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

interface TemplateConfig {
  layout: string
  columns: number
  itemsPerPage: number
  fields: Array<{
    productField: string
    label: string
    type: string
    visible: boolean
    order: number
  }>
  styles: {
    titleFontSize: number
    titleFontWeight: string
    titleColor: string
    fieldFontSize: number
    fieldColor: string
    backgroundColor: string
    borderColor: string
    padding: number
    spacing: number
  }
}

interface CatalogTemplate {
  id: string
  name: string
  description?: string
  config: TemplateConfig
}

const LAYOUT_OPTIONS = [
  { value: 'single', label: '单列', desc: '每页 1 个产品', columns: 1, itemsPerPage: 1 },
  { value: 'double', label: '双列', desc: '每页 2 个产品', columns: 2, itemsPerPage: 2 },
  { value: 'quad',   label: '四格', desc: '每页 4 个产品', columns: 4, itemsPerPage: 4 },
]

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: 'default', code: 'blue', dimension: 'orange', color: 'magenta', image: 'green',
}
const TYPE_LABELS: Record<string, string> = {
  image: '图片', text: '文本', code: '编码', dimension: '尺寸', color: '颜色',
}

const DEFAULT_STYLES: TemplateConfig['styles'] = {
  titleFontSize: 16,
  titleFontWeight: 'bold',
  titleColor: '#000000',
  fieldFontSize: 12,
  fieldColor: '#333333',
  backgroundColor: '#FFFFFF',
  borderColor: '#E0E0E0',
  padding: 10,
  spacing: 8,
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
function ProductCardPreview({ fields }: { fields: AvailableField[] }) {
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
function LayoutCanvas({ layout, fields }: { layout: string; fields: AvailableField[] }) {
  const opt = LAYOUT_OPTIONS.find(l => l.value === layout) ?? LAYOUT_OPTIONS[1]
  const cols = opt.columns
  return (
    <div style={{ background: '#f5f5f7', borderRadius: 8, padding: 16 }}>
      <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 12 }}>
        A4 页面预览 · {opt.label}布局
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
          <ProductCardPreview key={i} fields={fields} />
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
      const cfg = data.config

      // 从 columns 反推前端 layout key
      const layoutOpt = LAYOUT_OPTIONS.find(l => l.columns === cfg.columns) ?? LAYOUT_OPTIONS[1]
      const layoutKey = layoutOpt.value

      form.setFieldsValue({ name: data.name, layout: layoutKey, description: data.description })
      setLayout(layoutKey)

      // 暂存 productField 顺序，等 availableFields 加载后映射
      const orderedFields = [...cfg.fields]
        .sort((a, b) => a.order - b.order)
        .map(f => ({ value: f.productField, label: f.label, type: f.type }))
      setSelectedFields(orderedFields)
    } catch { message.error('获取模板失败') }
    finally { setLoading(false) }
  }, [id, form, message])

  useEffect(() => { fetchFields() }, [fetchFields])
  useEffect(() => { fetchTemplate() }, [fetchTemplate])

  // 当 availableFields 加载完成后，用真实字段信息替换（保持顺序）
  useEffect(() => {
    if (availableFields.length === 0) return
    const fieldMap = Object.fromEntries(availableFields.map(f => [f.value, f]))
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
    setActiveField(selectedFields.find(f => f.value === event.active.id) ?? null)
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
      const opt = LAYOUT_OPTIONS.find(l => l.value === values.layout) ?? LAYOUT_OPTIONS[1]
      const config: TemplateConfig = {
        layout: 'grid',
        columns: opt.columns,
        itemsPerPage: opt.itemsPerPage,
        fields: selectedFields.map((f, i) => ({
          productField: f.value,
          label: f.label,
          type: f.type,
          visible: true,
          order: i,
        })),
        styles: DEFAULT_STYLES,
      }
      const payload = { name: values.name, description: values.description, config }

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
              <LayoutCanvas layout={layout} fields={selectedFields} />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}

export default TemplateEditor
