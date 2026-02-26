/**
 * Auth middleware
 *
 * isAdmin(request) — gates all admin (write/history) endpoints.
 *
 * When OIDC env vars are present (OIDC_ISSUER_URL + OIDC_CLIENT_ID + SESSION_SECRET)
 * the session cookie is verified. Unauthenticated requests get 401 so the UI
 * can redirect to /api/auth/login.
 *
 * When those vars are absent (local dev without SSO) access is open — any request
 * is treated as admin. Set the vars in .env.local to test SSO locally.
 */
import { oidcEnabled } from '@config/env'
import { getSession } from '@lib/session'

/**
 * Returns the session user if authenticated, null otherwise.
 * Pass the result to isAdmin() or use the user directly for `updatedBy`.
 */
export async function getSessionUser(
  request: Request,
): Promise<{ sub: string; name: string; email?: string; upn?: string } | null> {
  if (!oidcEnabled) {
    // Local dev — return a synthetic admin so mutations still record an identity
    return { sub: 'local', name: 'Local Dev' }
  }
  const session = await getSession(request)
  return session.user ?? null
}

/**
 * Gate for all internal (write) API routes.
 * Returns true when the request carries a valid session, false otherwise.
 */
export async function isAdmin(request: Request): Promise<boolean> {
  if (!oidcEnabled) return true
  const session = await getSession(request)
  return session.user !== undefined
}
