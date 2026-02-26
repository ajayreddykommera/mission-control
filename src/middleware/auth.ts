/**
 * Auth middleware — SSO enforced in all environments.
 *
 * isAdmin(request)       — gates all admin (write/history) API routes.
 * getSessionUser(request) — returns the session user for audit `updatedBy` fields.
 *
 * Both return 401 / null when the session cookie is absent or tampered.
 */
import { getSession } from '@lib/session'

export async function getSessionUser(
  request: Request,
): Promise<{ sub: string; name: string; email?: string; upn?: string } | null> {
  const session = await getSession(request)
  return session.user ?? null
}

/**
 * Gate for all internal (write) API routes.
 * Returns true when the request carries a valid session, false otherwise.
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const session = await getSession(request)
  return session.user !== undefined
}
