import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Steps, Form, Input, Select, Button, Card, Space, App, Image, Row, Col, Table, Empty, Tag,
} from 'antd'
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons'
import { http } from '../../utils/api'
import type { ColumnsType } from 'antd/es/table'

interface CatalogTemplate {
  id: string
  name: string
  description?: string
  config: { columns: number; fields: Array<{ productField: string }> }
}

const COLS_LABEL: Record<number, string> = { 1: '单列', 2: '双列', 4: '四格' }
interface CatalogCover { id: string; name: string; type: string; url: string }
interface Product { id: string; name: string; itemNo?: string; code?: string; mainImage?: string; category?: string }

function CatalogForm() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 1
  const [form1] = Form.useForm()

  // Step 2
  const [templates, setTemplates] = useState<CatalogTemplate[]>([])
  const [frontCovers, setFrontCovers] = useState<CatalogCover[]>([])
  const [backCovers, setBackCovers] = useState<CatalogCover[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>()
  const [selectedFrontId, setSelectedFrontId] = useState<string>()
  const [selectedBackId, setSelectedBackId] = useState<string>()

  // Step 3
  const [products, setProducts] = useState<Product[]>([])
  const [productTotal, setProductTotal] = useState(0)
  const [productPage, setProductPage] = useState(1)
  const [productKeyword, setProductKeyword] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await http.get<CatalogTemplate[]>('/catalog-templates/all')
      setTemplates(data)
    } catch { message.error('获取模板列表失败') }
  }, [message])

  const fetchCovers = useCallback(async () => {
    try {
      const [f, b] = await Promise.all([
        http.getPage<CatalogCover>('/catalog-covers', { params: { type: 'front', pageSize: 100 } }),
        http.getPage<CatalogCover>('/catalog-covers', { params: { type: 'back', pageSize: 100 } }),
      ])
      setFrontCovers(f.list)
      setBackCovers(b.list)
    } catch { message.error('获取封面列表失败') }
  }, [message])

  const fetchProducts = useCallback(async () => {
    setProductLoading(true)
    try {
      const res = await http.getPage<Product>('/products', {
        params: { page: productPage, pageSize: 10, keyword: productKeyword || undefined },
      })
      setProducts(res.list)
      setProductTotal(res.meta.total)
    } catch { message.error('获取产品列表失败') }
    finally { setProductLoading(false) }
  }, [productPage, productKeyword, message])

  useEffect(() => { fetchTemplates(); fetchCovers() }, [fetchTemplates, fetchCovers])
  useEffect(() => { if (current === 2) fetchProducts() }, [current, fetchProducts])

  const handleNext = async () => {
    if (current === 0) {
      await form1.validateFields()
      setCurrent(1)
    } else if (current === 1) {
      if (!selectedTemplateId) { message.warning('请选择模板'); return }
      setCurrent(2)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (selectedProductIds.length === 0) { message.warning('请至少选择一个产品'); return }
    setSaving(true)
    try {
      const values = form1.getFieldsValue()
      await http.post('/catalogs', {
        name: values.name,
        description: values.description,
        templateId: selectedTemplateId,
        frontCoverId: selectedFrontId || undefined,
        backCoverId: selectedBackId || undefined,
        productIds: selectedProductIds,
      })
      message.success('目录创建成功')
      navigate('/catalog')
    } catch (err: any) {
      message.error(err?.response?.data?.message || '创建失败')
    } finally {
      setSaving(false)
    }
  }

  const productColumns: ColumnsType<Product> = [
    {
      title: '图片', dataIndex: 'mainImage', width: 60,
      render: (url) => url ? <Image src={url} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} /> : <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4 }} />,
    },
    { title: '产品名称', dataIndex: 'name' },
    { title: '货号', dataIndex: 'itemNo', width: 120 },
    { title: '分类', dataIndex: 'category', width: 100 },
  ]

  const CoverSelector = ({ covers, selected, onSelect, label }: {
    covers: CatalogCover[]; selected?: string; onSelect: (id?: string) => void; label: string
  }) => (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>{label}<Tag style={{ marginLeft: 8 }} color="default">可选</Tag></div>
      {covers.length === 0 ? <Empty description="暂无封面" imageStyle={{ height: 40 }} /> : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {covers.map(c => (
            <div
              key={c.id}
              onClick={() => onSelect(selected === c.id ? undefined : c.id)}
              style={{
                cursor: 'pointer', borderRadius: 8, overflow: 'hidden', width: 100,
                border: selected === c.id ? '2px solid #0071e3' : '2px solid transparent',
                boxShadow: selected === c.id ? '0 0 0 2px #0071e333' : '0 1px 4px #0001',
              }}
            >
              <Image src={c.url} width={96} height={72} style={{ objectFit: 'cover', display: 'block' }} preview={false} />
              <div style={{ padding: '4px 6px', fontSize: 11, color: '#555', textAlign: 'center', background: '#fafafa' }}>{c.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const steps = [
    {
      title: '基本信息',
      content: (
        <Form form={form1} layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item name="name" label="目录名称" rules={[{ required: true, message: '请输入目录名称' }]}>
            <Input placeholder="如：2024春季产品目录" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="可选备注" />
          </Form.Item>
        </Form>
      ),
    },
    {
      title: '选择模板和封面',
      content: (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>目录模板 <span style={{ color: '#ff4d4f' }}>*</span></div>
            {templates.length === 0 ? <Empty description="暂无模板，请先创建模板" imageStyle={{ height: 40 }} /> : (
              <Row gutter={[12, 12]}>
                {templates.map(t => (
                  <Col key={t.id} span={8}>
                    <Card
                      hoverable
                      size="small"
                      onClick={() => setSelectedTemplateId(t.id)}
                      style={{
                        border: selectedTemplateId === t.id ? '2px solid #0071e3' : '2px solid #e0e0e0',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{t.name}</div>
                      <Tag color="blue" style={{ marginTop: 4 }}>{COLS_LABEL[t.config?.columns] ?? `${t.config?.columns}列`}</Tag>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{t.config?.fields?.length ?? 0} 个字段</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
          <CoverSelector covers={frontCovers} selected={selectedFrontId} onSelect={setSelectedFrontId} label="封面" />
          <div style={{ marginTop: 16 }}>
            <CoverSelector covers={backCovers} selected={selectedBackId} onSelect={setSelectedBackId} label="封底" />
          </div>
        </div>
      ),
    },
    {
      title: '选择产品',
      content: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span>已选 <strong>{selectedProductIds.length}</strong> 个产品</span>
            <Input.Search
              placeholder="搜索产品"
              allowClear
              style={{ width: 220 }}
              onSearch={(v) => { setProductKeyword(v); setProductPage(1) }}
            />
          </div>
          <Table
            rowKey="id"
            size="small"
            columns={productColumns}
            dataSource={products}
            loading={productLoading}
            rowSelection={{
              selectedRowKeys: selectedProductIds,
              onChange: (keys) => setSelectedProductIds(keys as string[]),
            }}
            pagination={{
              current: productPage,
              pageSize: 10,
              total: productTotal,
              onChange: setProductPage,
              showTotal: (t) => `共 ${t} 条`,
              size: 'small',
            }}
          />
        </div>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalog')}>返回</Button>
        <h1 style={{ margin: 0 }}>新建产品目录</h1>
      </div>

      <Steps current={current} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 32 }} />

      <Card style={{ minHeight: 320 }}>
        {steps[current].content}
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <Button disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>
          上一步
        </Button>
        <Space>
          <Button onClick={() => navigate('/catalog')}>取消</Button>
          <Button
            type="primary"
            icon={current === steps.length - 1 ? <CheckOutlined /> : <ArrowRightOutlined />}
            onClick={handleNext}
            loading={saving}
          >
            {current === steps.length - 1 ? '创建目录' : '下一步'}
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default CatalogForm
