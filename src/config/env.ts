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
