import { HeadContent, Scripts, createRootRoute, redirect, useRouterState } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleProvider, createCache } from '@ant-design/cssinjs'

import AppLayout from '../components/layout/AppLayout'
import { getUser } from '@lib/getUser'

import appCss from '../styles.css?url'

// Routes that bypass the auth guard (login flow + OAuth callback)
const AUTH_PATHS = ['/login', '/api/auth/', '/refundcontrols/login/oauth2/']

function isAuthRoute(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p))
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

export const Route = createRootRoute({
  // ── Auth guard ──────────────────────────────────────────────────────────────
  // Runs server-side on SSR and client-side on SPA navigations.
  // Redirects unauthenticated users to /login (which then sends them to the IdP).
  beforeLoad: async ({ location }) => {
    if (isAuthRoute(location.pathname)) return {}     // let auth routes through

    const user = await getUser()

    // getUser() returns null when session is absent (OIDC enabled + not logged in).
    // It returns a synthetic user in local dev (OIDC disabled), so no redirect there.
    if (!user) {
      throw redirect({
        to: '/login',
        search: { returnTo: location.pathname, error: undefined },
      })
    }

    return { user }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // ssrInline: antd emits each component's <style> tag inline alongside its
  // HTML in the server payload. Styles arrive with the markup so the browser
  // never renders an unstyled frame — no FOUC on refresh or first paint.
  const cache = createCache()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showLayout = !isAuthRoute(pathname)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <StyleProvider cache={cache} ssrInline>
          <QueryClientProvider client={queryClient}>
            {showLayout ? <AppLayout>{children}</AppLayout> : children}
          </QueryClientProvider>
        </StyleProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
