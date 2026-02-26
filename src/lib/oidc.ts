/**
 * openid-client v6 wrapper — lazy-discovery, singleton config.
 *
 * Performs OIDC Discovery against OIDC_ISSUER_URL on first use and caches
 * the result for the lifetime of the process. All enterprise OIDC providers
 * (Azure AD / Entra ID, Okta, Ping, Auth0, Keycloak) expose the standard
 * /.well-known/openid-configuration discovery document.
 *
 * Usage:
 *   const config = await getOidcConfig()
 *   const redirectUrl = buildAuthorizationUrl(config, { ... })
 */
import {
  discovery,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  fetchUserInfo,
  randomState,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  type Configuration,
  type TokenEndpointResponse,
} from 'openid-client'
import { oidcEnv } from '@config/env'

export type { Configuration, TokenEndpointResponse }

// ── Singleton discovery ────────────────────────────────────────────────────────

let _config: Configuration | null = null

/** Returns the (cached) openid-client Configuration, performing discovery on first call. */
export async function getOidcConfig(): Promise<Configuration> {
  if (_config) return _config
  _config = await discovery(
    new URL(oidcEnv.OIDC_ISSUER_URL),
    oidcEnv.OIDC_CLIENT_ID,
    { client_secret: oidcEnv.OIDC_CLIENT_SECRET },
  )
  return _config
}

// ── Authorization URL builder ─────────────────────────────────────────────────

export type AuthorizationParams = {
  /** Value to produce and later verify for CSRF protection */
  state: string
  codeVerifier: string
}

/**
 * Generate PKCE verifier + state, then build the full authorization redirect URL.
 * Returns the URL string and the generated values to be stored in the PKCE cookie.
 */
export async function buildLoginUrl(config: Configuration): Promise<{
  url: string
  state: string
  codeVerifier: string
}> {
  const codeVerifier = randomPKCECodeVerifier()
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier)
  const state = randomState()

  const authUrl = buildAuthorizationUrl(config, {
    redirect_uri: oidcEnv.OIDC_REDIRECT_URI,
    scope: oidcEnv.OIDC_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  return { url: authUrl.href, state, codeVerifier }
}

// ── Token exchange ────────────────────────────────────────────────────────────

/**
 * Complete the Authorization Code flow by exchanging the callback URL
 * (with `code` and `state` params) for tokens.
 */
export async function exchangeCode(
  config: Configuration,
  callbackUrl: URL,
  codeVerifier: string,
  expectedState: string,
): Promise<TokenEndpointResponse> {
  return authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
  })
}

// ── User info ─────────────────────────────────────────────────────────────────

export type OidcUser = {
  sub: string
  name?: string
  email?: string
  preferred_username?: string
}

/**
 * Decode id_token payload (no signature verification needed — already validated
 * during token exchange). Falls back to fetchUserInfo if id_token is absent.
 */
export async function getUserClaims(
  config: Configuration,
  tokens: TokenEndpointResponse,
): Promise<OidcUser> {
  // Fast path: decode the id_token JWT payload (header.payload.sig)
  if (tokens.id_token) {
    const payload = JSON.parse(
      Buffer.from(tokens.id_token.split('.')[1], 'base64').toString('utf8'),
    ) as Record<string, unknown>
    return {
      sub: payload['sub'] as string,
      name: payload['name'] as string | undefined,
      email: payload['email'] as string | undefined,
      preferred_username: payload['preferred_username'] as string | undefined,
    }
  }
  // Fallback: userinfo endpoint
  const userInfo = await fetchUserInfo(
    config,
    tokens.access_token,
    undefined as unknown as string,
  ) as Record<string, unknown>
  return {
    sub: userInfo['sub'] as string,
    name: userInfo['name'] as string | undefined,
    email: userInfo['email'] as string | undefined,
    preferred_username: userInfo['preferred_username'] as string | undefined,
  }
}

// ── Logout URL builder ────────────────────────────────────────────────────────

/**
 * Build the post-logout redirect URL.
 * Uses the end_session_endpoint from discovery if available;
 * falls back to OIDC_POST_LOGOUT_URL if the provider doesn't publish one.
 */
export function buildLogoutUrl(
  config: Configuration,
  idToken: string | undefined,
): string {
  // openid-client v6 exposes server metadata
  const endSessionEndpoint = (config.serverMetadata() as Record<string, string>)['end_session_endpoint']
  if (!endSessionEndpoint || !idToken) {
    return oidcEnv.OIDC_POST_LOGOUT_URL
  }
  const url = new URL(endSessionEndpoint)
  url.searchParams.set('id_token_hint', idToken)
  url.searchParams.set('post_logout_redirect_uri', oidcEnv.OIDC_POST_LOGOUT_URL)
  return url.href
}
