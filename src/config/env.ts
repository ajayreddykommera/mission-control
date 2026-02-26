/**
 * Validated environment configuration
 *
 * Import from here instead of accessing process.env directly.
 * Variables are validated once at startup — missing required vars throw immediately.
 */

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  /** 'local' | 'azure' */
  AZURE_TABLES_ENV: optional('AZURE_TABLES_ENV', 'local') as 'local' | 'azure',

  // ── Local (Azurite) ──────────────────────────────────────────────────────
  get AZURE_STORAGE_CONNECTION_STRING(): string {
    return required('AZURE_STORAGE_CONNECTION_STRING')
  },

  // ── Azure (Service Principal) ────────────────────────────────────────────
  get AZURE_STORAGE_ACCOUNT_URL(): string {
    return required('AZURE_STORAGE_ACCOUNT_URL')
  },
  get AZURE_TENANT_ID(): string {
    return required('AZURE_TENANT_ID')
  },
  get AZURE_CLIENT_ID(): string {
    return required('AZURE_CLIENT_ID')
  },
  get AZURE_CLIENT_SECRET(): string {
    return required('AZURE_CLIENT_SECRET')
  },
} as const

// ── OIDC / SSO (server-side, runtime only) ───────────────────────────────────
// All accessed lazily (getter) so missing vars only throw when OIDC is used.
// Set OIDC_AUTH_URL + OIDC_CLIENT_ID + SESSION_SECRET to enable SSO.
// If any are absent the app falls back to open access (local dev mode).

/** true when all required OIDC vars are present — gates SSO enforcement */
export const oidcEnabled = Boolean(
  process.env['OIDC_AUTH_URL'] &&
  process.env['OIDC_CLIENT_ID'] &&
  process.env['SESSION_SECRET'],
)

export const oidcEnv = {
  /** Authorization endpoint — where users are sent to log in */
  get OIDC_AUTH_URL(): string { return required('OIDC_AUTH_URL') },
  /** Token endpoint — where the authorization code is exchanged for tokens */
  get OIDC_TOKEN_URL(): string { return required('OIDC_TOKEN_URL') },
  /** Userinfo endpoint — to fetch user claims when id_token lacks them (optional) */
  OIDC_USERINFO_URL: optional('OIDC_USERINFO_URL', ''),
  /**
   * JWKS endpoint — used to verify JWT signatures (optional).
   * If absent, JWT signature verification is skipped (claims are still decoded).
   */
  OIDC_JWKS_URL: optional('OIDC_JWKS_URL', ''),
  /**
   * Issuer identifier — must match the `iss` claim in the JWT.
   * Optional: if not set, defaults to the origin of OIDC_AUTH_URL.
   * (e.g. http://localhost:8100/as/authorization.oauth2 → http://localhost:8100)
   */
  OIDC_ISSUER: optional('OIDC_ISSUER', ''),
  /** End-session endpoint — where users are sent to log out (optional) */
  OIDC_LOGOUT_URL: optional('OIDC_LOGOUT_URL', ''),
  get OIDC_CLIENT_ID(): string { return required('OIDC_CLIENT_ID') },
  get OIDC_CLIENT_SECRET(): string { return required('OIDC_CLIENT_SECRET') },
  /** Full callback URL registered with your identity provider */
  get OIDC_REDIRECT_URI(): string { return required('OIDC_REDIRECT_URI') },
  /** Where to send the user after logout (defaults to app root) */
  OIDC_POST_LOGOUT_URL: optional('OIDC_POST_LOGOUT_URL', '/'),
  /** Space-separated scopes (default: openid profile) */
  OIDC_SCOPES: optional('OIDC_SCOPES', 'openid profile'),
  /** Min 32-char random secret used to encrypt session cookies */
  get SESSION_SECRET(): string { return required('SESSION_SECRET') },
} as const

// ── Client-side only (Vite build-time) ───────────────────────────────────────
// These are injected by Vite at build time and available in the browser.
// Set them in .env.local / CI environment variables (no VITE_ prefix needed —
// vite.config.ts exposes APP_*, DEV_*, STAGE_*, PROD_* automatically).

export type AppEnv = 'dev' | 'stage' | 'prod'

export const clientEnv = {
  /** Which environment this deployment is ('dev' | 'stage' | 'prod') */
  APP_ENV: (import.meta.env['APP_ENV'] ?? 'dev') as AppEnv,

  /** Full base URLs for each sibling deployment (empty = link hidden) */
  DEV_URL: (import.meta.env['APP_DEV_URL'] ?? '') as string,
  STAGE_URL: (import.meta.env['APP_STAGE_URL'] ?? '') as string,
  PROD_URL: (import.meta.env['APP_PROD_URL'] ?? '') as string,
} as const
