import api from '@/lib/auth'

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller'
  status: 'active' | 'suspended' | 'withdrawn'
}

export interface GetAdminUsersParams {
  page?: number
  size?: number
  status?: 'active' | 'suspended' | 'withdrawn' | 'ALL'
  role?: 'buyer' | 'seller' | 'ALL'
  keyword?: string
}

export interface GetAdminUsersResponse {
  data: AdminUser[]
  meta: {
    page: number
    size: number
    total: number
    hasNext: boolean
  }
}

export async function getAdminUsers(params?: GetAdminUsersParams): Promise<GetAdminUsersResponse> {
  const res = await api.get<{ success: boolean; data: AdminUser[]; message: string; meta: GetAdminUsersResponse['meta'] }>(
    '/api/v1/admin/users',
    { params },
  )
  return { data: res.data.data, meta: res.data.meta }
}

export async function updateAdminUser(
  userId: string,
  body: { role?: 'buyer' | 'seller'; status?: 'active' | 'suspended' | 'withdrawn' },
): Promise<AdminUser> {
  const res = await api.put<{ success: boolean; data: AdminUser; message: string }>(
    `/api/v1/admin/users/${userId}`,
    body,
  )
  return res.data.data
}
