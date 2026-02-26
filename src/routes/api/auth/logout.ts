/**
 * GET /api/auth/logout
 *
 * Clears the session cookie and redirects to the OIDC provider's end-session
 * endpoint (if published via discovery) or to OIDC_POST_LOGOUT_URL.
 *
 * The IdP end_session_endpoint logs the user out of the SSO session as well,
 * preventing silent re-login on the next visit.
 */
import { createFileRoute } from '@tanstack/react-router'
import { oidcEnabled } from '@config/env'
import { getOidcConfig, buildLogoutUrl } from '@lib/oidc'
import { getSession, clearSessionCookie } from '@lib/session'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await getSession(request)
        const idToken = session.idToken

        let logoutUrl = '/'
        if (oidcEnabled) {
          try {
            const config = getOidcConfig()
            logoutUrl = buildLogoutUrl(config, idToken)
          } catch {
            // If discovery fails during logout, just redirect home
          }
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: logoutUrl,
            'Set-Cookie': clearSessionCookie(),
          },
        })
      },
    },
  },
})
