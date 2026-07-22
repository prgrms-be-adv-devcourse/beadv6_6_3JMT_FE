import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import {
  mapAdminProducts,
  type AdminProduct,
  type AdminProductResponse,
} from '@/lib/adminProductAdapters'

export type { AdminProduct } from '@/lib/adminProductAdapters'

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const res = await api.get<{ success: boolean; data: AdminProductResponse[]; message: string }>(
    `${API_BASE}/admin/products`,
  )
  return mapAdminProducts(res.data.data)
}
