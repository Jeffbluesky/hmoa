import { Row, Col, Card, Statistic } from 'antd'
import { TeamOutlined } from '@ant-design/icons'

function Dashboard() {
  return (
    <div>
      <h1 className="apple-text-section-heading" style={{ marginBottom: 24 }}>仪表盘</h1>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户数量"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <div style={{
          marginTop: 24,
          padding: 24,
          background: '#f5f5f7',
          borderRadius: 8,
          boxShadow: 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
          color: '#1d1d1f'
        }}>
        <h3 style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '0.231px', lineHeight: 1.19, marginBottom: 16 }}>系统状态</h3>
        <p style={{ fontSize: '17px', lineHeight: 1.47, letterSpacing: '-0.374px', marginBottom: 8 }}>✅ 用户系统已就绪</p>
        <p style={{ fontSize: '17px', lineHeight: 1.47, letterSpacing: '-0.374px' }}>⏳ 其他功能开发中...</p>
      </div>
    </div>
  )
}

export default Dashboard
