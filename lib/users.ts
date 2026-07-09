import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export type UserProfile = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  role: 'buyer' | 'seller' | 'admin'
  provider: 'local' | 'kakao'
  sellerStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null
}

export async function getUserMe(): Promise<UserProfile> {
  const res = await api.get<{ success: boolean; data: UserProfile; message: string }>(`${API_BASE}/users/me`)
  return res.data.data
}

export interface UpdateUserMeRequest {
  name?: string
  email?: string
  password?: string
}

export interface UpdateUserMeResponse {
  id: string
  name?: string
  email?: string
}

export async function updateUserMe(params: UpdateUserMeRequest): Promise<UpdateUserMeResponse> {
  const res = await api.patch<{ success: boolean; data: UpdateUserMeResponse; message: string }>(`${API_BASE}/users/me`, params)
  return res.data.data
}

export async function deleteUserMe(): Promise<void> {
  await api.delete(`${API_BASE}/users/me`)
}
