/**
 * /login — standalone sign-in page.
 *
 * The root route's beforeLoad redirects here when no valid session is found.
 * This page never shows the app sidebar/header (the root layout skips AppLayout
 * for auth routes).
 *
 * Clicking "Sign in with SSO" sends the browser to /api/auth/login which kicks
 * off the OIDC Authorization Code + PKCE flow. After successful authentication,
 * the user is returned to the original `returnTo` URL.
 */
import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Typography, Space, Alert, theme } from 'antd'
import { LoginOutlined, ControlOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search['returnTo'] === 'string' ? search['returnTo'] : '/',
    error: typeof search['error'] === 'string' ? search['error'] : undefined as string | undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { returnTo, error } = Route.useSearch()
  const { token } = theme.useToken()

  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: token.colorBgLayout,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowTertiary,
          textAlign: 'center',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', padding: '8px 0' }}>
          {/* Logo */}
          <div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ControlOutlined style={{ color: '#fff', fontSize: 26 }} />
            </div>
            <Title level={3} style={{ margin: 0 }}>
              Mission Control
            </Title>
            <Text type="secondary">Sign in to access the dashboard</Text>
          </div>

          {/* Auth error banner (e.g. callback failure) */}
          {error && (
            <Alert
              type="error"
              message={error}
              showIcon
              style={{ textAlign: 'left' }}
            />
          )}

          {/* SSO button — navigates the full page to start the OIDC flow */}
          <Button
            type="primary"
            size="large"
            icon={<LoginOutlined />}
            block
            href={loginHref}
          >
            Sign in with SSO
          </Button>

          <Text type="secondary" style={{ fontSize: 12 }}>
            You will be redirected to your organisation's identity provider.
          </Text>
        </Space>
      </Card>
    </div>
  )
}

