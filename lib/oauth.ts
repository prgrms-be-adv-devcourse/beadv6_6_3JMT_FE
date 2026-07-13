import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export type OAuthUser = {
  id: string
  name: string
  email: string
  roles: string[]
}

export type KakaoLoginRequest = {
  accessToken: string
}

export type KakaoLoginResponse = {
  user: OAuthUser
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresAt: string
  isNewUser: boolean
}

export async function kakaoLogin(payload: KakaoLoginRequest): Promise<KakaoLoginResponse> {
  const res = await api.post<{ success: boolean; data: KakaoLoginResponse; message: string }>(
    `${API_BASE}/auth/oauth/kakao`,
    payload,
  )
  return res.data.data
}
