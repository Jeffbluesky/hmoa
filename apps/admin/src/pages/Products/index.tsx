import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Tag, Popconfirm, Image } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useCrud } from '../../hooks/useCrud'
import { SearchBar } from '../../components/SearchBar'
import type { Product, Dictionary } from '@hmoa/types'

interface ProductWithRelations extends Product {
  category?: Dictionary | null
  colorDict?: Dictionary | null
}

function Products() {
  const navigate = useNavigate()

  const {
    list,
    loading,
    page,
    pageSize,
    total,
    keyword,
    setKeyword,
    changePage,
    handleDelete,
  } = useCrud<ProductWithRelations>({
    listUrl: '/products',
    initialPageSize: 10,
  })

  const getThumbnail = (images: string | null) => {
    if (!images) return null
    try {
      const arr = JSON.parse(images)
      return arr[0] || null
    } catch {
      return null
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h1>产品管理</h1>
        <Space>
          <SearchBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={() => changePage(1)}
            placeholder="搜索名称/编号/货号"
            style={{ width: 240 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            新建产品
          </Button>
        </Space>
      </div>

      <Table
        columns={[
          {
            title: '缩略图',
            dataIndex: 'images',
            key: 'thumbnail',
            width: 80,
            render: (images: string | null) => {
              const url = getThumbnail(images)
              return url ? (
                <Image
                  src={url}
                  alt="产品图"
                  width={60}
                  height={60}
                  style={{ objectFit: 'contain', borderRadius: 4 }}
                  preview={false}
                />
              ) : (
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: 12,
                  }}
                >
                  无图
                </div>
              )
            },
          },
          {
            title: '内部编号',
            dataIndex: 'internalCode',
            render: (code: string) => <Tag color="purple">{code}</Tag>,
          },
          { title: '产品名称', dataIndex: 'name' },
          {
            title: '货号',
            dataIndex: 'itemNo',
            render: (itemNo: string | null) => itemNo || '-',
          },
          {
            title: '分类',
            dataIndex: 'category',
            render: (category: Dictionary | null) => category?.name || '-',
          },
          {
            title: '颜色',
            dataIndex: 'colorDict',
            render: (colorDict: Dictionary | null) => colorDict?.name || '-',
          },
          {
            title: 'L',
            dataIndex: 'length',
            render: (v: string | null) => v || '-',
          },
          {
            title: 'W',
            dataIndex: 'width',
            render: (v: string | null) => v || '-',
          },
          {
            title: 'H',
            dataIndex: 'height',
            render: (v: string | null) => v || '-',
          },
          {
            title: 'SH',
            dataIndex: 'seatH',
            render: (v: string | null) => v || '-',
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString(),
          },
          {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record: ProductWithRelations) => (
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/products/${record.id}/edit`)}>
                  编辑
                </Button>
                <Popconfirm
                  title="确认删除"
                  description="删除后不可恢复，是否继续？"
                  onConfirm={async () => await handleDelete(`/products/${record.id}`)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        dataSource={list}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: changePage,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </div>
  )
}

export default Products
