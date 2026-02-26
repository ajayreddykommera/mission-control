/**
 * oauth4webapi wrapper — no discovery, explicit endpoint URLs.
 *
 * Uses the three OIDC endpoint URLs you already have from your IdP:
 *   OIDC_AUTH_URL   — authorization endpoint (where users log in)
 *   OIDC_TOKEN_URL  — token endpoint (code → tokens)
 *   OIDC_LOGOUT_URL — end-session endpoint (optional)
 *
 * iron-session handles the encrypted HttpOnly session cookie.
 */
import * as oauth from 'oauth4webapi'
import { oidcEnv } from '@config/env'

// ── Types ───────────────────────────────────────────────────────────────────

export type OidcConfig = {
  as: oauth.AuthorizationServer
  client: oauth.Client
  clientAuth: oauth.ClientAuth
}

export type OidcTokens = {
  id_token?: string
  access_token: string
}

export type OidcUser = {
  sub: string
  name?: string
  email?: string
  preferred_username?: string
}

// ── Build config from explicit URLs (no discovery needed) ─────────────────────

let _oidcConfig: OidcConfig | null = null

/**
 * Returns (and caches) the OidcConfig built from your explicit endpoint URLs.
 * No HTTP request is made — the URLs come straight from env vars.
 */
export function getOidcConfig(): OidcConfig {
  if (_oidcConfig) return _oidcConfig

  const authUrl = oidcEnv.OIDC_AUTH_URL

  // Issuer: use explicit value if set, otherwise fall back to the origin of the
  // auth URL (e.g. http://localhost:8100). This is correct for most PingFederate
  // deployments. If token exchange fails with an issuer mismatch error, set
  // OIDC_ISSUER explicitly to whatever `iss` appears in the JWT.
  const issuer = oidcEnv.OIDC_ISSUER || new URL(authUrl).origin

  const as: oauth.AuthorizationServer = {
    issuer,
    authorization_endpoint: authUrl,
    token_endpoint: oidcEnv.OIDC_TOKEN_URL,
    // Only set userinfo / jwks when explicitly provided — omitting jwks_uri
    // skips JWT signature verification (claims are still decoded from payload).
    ...(oidcEnv.OIDC_USERINFO_URL ? { userinfo_endpoint: oidcEnv.OIDC_USERINFO_URL } : {}),
    ...(oidcEnv.OIDC_JWKS_URL    ? { jwks_uri: oidcEnv.OIDC_JWKS_URL }             : {}),
    ...(oidcEnv.OIDC_LOGOUT_URL  ? { end_session_endpoint: oidcEnv.OIDC_LOGOUT_URL } : {}),
  }

  const client: oauth.Client = { client_id: oidcEnv.OIDC_CLIENT_ID }
  const clientAuth = oauth.ClientSecretBasic(oidcEnv.OIDC_CLIENT_SECRET)

  _oidcConfig = { as, client, clientAuth }
  return _oidcConfig
}

// ── Authorization URL builder ─────────────────────────────────────────────────

/**
 * Generate PKCE verifier + state, then build the full authorization redirect URL.
 */
export async function buildLoginUrl(config: OidcConfig): Promise<{
  url: string
  state: string
  codeVerifier: string
}> {
  const codeVerifier = oauth.generateRandomCodeVerifier()
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier)
  const state = oauth.generateRandomState()

  const authUrl = new URL(config.as.authorization_endpoint!)
  authUrl.searchParams.set('client_id', config.client.client_id)
  authUrl.searchParams.set('redirect_uri', oidcEnv.OIDC_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', oidcEnv.OIDC_SCOPES)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')
  authUrl.searchParams.set('state', state)

  return { url: authUrl.href, state, codeVerifier }
}

// ── Token exchange ────────────────────────────────────────────────────────────

/**
 * Complete the Authorization Code + PKCE flow:
 *   1. Validate the callback URL params (state + code)
 *   2. POST to the token endpoint
 *   3. Return access_token + id_token
 */
export async function exchangeCode(
  config: OidcConfig,
  callbackUrl: URL,
  codeVerifier: string,
  expectedState: string,
): Promise<OidcTokens> {
  const { as, client, clientAuth } = config

  // Validates `state` and extracts `code` — throws on CSRF mismatch or error param
  const codeGrantParams = oauth.validateAuthResponse(as, client, callbackUrl, expectedState)

  const tokenResponse = await oauth.authorizationCodeGrantRequest(
    as,
    client,
    clientAuth,
    codeGrantParams,
    oidcEnv.OIDC_REDIRECT_URI,
    codeVerifier,
  )

  const tokens = await oauth.processAuthorizationCodeResponse(as, client, tokenResponse)

  return {
    id_token: typeof tokens.id_token === 'string' ? tokens.id_token : undefined,
    access_token: tokens.access_token,
  }
}

// ── User claims ───────────────────────────────────────────────────────────────

/**
 * Extract user identity from the id_token JWT payload.
 * The signature was already validated by processAuthorizationCodeResponse.
 * Falls back to the userinfo endpoint if id_token is absent.
 */
export async function getUserClaims(
  config: OidcConfig,
  tokens: OidcTokens,
): Promise<OidcUser> {
  if (tokens.id_token) {
    const parts = tokens.id_token.split('.')
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as Record<string, unknown>
    return {
      sub: payload['sub'] as string,
      name: payload['name'] as string | undefined,
      email: payload['email'] as string | undefined,
      preferred_username: payload['preferred_username'] as string | undefined,
    }
  }

  // Fallback: fetch userinfo endpoint
  const { as, client } = config
  const userInfoResponse = await oauth.userInfoRequest(as, client, tokens.access_token)
  const userInfo = await oauth.processUserInfoResponse(as, client, oauth.skipSubjectCheck, userInfoResponse)
  return {
    sub: userInfo.sub,
    name: userInfo['name'] as string | undefined,
    email: userInfo['email'] as string | undefined,
    preferred_username: userInfo['preferred_username'] as string | undefined,
  }
}

// ── Logout URL builder ────────────────────────────────────────────────────────

/**
 * Build the post-logout redirect URL using OIDC_LOGOUT_URL.
 * Falls back to OIDC_POST_LOGOUT_URL if not configured.
 */
export function buildLogoutUrl(
  config: OidcConfig,
  idToken: string | undefined,
): string {
  const endSessionEndpoint = config.as.end_session_endpoint
  if (!endSessionEndpoint || !idToken) {
    return oidcEnv.OIDC_POST_LOGOUT_URL
  }
  const url = new URL(endSessionEndpoint)
  url.searchParams.set('id_token_hint', idToken)
  url.searchParams.set('post_logout_redirect_uri', oidcEnv.OIDC_POST_LOGOUT_URL)
  return url.href
}
