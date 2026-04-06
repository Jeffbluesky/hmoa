import { Button, Form, Input, Switch } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'

/**
 * Reusable contacts sub-form for Customer and Supplier modals.
 * Must be used inside a <Form> with name="contacts" Form.List.
 */
export function ContactsFormList() {
  return (
    <Form.Item label="联系人">
      <Form.List name="contacts">
        {(fields, { add, remove }) => (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 60px 36px',
                gap: 0,
                background: '#fafafa',
                padding: '6px 8px',
                borderBottom: '1px solid #d9d9d9',
                fontSize: 12,
                color: '#666',
              }}
            >
              <span>姓名 *</span>
              <span>职位</span>
              <span>电话</span>
              <span>邮箱</span>
              <span style={{ textAlign: 'center' }}>主要</span>
              <span />
            </div>
            {fields.map(({ key, name }) => (
              <div
                key={key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 60px 36px',
                  gap: 4,
                  padding: '4px 8px',
                  borderBottom: '1px solid #f0f0f0',
                  alignItems: 'center',
                }}
              >
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
  )
}
