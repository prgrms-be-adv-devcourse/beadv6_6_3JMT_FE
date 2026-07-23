import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface AdminUserStats {
  totalUsers: number
  todayNewUsers: number
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  status: 'active' | 'suspended' | 'withdrawn'
}

export interface GetAdminUsersParams {
  page?: number
  size?: number
  status?: 'active' | 'suspended' | 'withdrawn' | 'ALL'
  role?: 'buyer' | 'seller' | 'admin' | 'ALL'
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
    `${API_BASE}/admin/users`,
    { params },
  )
  return { data: res.data.data, meta: res.data.meta }
}

export interface UpdateAdminUserRoleResponse {
  id: string
  role: AdminUser['role']
  updatedAt: string
}

export async function updateAdminUserRole(
  userId: string,
  role: 'buyer' | 'seller',
): Promise<UpdateAdminUserRoleResponse> {
  const res = await api.patch<{ success: boolean; data: UpdateAdminUserRoleResponse; message: string }>(
    `${API_BASE}/admin/users/${userId}/role`,
    { role },
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
    `${API_BASE}/admin/users/${userId}/status`,
    { status },
  )
  return res.data.data
}

export async function getAdminUserStats(): Promise<AdminUserStats> {
  const res = await api.get<{ success: boolean; data: AdminUserStats; message: string }>(
    `${API_BASE}/admin/stats/users`,
  )
  return res.data.data
}
