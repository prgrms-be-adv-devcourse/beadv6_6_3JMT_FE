import api from '@/lib/auth'

export interface AdminUserStats {
  totalUsers: number
  todayNewUsers: number
}

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
  body: { role?: 'buyer' | 'seller' },
): Promise<AdminUser> {
  const res = await api.put<{ success: boolean; data: AdminUser; message: string }>(
    `/api/v1/admin/users/${userId}`,
    body,
  )
  return res.data.data
}

export interface UpdateAdminUserStatusResponse {
  id: string
  status: AdminUser['status']
  updatedAt: string
}

export async function updateAdminUserStatus(
  userId: string,
  status: AdminUser['status'],
): Promise<UpdateAdminUserStatusResponse> {
  const res = await api.patch<{ success: boolean; data: UpdateAdminUserStatusResponse; message: string }>(
    `/api/v1/admin/users/${userId}/status`,
    { status },
  )
  return res.data.data
}

export async function getAdminUserStats(): Promise<AdminUserStats> {
  const res = await api.get<{ success: boolean; data: AdminUserStats; message: string }>(
    '/api/v1/admin/stats/users',
  )
  return res.data.data
}
