import api from '@/lib/auth'
import { CreateOrderResult } from '@/types/api/orders'
import { API_BASE } from '@/lib/apiBase'

type CreateOrderSingle = { productId: string }
type CreateOrderCart = { productIds: string[] }
type CreateOrderParams = CreateOrderSingle | CreateOrderCart

function normalizeCreateOrderParams(params: CreateOrderParams): CreateOrderCart {
  if ('productId' in params) {
    return { productIds: [params.productId] }
  }

  return { productIds: params.productIds }
}

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const res = await api.post(`${API_BASE}/orders`, normalizeCreateOrderParams(params))
  return res.data.data as CreateOrderResult
}

export async function downloadOrderProduct(orderId: string, orderProductId: string) {
  return api.patch(`${API_BASE}/orders/${orderId}/products/${orderProductId}/download`)
}

export type OrderContent = {
  orderId: string
  orderProductId: string
  orderNumber: string
  productId: string
  downloaded: boolean
  productTitle: string
  content: string
}

/**
 * 구매 콘텐츠 조회. content 는 상품 유형별 산출물이다:
 * PROMPT=본문 텍스트 / PPT·EXCEL=파일 presigned 다운로드 URL / NOTION=외부 링크.
 */
export async function getOrderContent(orderId: string, orderProductId: string): Promise<OrderContent> {
  const res = await api.get(`${API_BASE}/orders/${orderId}/content/${orderProductId}`)
  return res.data.data as OrderContent
}
