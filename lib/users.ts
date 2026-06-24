import api from '@/lib/api'

export type UserProfile = {
  id: string
  name: string
  email: string
  profileImageUrl: string | null
  role: 'BUYER' | 'SELLER'
}

export async function getUserMe(): Promise<UserProfile> {
  const res = await api.get<{ success: boolean; data: UserProfile; message: string }>('/api/v1/users/me')
  return res.data.data
}
