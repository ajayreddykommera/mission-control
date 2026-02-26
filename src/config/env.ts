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
