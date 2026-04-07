import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Dropdown, Avatar } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  UserOutlined,
  BookOutlined,
  DatabaseOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'

const { Header, Sider, Content } = AntLayout

// Phase 2 添加数据字典（含类型管理）、基础材料、产品管理
const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' },
  {
    key: '/dict',
    icon: <BookOutlined />,
    label: '数据字典',
    children: [
      { key: '/dictionary-types', icon: <AppstoreOutlined />, label: '字典类型' },
      { key: '/dictionaries', icon: <DatabaseOutlined />, label: '字典项' },
    ],
  },
  { key: '/materials', icon: <DatabaseOutlined />, label: '基础材料' },
  { key: '/products', icon: <ShoppingOutlined />, label: '产品管理' },
  {
    key: '/crm',
    icon: <TeamOutlined />,
    label: 'CRM管理',
    children: [
      { key: '/customers', icon: <TeamOutlined />, label: '客户管理' },
      { key: '/suppliers', icon: <TeamOutlined />, label: '供应商管理' },
    ],
  },
  {
    key: '/catalog-group',
    icon: <FilePdfOutlined />,
    label: '产品目录',
    children: [
      { key: '/catalog', icon: <AppstoreOutlined />, label: '目录列表' },
      { key: '/catalog/templates', icon: <DatabaseOutlined />, label: '目录模板' },
      { key: '/catalog/covers', icon: <ShoppingOutlined />, label: '封面管理' },
    ],
  },
]

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout()
    }
  }

  return (
    <AntLayout style={{ minHeight: '100vh', background: '#f5f5f7' }}>
      <Sider width={220} style={{ background: '#000000', borderRight: 'none' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#ffffff', fontWeight: 600, letterSpacing: '-0.374px' }}>
            海明OA
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, background: 'transparent', fontSize: '14px' }}
        />
      </Sider>
      <AntLayout>
        <Header style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'saturate(180%) blur(20px)',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: 'none',
            height: '48px',
            lineHeight: '48px'
          }}>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <div style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
              <Avatar icon={<UserOutlined />} style={{ background: 'rgba(255, 255, 255, 0.2)' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{
            margin: '24px',
            padding: '24px',
            background: '#f5f5f7',
            borderRadius: '8px',
            minHeight: 280,
            color: '#1d1d1f'
          }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout