/**
 * Session management via encrypted HttpOnly cookies.
 *
 * Uses iron-session sealData/unsealData so there is no database dependency.
 * The session lives entirely in the cookie — signed + encrypted with SESSION_SECRET.
 */
import { sealData, unsealData } from 'iron-session'

export type SessionUser = {
  sub: string
  name: string
  email?: string
  upn?: string
}

export type SessionData = {
  user?: SessionUser
  idToken?: string
}

const COOKIE_NAME = 'mc_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

function getSecret(): string {
  const s = process.env['SESSION_SECRET']
  if (!s) throw new Error('SESSION_SECRET is not set')
  return s
}

// ── Cookie parsing ────────────────────────────────────────────────────────────

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((p) => p.length >= 2)
      .map(([k, ...rest]) => [k.trim(), rest.join('=').trim()]),
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Read + decrypt the session from the incoming request cookie. Returns {} if absent or tampered. */
export async function getSession(request: Request): Promise<SessionData> {
  const cookies = parseCookies(request.headers.get('cookie'))
  const sealed = cookies[COOKIE_NAME]
  if (!sealed) return {}
  try {
    return await unsealData<SessionData>(sealed, { password: getSecret() })
  } catch {
    return {}
  }
}

/** Encrypt session data and return a Set-Cookie header value. */
export async function makeSessionCookie(data: SessionData): Promise<string> {
  const sealed = await sealData(data, { password: getSecret(), ttl: COOKIE_MAX_AGE })
  const secure = process.env['NODE_ENV'] === 'production' ? ' Secure;' : ''
  return `${COOKIE_NAME}=${sealed}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE};${secure}`
}

/** Return a Set-Cookie header value that immediately expires the session cookie. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

// ── Temp PKCE / state cookie (short-lived, used between login ↔ callback) ────

const PKCE_COOKIE = 'mc_oidc'
const PKCE_TTL = 60 * 5 // 5 minutes

export type PkceState = {
  codeVerifier: string
  state: string
  returnTo?: string
}

export async function makePkceCookie(data: PkceState): Promise<string> {
  const sealed = await sealData(data, { password: getSecret(), ttl: PKCE_TTL })
  const secure = process.env['NODE_ENV'] === 'production' ? ' Secure;' : ''
  return `${PKCE_COOKIE}=${sealed}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${PKCE_TTL};${secure}`
}

export async function getPkceState(request: Request): Promise<PkceState | null> {
  const cookies = parseCookies(request.headers.get('cookie'))
  const sealed = cookies[PKCE_COOKIE]
  if (!sealed) return null
  try {
    return await unsealData<PkceState>(sealed, { password: getSecret() })
  } catch {
    return null
  }
}

export function clearPkceCookie(): string {
  return `${PKCE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
