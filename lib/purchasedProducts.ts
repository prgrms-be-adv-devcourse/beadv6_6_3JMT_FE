import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface PurchasedProductDetail {
  productId: string
  title: string
  productType: string
  model: string | null
  content: string | null
  fileUrl: string | null
  externalUrl: string | null
  thumbnailUrl: string | null
  sellerId: string
  averageRating: number
  myRating: number | null
}

// GET /api/v2/products/{productId}/orders — 구매한 상품 reader 데이터 조회 (#550)
export async function getPurchasedProduct(productId: string): Promise<PurchasedProductDetail> {
  const res = await api.get<{ success: boolean; data: PurchasedProductDetail; message: string }>(
    `${API_BASE}/products/${productId}/orders`,
  )
  return res.data.data
}

export {
  resolveDeliverable,
  type Deliverable,
} from './purchasedProductDeliverable.ts'
