/**
 * AppHeader — fixed top bar with logo + app name on the left,
 * user info and logout button on the right.
 */
import { Link, useRouteContext } from '@tanstack/react-router'
import {
  Layout,
  Button,
  Avatar,
  Typography,
  Space,
  Divider,
  Tag,
  theme,
} from 'antd'
import {
  LogoutOutlined,
  UserOutlined,
  ControlOutlined,
} from '@ant-design/icons'
import { clientEnv, type AppEnv } from '@config/env'

const { Header } = Layout
const { Text } = Typography

// ── Environment badge ────────────────────────────────────────────────────────

const ENV_TAG: Record<AppEnv, { color: string; label: string }> = {
  dev:   { color: 'blue',   label: 'DEV' },
  stage: { color: 'orange', label: 'STAGE' },
  prod:  { color: 'green',  label: 'PROD' },
}

export default function AppHeader() {
  const { token } = theme.useToken()
  // User comes from root route's beforeLoad context (set server-side each request)
  const context = useRouteContext({ from: '__root__' }) as { user?: { name: string; email?: string; upn?: string } }
  const user = context?.user

  return (
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
      {/* Left — logo + app name */}
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
      >
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
        <Tag
          color={ENV_TAG[clientEnv.APP_ENV].color}
          style={{ marginLeft: 4, fontWeight: 600, letterSpacing: '0.5px' }}
        >
          {ENV_TAG[clientEnv.APP_ENV].label}
        </Tag>
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
            {user?.name ?? 'Guest'}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {user?.email ?? user?.upn ?? ''}
          </Text>
        </div>
        <Divider type="vertical" style={{ margin: 0 }} />
        <Button
          type="text"
          icon={<LogoutOutlined />}
          danger
          size="small"
          href="/api/auth/logout"
        >
          Logout
        </Button>
      </Space>
    </Header>
  )
}
