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
          return Response.json(
            { error: 'SSO is not configured. Set OIDC_ISSUER_URL, OIDC_CLIENT_ID and SESSION_SECRET.' },
            { status: 503 },
          )
        }

        const returnTo = new URL(request.url).searchParams.get('returnTo') ?? '/'

        const config = await getOidcConfig()
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
