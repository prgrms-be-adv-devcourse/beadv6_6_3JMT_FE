import api from '@/lib/auth'
import { PaymentItem, PaginationMeta } from '@/types/api/orders'

// Next.js 프록시(/payment-proxy)를 통해 MSW 우회 및 CORS 해결.
// 게이트웨이(8080)가 Authorization 헤더의 JWT를 검증하고 X-User-Id 등을 내부적으로 추가한다.
const PAYMENT_PROXY = '/payment-proxy'

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  _productIds?: string[] // MSW 전용: SW 재시작 시 MOCK_ORDERS 복원용. 실제 백엔드는 무시함
}): Promise<{ paymentId: string }> {
  const res = await api.post(`${PAYMENT_PROXY}/api/v1/payments/confirm`, params)
  return res.data.data as { paymentId: string }
}

export async function getPayments(
  page = 1,
  size = 20,
): Promise<{ data: PaymentItem[]; meta: PaginationMeta }> {
  const res = await api.get('/api/v1/orders/payments', { params: { page, size } })
  return { data: res.data.data, meta: res.data.meta }
}

export async function requestRefund(paymentId: string): Promise<void> {
  await api.post(`${PAYMENT_PROXY}/api/v1/payments/${paymentId}/refund`, null)
}
