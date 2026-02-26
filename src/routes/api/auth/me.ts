/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user from the session cookie.
 * Used by the UI to:
 *   - Determine if the user is logged in
 *   - Display name / email in the header
 *   - Redirect to /api/auth/login when 401
 *
 * Response:
 *   200 { user: SessionUser }
 *   401 { error: 'Unauthenticated' }
 */
import { createFileRoute } from '@tanstack/react-router'
import { oidcEnabled } from '@config/env'
import { getSession } from '@lib/session'

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // When SSO is not configured (local dev) return a synthetic admin user
        if (!oidcEnabled) {
          return Response.json({
            user: { sub: 'local', name: 'Local Dev', email: undefined, upn: undefined },
          })
        }

        const session = await getSession(request)
        if (!session.user) {
          return Response.json({ error: 'Unauthenticated' }, { status: 401 })
        }

        return Response.json({ user: session.user })
      },
    },
  },
})
