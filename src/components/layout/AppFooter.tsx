/**
 * AppFooter — simple bottom bar with copyright and policy links.
 */
import { Layout, Typography, theme } from 'antd'

const { Footer } = Layout
const { Text } = Typography

export default function AppFooter() {
  const { token } = theme.useToken()

  return (
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
  )
}
