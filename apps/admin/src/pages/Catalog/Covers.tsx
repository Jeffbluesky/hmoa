import { useEffect, useState, useCallback } from 'react'
import { Tabs, Button, Card, Image, Popconfirm, Upload, Modal, Form, Input, App, Empty, Spin } from 'antd'
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { http } from '../../utils/api'
import type { UploadFile } from 'antd'

interface CatalogCover {
  id: string
  name: string
  type: 'front' | 'back'
  url: string
  thumbnail?: string
  size?: number
  createdAt: string
}

function CoverGrid({ type }: { type: 'front' | 'back' }) {
  const { message } = App.useApp()
  const [covers, setCovers] = useState<CatalogCover[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm()

  const fetchCovers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await http.getPage<CatalogCover>('/catalog-covers', { params: { type, pageSize: 100 } })
      setCovers(res.list)
    } catch {
      message.error('获取封面列表失败')
    } finally {
      setLoading(false)
    }
  }, [type, message])

  useEffect(() => { fetchCovers() }, [fetchCovers])

  const handleUpload = async (values: { name: string }) => {
    if (!fileList.length || !fileList[0].originFileObj) {
      message.error('请选择图片文件')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', fileList[0].originFileObj)
      const uploadRes = await http.post<{ url: string; size: number; width?: number; height?: number; mimeType?: string }>(
        '/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      await http.post('/catalog-covers', {
        name: values.name,
        type,
        url: uploadRes.url,
        size: uploadRes.size,
        width: uploadRes.width,
        height: uploadRes.height,
        mimeType: uploadRes.mimeType,
      })
      message.success('上传成功')
      setModalOpen(false)
      form.resetFields()
      setFileList([])
      fetchCovers()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await http.delete(`/catalog-covers/${id}`)
      message.success('删除成功')
      fetchCovers()
    } catch (err: any) {
      message.error(err?.response?.data?.message || '删除失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          上传{type === 'front' ? '封面' : '封底'}
        </Button>
      </div>

      <Spin spinning={loading}>
        {covers.length === 0 && !loading ? (
          <Empty description={`暂无${type === 'front' ? '封面' : '封底'}图片`} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {covers.map(cover => (
              <Card
                key={cover.id}
                hoverable
                cover={
                  <Image
                    src={cover.url}
                    alt={cover.name}
                    style={{ height: 160, objectFit: 'cover' }}
                    preview={{ src: cover.url }}
                  />
                }
                actions={[
                  <Popconfirm
                    key="delete"
                    title="确认删除"
                    description="删除后不可恢复，是否继续？"
                    onConfirm={() => handleDelete(cover.id)}
                    okText="确认"
                    cancelText="取消"
                  >
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>
                ]}
              >
                <Card.Meta
                  title={<span style={{ fontSize: 13 }}>{cover.name}</span>}
                  description={cover.size ? `${(cover.size / 1024).toFixed(1)} KB` : ''}
                />
              </Card>
            ))}
          </div>
        )}
      </Spin>

      <Modal
        title={`上传${type === 'front' ? '封面' : '封底'}`}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => { setModalOpen(false); form.resetFields(); setFileList([]) }}
        confirmLoading={uploading}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：2024春季封面" />
          </Form.Item>
          <Form.Item label="图片文件" required>
            <Upload
              accept="image/*"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>选择图片</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function Covers() {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>封面管理</h1>
      <Tabs
        items={[
          { key: 'front', label: '封面', children: <CoverGrid type="front" /> },
          { key: 'back', label: '封底', children: <CoverGrid type="back" /> },
        ]}
      />
    </div>
  )
}

export default Covers
