import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import { splitUniqueIds } from '@/lib/batchIds'

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

export interface SellerProductSummary {
  productCount: number
  salesCount: number
}

export async function getProductsByIds(productIds: string[]): Promise<ProductByIdsItem[]> {
  const chunks = splitUniqueIds(productIds)
  if (chunks.length === 0) return []

  const responses = await Promise.all(
    chunks.map((productIdsChunk) =>
      api.post<{ success: boolean; data: ProductByIdsItem[]; message: string }>(
        `${API_BASE}/products/wishlists`,
        { productIds: productIdsChunk },
      ),
    ),
  )

  return responses.flatMap((res) => res.data.data ?? [])
}

// POST /api/v2/products/orders — 마이페이지 구매한 프롬프트 카드용 상품 배치 조회
export async function getProductsForOrders(productIds: string[]): Promise<ProductByIdsItem[]> {
  const chunks = splitUniqueIds(productIds)
  if (chunks.length === 0) return []

  const responses = await Promise.all(
    chunks.map((productIdsChunk) =>
      api.post<{ success: boolean; data: ProductByIdsItem[]; message: string }>(
        `${API_BASE}/products/orders`,
        { productIds: productIdsChunk },
      ),
    ),
  )

  return responses.flatMap((res) => res.data.data ?? [])
}

// GET /api/v2/products/suggest — 검색창 자동완성용 상품명 제안 (최대 5건, 판매량 순)
//
// BE는 실패해도 예외 대신 빈 목록을 준다. FE도 같은 태도를 유지한다 — 자동완성은
// 드롭다운이 안 뜰 뿐 검색 자체를 막지 않으므로, 실패를 호출부로 던지지 않는다.
export async function getProductSuggestions(q: string, signal?: AbortSignal): Promise<string[]> {
  const keyword = q.trim()
  if (!keyword) return []

  try {
    const res = await api.get<{ success: boolean; data?: string[]; message: string }>(
      `${API_BASE}/products/suggest`,
      { params: { q: keyword }, signal },
    )
    return res.data.data ?? []
  } catch {
    return []
  }
}

// GET /api/v2/products/sellers/me/summary — 판매자의 등록 상품 수·누적 판매 수
export async function getSellerProductSummary(): Promise<SellerProductSummary> {
  const res = await api.get<{
    success: boolean
    data?: Partial<SellerProductSummary>
    message: string
  }>(`${API_BASE}/products/sellers/me/summary`)
  const data = res.data.data ?? {}
  return {
    productCount: Number(data.productCount ?? 0),
    salesCount: Number(data.salesCount ?? 0),
  }
}
