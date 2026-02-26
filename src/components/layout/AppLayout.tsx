/**
 * AppLayout — full-page shell.
 *
 * Composes:
 *   AppHeader  — fixed top bar (logo + user info)
 *   AppSider   — collapsible left navigation
 *   AppFooter  — bottom bar (copyright)
 */
import { useState } from 'react'
import { Layout, theme } from 'antd'
import AppHeader from './AppHeader'
import AppSider from './AppSider'
import AppFooter from './AppFooter'

const { Content } = Layout

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { token } = theme.useToken()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />

      <Layout style={{ paddingTop: 60 }}>
        <AppSider collapsed={collapsed} onCollapse={setCollapsed} />

        <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'margin-left 0.2s' }}>
          <Content
            style={{
              background: token.colorBgLayout,
              minHeight: 'calc(100vh - 60px - 48px)',
            }}
          >
            {children}
          </Content>

          <AppFooter />
        </Layout>
      </Layout>
    </Layout>
  )
}
