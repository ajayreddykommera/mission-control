/**
 * GET /api/auth/callback
 *
 * OIDC redirect target — registered as OIDC_REDIRECT_URI with the identity provider.
 *
 * Flow:
 *   1. Read the PKCE state from the short-lived encrypted cookie
 *   2. Exchange the authorization code for tokens (with PKCE verification)
 *   3. Extract user claims from the ID token
 *   4. Write an encrypted session cookie
 *   5. Clear the PKCE temp cookie
 *   6. Redirect to the original returnTo destination (or /)
 */
import { createFileRoute } from '@tanstack/react-router'
import { oidcEnabled } from '@config/env'
import { getOidcConfig, exchangeCode, getUserClaims } from '@lib/oidc'
import { getPkceState, makeSessionCookie, clearPkceCookie } from '@lib/session'

export const Route = createFileRoute('/api/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!oidcEnabled) {
          return new Response(null, { status: 302, headers: { Location: "/" } })
        }

        const pkce = await getPkceState(request)
        if (!pkce) {
          return Response.json(
            { error: "Missing or expired OIDC state. Please try logging in again." },
            { status: 400 },
          )
        }

        let sessionCookie: string
        try {
          const config = await getOidcConfig()
          const tokens = await exchangeCode(
            config,
            new URL(request.url),
            pkce.codeVerifier,
            pkce.state,
          )

          const claims = await getUserClaims(config, tokens)

          sessionCookie = await makeSessionCookie({
            user: {
              sub: claims.sub,
              name: claims.name ?? claims.preferred_username ?? claims.sub,
              email: claims.email,
              upn: claims.preferred_username,
            },
            idToken: tokens.id_token,
          })
        } catch (err) {
          console.error('[auth/callback] token exchange failed:', err)
          return Response.json(
            { error: 'Authentication failed. Please try again.' },
            { status: 502 },
          )
        }

        const headers = new Headers({ Location: pkce.returnTo ?? '/' })
        headers.append('Set-Cookie', sessionCookie)
        headers.append('Set-Cookie', clearPkceCookie())

        return new Response(null, { status: 302, headers })
      },
    },
  },
})
