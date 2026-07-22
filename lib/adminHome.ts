import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import {
  mapAdminHome,
  type AdminHomeResponseData,
  type AdminHomeViewModel,
} from '@/lib/adminHomeAdapters'

export async function getAdminHome(): Promise<AdminHomeViewModel> {
  const response = await api.get<{
    success: boolean
    data: AdminHomeResponseData
    message: string
  }>(`${API_BASE}/admin/home`)

  return mapAdminHome(response.data.data)
}
