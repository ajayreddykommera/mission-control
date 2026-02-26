/**
 * GET /refundcontrols/login/oauth2/code/refundcontrols
 *
 * PingFederate redirect shim — mirrors Spring Security's default callback path
 * /login/oauth2/code/{registrationId} under the /refundcontrols context.
 *
 * This path is registered as the redirect_uri in PingFederate.
 * It simply forwards `?code=&state=` to our OIDC callback handler.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/refundcontrols/login/oauth2/code/refundcontrols',
)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const incoming = new URL(request.url)
        const target = new URL('/api/auth/callback', incoming.origin)
        target.search = incoming.search
        return new Response(null, {
          status: 302,
          headers: { Location: target.href },
        })
      },
    },
  },
})
