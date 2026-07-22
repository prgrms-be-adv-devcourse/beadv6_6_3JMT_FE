import api from '@/lib/auth'
import type {
  CreateOrderProduct,
  CreateOrderResponseData,
  CreateOrderResult,
  OrderListItem,
  OrderListResponse,
} from '@/types/api/orders'
import { API_BASE } from '@/lib/apiBase'
import { buildCreateOrderRequest, mapCreateOrderResponse, mapOrderListResponse } from './orderContracts'

export { buildCreateOrderRequest, mapCreateOrderResponse, mapOrderListResponse } from './orderContracts'

export async function createOrder(products: CreateOrderProduct[]): Promise<CreateOrderResult> {
  const res = await api.post(`${API_BASE}/orders`, buildCreateOrderRequest(products))
  return mapCreateOrderResponse(res.data.data as CreateOrderResponseData)
}

export async function getOrders(): Promise<OrderListItem[]> {
  const res = await api.get(`${API_BASE}/orders`)
  return mapOrderListResponse((res.data.data ?? []) as OrderListResponse[])
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
