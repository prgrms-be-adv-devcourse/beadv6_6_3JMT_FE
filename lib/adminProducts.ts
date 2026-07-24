import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface AdminProductListItem {
  productId: string
  title: string
  sellerNickname: string | null
  productType: string
  model?: string
  amount: number
  status: string
  createdAt: string
}

export type AdminProductStatusParam = 'pending_review' | 'on_sale' | 'rejected' | 'ALL'

export interface GetAdminProductsParams {
  status: AdminProductStatusParam
  keyword?: string
  page: number
  size: number
}

export interface GetAdminProductsResponse {
  data: AdminProductListItem[]
  meta: {
    page: number
    size: number
    total: number
    hasNext: boolean
  }
}

export async function getAdminProducts(params: GetAdminProductsParams): Promise<GetAdminProductsResponse> {
  const res = await api.get<{ success: boolean; data: AdminProductListItem[]; message: string; meta: GetAdminProductsResponse['meta'] }>(
    `${API_BASE}/admin/products`,
    { params },
  )
  return { data: res.data.data, meta: res.data.meta }
}

export async function revertAdminProduct(productId: string): Promise<void> {
  await api.patch(`${API_BASE}/admin/products/${productId}/revert`, {})
}
