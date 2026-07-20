import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface ProductByIdsItem {
  productId: string
  sellerId: string
  title: string
  amount: number
  thumbnailUrl: string | null
  productType: string
  model: string
  salesCount: number
  averageRating: number
  status: string
}

const PRODUCT_BATCH_MAX = 30

export async function getProductsByIds(productIds: string[]): Promise<ProductByIdsItem[]> {
  const unique = Array.from(new Set(productIds))
  if (unique.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += PRODUCT_BATCH_MAX) {
    chunks.push(unique.slice(i, i + PRODUCT_BATCH_MAX))
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      api.get<{ success: boolean; data: ProductByIdsItem[]; message: string }>(
        `${API_BASE}/products/by-ids`,
        { params: { ids: chunk.join(',') } },
      ),
    ),
  )

  return responses.flatMap((res) => res.data.data ?? [])
}
