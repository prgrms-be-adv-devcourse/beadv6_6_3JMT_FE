import { API_BASE } from '@/lib/apiBase'
import { publicApi } from '@/lib/publicApi'
import {
  normalizeOAuthLoginResult,
  type CompletedLogin,
  type LegacyCompletedLogin,
  type OAuthLoginResult,
} from '@/lib/rejoinContracts'

export type {
  CompletedLogin,
  OAuthLoginResult,
  OAuthUser,
  RejoinRequired,
} from '@/lib/rejoinContracts'

export type KakaoLoginRequest = {
  accessToken: string
}

export type RejoinRequest = {
  rejoinToken: string
}

type ApiResponse<T> = {
  success: boolean
  data: T
  message: string
}

export async function kakaoLogin(payload: KakaoLoginRequest): Promise<OAuthLoginResult> {
  const res = await publicApi.post<ApiResponse<OAuthLoginResult | LegacyCompletedLogin>>(
    `${API_BASE}/auth/oauth/kakao`,
    payload,
  )
  return normalizeOAuthLoginResult(res.data.data)
}

export async function rejoin(payload: RejoinRequest): Promise<CompletedLogin> {
  const res = await publicApi.post<ApiResponse<CompletedLogin>>(`${API_BASE}/auth/rejoin`, payload)
  return res.data.data
}
