import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleProvider, createCache } from '@ant-design/cssinjs'

import AppLayout from '../components/layout/AppLayout'

import appCss from '../styles.css?url'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
})

export const Route = createRootRoute({
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

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <StyleProvider cache={cache} ssrInline>
          <QueryClientProvider client={queryClient}>
            <AppLayout>
              {children}
            </AppLayout>
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
