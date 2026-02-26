/**
 * GET /api/auth/login
 *
 * Kicks off the OIDC Authorization Code + PKCE flow.
 * Generates state + PKCE verifier, stores them in a short-lived encrypted cookie,
 * then redirects the browser to the identity provider's authorization endpoint.
 *
 * Optional query param:
 *   ?returnTo=/some/path  — where to redirect after successful login (defaults to /)
 */
import { createFileRoute } from '@tanstack/react-router'
import { oidcEnabled } from '@config/env'
import { getOidcConfig, buildLoginUrl } from '@lib/oidc'
import { makePkceCookie } from '@lib/session'

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!oidcEnabled) {
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=SSO+is+not+configured.+Fill+in+OIDC+vars+in+your+.env+file.' },
          })
        }

        const returnTo = new URL(request.url).searchParams.get('returnTo') ?? '/'

        const config = getOidcConfig()
        const { url, state, codeVerifier } = await buildLoginUrl(config)

        const pkceCookie = await makePkceCookie({ codeVerifier, state, returnTo })

        return new Response(null, {
          status: 302,
          headers: {
            Location: url,
            'Set-Cookie': pkceCookie,
          },
        })
      },
    },
  },
})
