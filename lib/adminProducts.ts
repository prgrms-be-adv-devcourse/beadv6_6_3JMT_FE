import api from '@/lib/auth'

export interface AdminProduct {
  id: string
  title: string
  seller: string
  model: string
  icon: string
  status?: string
}

export interface GetAdminProductsParams {
  page?: number
  size?: number
  status?: string
}

export async function getAdminProducts(params?: GetAdminProductsParams): Promise<AdminProduct[]> {
  const res = await api.get<{ success: boolean; data: AdminProduct[]; message: string }>(
    '/api/v1/admin/products',
    { params },
  )
  return res.data.data
}
