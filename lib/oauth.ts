import api from '@/lib/auth'

export type OAuthUser = {
  id: string
  name: string
  email: string
  roles: string[]
}

export type KakaoLoginRequest = {
  oauthId: string
  name: string
  profileImage: string | null
  email: string | null
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
    '/api/v1/auth/oauth/kakao',
    payload,
  )
  return res.data.data
}
