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
          return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=Session+expired.+Please+try+again.' },
          })
        }

        let sessionCookie: string
        try {
          const config = getOidcConfig()
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
          const msg = err instanceof Error ? err.message : String(err)
          console.error('[auth/callback] token exchange failed:', msg)

          // Issuer mismatch hint: decode the raw JWT to show the actual `iss` value
          if (msg.includes('iss') || msg.includes('issuer') || msg.includes('unexpected')) {
            try {
              const urlParams = new URL(request.url).searchParams
              const code = urlParams.get('code')
              if (code) {
                console.error(
                  '[auth/callback] HINT: set OIDC_ISSUER in your .env to the exact `iss` value in the token. ' +
                  'Run: curl -s -X POST ' + process.env['OIDC_TOKEN_URL'] + ' ... and decode the id_token JWT payload.',
                )
              }
            } catch { /* ignore */ }
          }

          return new Response(null, {
            status: 302,
            headers: { Location: `/login?error=${encodeURIComponent('Authentication failed: ' + msg)}` },
          })
        }

        const headers = new Headers({ Location: pkce.returnTo ?? '/' })
        headers.append('Set-Cookie', sessionCookie)
        headers.append('Set-Cookie', clearPkceCookie())

        return new Response(null, { status: 302, headers })
      },
    },
  },
})
