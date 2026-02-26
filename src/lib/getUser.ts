/**
 * getUser — server function that reads the encrypted session cookie.
 * Returns the session user, or null when unauthenticated.
 * No bypass — SSO is enforced in all environments.
 */
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { getSession } from '@lib/session'
import type { SessionUser } from '@lib/session'

export const getUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const request = getRequest()
    const session = await getSession(request)
    return session.user ?? null
  },
)
