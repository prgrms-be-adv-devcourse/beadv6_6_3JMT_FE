import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

// ai-service가 돌려주는 추천 상품. 카드가 그리는 값만 온다.
export type RecommendedProduct = {
  id: string
  title: string
  productType: string | null
  model: string | null
  amount: number
  rating: number
  salesCount: number
  sellerId: string | null
  desc: string | null
  thumbnailUrl: string | null
  tags: string[]
}

// 활동 내역은 서버가 갖고 있지 않아 화면이 실어 보낸다.
// 장바구니는 order-service, 구매는 주문 내역이 원본이고 ai-service는 저장하지 않는다.
export async function getRecommendations(
  cartProductIds: string[],
  purchasedProductIds: string[],
  limit = 4,
): Promise<RecommendedProduct[]> {
  if (cartProductIds.length === 0 && purchasedProductIds.length === 0) return []

  try {
    const res = await api.get(`${API_BASE}/ai/recommendations`, {
      params: { cartProductIds, purchasedProductIds, limit },
      // axios 기본값은 배열을 cartProductIds[]=... 로 보낸다. 서버는 반복 키를 기대한다.
      paramsSerializer: { indexes: null },
    })
    return res.data.data ?? []
  } catch {
    // 추천이 안 되는 것과 상품을 못 사는 것은 다른 문제다. 조용히 비우면 화면이 섹션을 숨긴다.
    return []
  }
}
