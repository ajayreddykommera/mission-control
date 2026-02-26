/**
 * AppSider — collapsible left navigation sidebar.
 *
 * Props:
 *   collapsed   — whether the sider is currently collapsed
 *   onCollapse  — callback to toggle collapsed state
 */
import { Link, useRouterState } from '@tanstack/react-router'
import { Layout, Menu, Button, theme } from 'antd'
import {
  FlagOutlined,
  HistoryOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

interface AppSiderProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

export default function AppSider({ collapsed, onCollapse }: AppSiderProps) {
  const { token } = theme.useToken()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const selectedKey = pathname.startsWith('/history') ? 'history' : 'flags'

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
