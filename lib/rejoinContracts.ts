export type OAuthUser = {
  id: string
  name: string
  email: string
  roles: string[]
}

export type CompletedLogin = {
  loginStatus: 'COMPLETED'
  isNewUser: boolean
  user: OAuthUser
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresAt: string
}

export type RejoinRequired = {
  loginStatus: 'REJOIN_REQUIRED'
  isNewUser: false
  rejoinToken: string
  rejoinExpiresAt: string
}

export type OAuthLoginResult = CompletedLogin | RejoinRequired

export type LegacyCompletedLogin = Omit<CompletedLogin, 'loginStatus'>

export function normalizeOAuthLoginResult(
  result: OAuthLoginResult | LegacyCompletedLogin,
): OAuthLoginResult {
  if (!('loginStatus' in result)) {
    return { ...result, loginStatus: 'COMPLETED' }
  }
  return result
}

export function getOAuthLoginDestination(result: OAuthLoginResult) {
  if (result.loginStatus === 'REJOIN_REQUIRED') return '/auth/rejoin' as const
  return result.isNewUser ? ('/onboarding' as const) : ('/' as const)
}

export function getAuthErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null

  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return null

  const data = (response as { data?: unknown }).data
  if (typeof data !== 'object' || data === null) return null

  const rawCode =
    (data as { code?: unknown; errorCode?: unknown }).code ??
    (data as { errorCode?: unknown }).errorCode
  if (typeof rawCode !== 'string') return null

  const shortCode = rawCode.match(/A\d{3}/)?.[0]
  return shortCode ?? rawCode
}
