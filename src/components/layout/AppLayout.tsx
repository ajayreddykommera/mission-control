/**
 * AppLayout — full-page shell using antd Layout.
 *
 * Structure:
 *   Layout
 *     Header  — logo + app name | user info + logout
 *     Layout
 *       Sider  — Flags History nav
 *       Content — page content
 *     Footer
 */
import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Typography,
  Space,
  Divider,
  theme,
} from 'antd'
import {
  FlagOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  ControlOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content, Footer } = Layout
const { Text } = Typography

// ── Hardcoded user (replace with real auth later) ──────────────────────────
const MOCK_USER = {
  name: 'Ajay Reddy',
  id: 'USR-00142',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const selectedKey =
    pathname.startsWith('/history') ? 'history' : 'flags'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          height: 60,
        }}
      >
        {/* Left — logo + name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: token.colorPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ControlOutlined style={{ color: '#fff', fontSize: 16 }} />
          </div>
          <Text strong style={{ fontSize: 16, letterSpacing: '-0.3px' }}>
            Mission Control
          </Text>
        </Link>

        {/* Right — user info + logout */}
        <Space size={12} align="center">
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
          />
          <div style={{ lineHeight: 1.3 }}>
            <Text strong style={{ display: 'block', fontSize: 13 }}>
              {MOCK_USER.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {MOCK_USER.id}
            </Text>
          </div>
          <Divider type="vertical" style={{ margin: 0 }} />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            danger
            size="small"
            onClick={() => {
              // TODO: wire to real auth logout
              console.log('logout')
            }}
          >
            Logout
          </Button>
        </Space>
      </Header>

      <Layout style={{ paddingTop: 60 }}>
        {/* ── Sider ──────────────────────────────────────────────────────── */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={220}
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            height: 'calc(100vh - 60px)',
            zIndex: 99,
            background: token.colorBgContainer,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ borderRight: 0 }}
            items={[
              {
                key: 'flags',
                icon: <FlagOutlined />,
                label: <Link to="/">Feature Flags</Link>,
              },
              {
                key: 'history',
                icon: <HistoryOutlined />,
                label: <Link to="/history">Flags History</Link>,
              },
            ]}
          />
          {/* Collapse toggle — absolutely pinned to bottom */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              borderRadius: 0,
              height: 48,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          />
        </Sider>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
          <Content
            style={{
              background: token.colorBgLayout,
              minHeight: 'calc(100vh - 60px - 48px)',
            }}
          >
            {children}
          </Content>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <Footer
            style={{
              textAlign: 'center',
              padding: '12px 24px',
              background: token.colorBgContainer,
              borderTop: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              © {new Date().getFullYear()} Mission Control &nbsp;·&nbsp; Privacy Policy &nbsp;·&nbsp; All rights reserved
            </Text>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  )
}
