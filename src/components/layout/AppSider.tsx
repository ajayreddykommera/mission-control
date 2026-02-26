/**
 * AppSider — collapsible left navigation sidebar.
 *
 * Props:
 *   collapsed   — whether the sider is currently collapsed
 *   onCollapse  — callback to toggle collapsed state
 */
import { Link, useRouterState } from '@tanstack/react-router'
import { Layout, Menu, Button, Tag, Tooltip, theme } from 'antd'
import {
  FlagOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleFilled,
  LinkOutlined,
} from '@ant-design/icons'
import { clientEnv } from '@config/env'

const { Sider } = Layout

interface AppSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export default function AppSider({ collapsed, onCollapse }: AppSiderProps) {
  const { token } = theme.useToken()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const selectedKey = pathname.startsWith('/history') ? 'history' : 'flags'

  // ── Environment links ──────────────────────────────────────────────────────
  const ENV_CONFIG = [
    { key: 'dev' as const,   label: 'Dev',        color: '#1677ff', url: clientEnv.DEV_URL },
    { key: 'stage' as const, label: 'Staging',     color: '#fa8c16', url: clientEnv.STAGE_URL },
    { key: 'prod' as const,  label: 'Production',  color: '#52c41a', url: clientEnv.PROD_URL },
  ]

  const envMenuItems = ENV_CONFIG.map((e) => {
    const isCurrent = e.key === clientEnv.APP_ENV
    return {
      key: `env-${e.key}`,
      icon: isCurrent
        ? <CheckCircleFilled style={{ color: e.color, fontSize: 12 }} />
        : <LinkOutlined style={{ color: e.color, fontSize: 12 }} />,
      label: isCurrent ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {e.label}
          <Tag
            bordered={false}
            style={{
              background: `${e.color}1a`,
              color: e.color,
              fontSize: 10,
              padding: '0 4px',
              lineHeight: '16px',
              height: 16,
            }}
          >
            here
          </Tag>
        </span>
      ) : (
        <Tooltip title={e.url || 'URL not configured'} placement="right">
          <a href={e.url || '#'} style={{ color: 'inherit' }}>
            {e.label}
          </a>
        </Tooltip>
      ),
      disabled: isCurrent || !e.url,
      style: isCurrent ? { cursor: 'default' } : undefined,
    }
  })

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
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
          { type: 'divider' },
          {
            key: 'envs',
            type: 'group',
            label: collapsed ? null : (
              <span style={{ fontSize: 11, color: token.colorTextTertiary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Environments
              </span>
            ),
            children: envMenuItems,
          },
        ]}
      />

      {/* Collapse toggle — pinned to bottom */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => onCollapse(!collapsed)}
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
  )
}
