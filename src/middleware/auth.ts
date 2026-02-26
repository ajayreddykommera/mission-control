/**
 * Auth middleware
 *
 * isAdmin() — gates all admin (write/history) endpoints.
 * TODO: Replace the stub with real SSO validation when auth is wired up.
 *
 * Example using Azure Static Web Apps built-in auth:
 *   const principal = request.headers.get('x-ms-client-principal')
 *   return principal !== null
 *
 * Example using a session cookie / JWT:
 *   const token = request.headers.get('authorization')?.split(' ')[1]
 *   return verifyToken(token)
 */

export function isAdmin(_request: Request): boolean {
  // TODO: swap for real SSO check
  return true
}
