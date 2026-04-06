import { useEffect, useState } from 'react'
import {
  Table, Button, Tag, Modal, Form, Input,
  Select, Switch, Card, Alert, Tooltip, App
} from 'antd'
import { PlusOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { useCrud } from '../hooks/useCrud'
import { http } from '../utils/api'
import { TableActions } from '../components/TableActions'
import type { Dictionary, DictionaryType } from '@hmoa/types'

const { Option } = Select

function Dictionaries() {
  const { message } = App.useApp()
  const [types, setTypes] = useState<DictionaryType[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [sortEditable, setSortEditable] = useState(false)
  const [form] = Form.useForm()

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
    refresh,
  } = useCrud<Dictionary>({
    listUrl: '/dictionaries',
    initialPageSize: 10,
    fixedParams: selectedTypeId ? { typeId: selectedTypeId } : {},
    immediate: false,
  })

  useEffect(() => {
    http.get<DictionaryType[]>('/dictionary-types/active')
      .then((res) => {
        setTypes(res)
        if (res.length > 0 && !selectedTypeId) {
          setSelectedTypeId(res[0].id)
        }
      })
      .catch(() => message.error('获取字典类型失败'))
  }, [message, selectedTypeId])

  useEffect(() => {
    if (selectedTypeId) {
      refresh()
    }
  }, [selectedTypeId, page, pageSize])

  useEffect(() => {
    if (!modalVisible) setSortEditable(false)
  }, [modalVisible])

  const onFinish = async (values: any) => {
    if (!selectedTypeId) return
    const payload = {
      name: values.name,
      en: values.en ?? '',
      jp: values.jp ?? '',
      symbol: values.symbol ?? '',
      other: values.other ?? '',
      sortOrder: Number(values.sortOrder) || 1,
      isActive: values.isActive,
      typeId: selectedTypeId,
    }
    const url = editingItem ? `/dictionaries/${(editingItem as Dictionary).id}` : '/dictionaries'
    const method = editingItem ? 'put' : 'post'
    const ok = await handleSubmit(url, payload, method)
    if (ok) form.resetFields()
  }

  const afterOpenChange = (open: boolean) => {
    if (open) {
      if (editingItem) {
        form.setFieldsValue({
          name: editingItem.name,
          en: editingItem.en || '',
          jp: editingItem.jp || '',
          symbol: editingItem.symbol || '',
          other: editingItem.other || '',
          sortOrder: editingItem.sortOrder,
          isActive: editingItem.isActive,
        })
      } else {
        form.resetFields()
        const nextSort = list.length > 0 ? Math.max(...list.map((d) => d.sortOrder || 0)) + 1 : 1
        form.setFieldsValue({
          sortOrder: nextSort,
          isActive: true,
        })
      }
    } else {
      form.resetFields()
    }
  }

  const selectedType = types.find((t) => t.id === selectedTypeId)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1>字典项管理</h1>
          <p style={{ color: '#666', marginTop: 8 }}>
            在选定的字典类型下录入具体值，如：颜色类型下录入红、绿、蓝
          </p>
        </div>
      </div>

      <Alert
        message="使用说明"
        description="1. 先在上方选择字典类型；2. 然后在该类型下添加具体的字典项（如选择「颜色」类型，添加「红色」）；3. 编码会自动从名称生成。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 'bold' }}>选择字典类型：</span>
          <Select
            style={{ width: 300 }}
            placeholder="请选择字典类型"
            value={selectedTypeId}
            onChange={(id) => {
              setSelectedTypeId(id)
              changePage(1)
            }}
          >
            {types.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
          {selectedType && <Tag color="blue">已选择：{selectedType.name}</Tag>}
        </div>
      </Card>

      {selectedTypeId && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3>{selectedType?.name} 下的字典项</h3>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              新建字典项
            </Button>
          </div>

          <Table
            columns={[
              { title: '值', dataIndex: 'name' },
              {
                title: '英文',
                dataIndex: 'en',
                render: (v: string | null) => v || '-',
              },
              {
                title: '日语',
                dataIndex: 'jp',
                render: (v: string | null) => v || '-',
              },
              {
                title: '符号',
                dataIndex: 'symbol',
                render: (v: string | null) => v || '-',
              },
              {
                title: '其他',
                dataIndex: 'other',
                render: (v: string | null) => v || '-',
              },
              { title: '排序', dataIndex: 'sortOrder' },
              {
                title: '状态',
                dataIndex: 'isActive',
                render: (isActive: boolean) => (
                  <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? '启用' : '禁用'}
                  </Tag>
                ),
              },
              {
                title: '操作',
                render: (_, record: Dictionary) => (
                  <TableActions
                    record={record}
                    onEdit={openModal}
                    onDelete={async () => {
                      await handleDelete(`/dictionaries/${record.id}`)
                    }}
                  />
                ),
              },
            ]}
            dataSource={list}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: `暂无${selectedType?.name}类型的字典项，请点击上方按钮添加` }}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: changePage,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
            }}
          />
        </>
      )}

      <Modal
        title={editingItem ? '编辑字典项' : '新建字典项'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={closeModal}
        afterOpenChange={afterOpenChange}
        confirmLoading={submitting}
        maskClosable={false}
      >
        {selectedType && (
          <Alert message={`当前字典类型：${selectedType.name}`} type="info" style={{ marginBottom: 16 }} />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="name"
            label="值"
            rules={[{ required: true, message: '请输入值' }]}
            tooltip="显示值，如：红色、绿色、人民币"
          >
            <Input placeholder="如：红色、绿色、人民币" />
          </Form.Item>

          <Form.Item
            name="en"
            label="英文"
            tooltip="英文名称（如需要）"
          >
            <Input placeholder="如：Red、USD、Meter" />
          </Form.Item>

          <Form.Item
            name="jp"
            label="日语"
            tooltip="日语名称（如需要）"
          >
            <Input placeholder="如：赤、米ドル、メートル" />
          </Form.Item>

          <Form.Item
            name="symbol"
            label="符号"
            tooltip="符号（如需要），如货币符号、单位符号"
          >
            <Input placeholder="如：¥、$、m、kg" />
          </Form.Item>

          <Form.Item
            name="other"
            label="其他"
            tooltip="其他补充信息（如需要）"
          >
            <Input placeholder="其他备注信息" />
          </Form.Item>

          <Form.Item
            name="sortOrder"
            initialValue={1}
            label={
              <span>
                排序
                <Tooltip title={sortEditable ? '点击锁定排序' : '点击解锁编辑排序'}>
                  <Button
                    type="link"
                    size="small"
                    icon={sortEditable ? <UnlockOutlined /> : <LockOutlined />}
                    onClick={() => setSortEditable(!sortEditable)}
                    style={{ marginLeft: 8, padding: '0 4px' }}
                  >
                    {sortEditable ? '已解锁' : '已锁定'}
                  </Button>
                </Tooltip>
              </span>
            }
          >
            <Input
              type="number"
              min={1}
              disabled={!sortEditable}
              placeholder={sortEditable ? '请输入排序数字' : '点击右侧按钮解锁编辑'}
            />
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Dictionaries
