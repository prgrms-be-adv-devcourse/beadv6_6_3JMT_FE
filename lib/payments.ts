import api from '@/lib/auth'
import { PaymentItem, PaginationMeta } from '@/types/api/orders'

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  _productIds?: string[] // MSW 전용: SW 재시작 시 MOCK_ORDERS 복원용. 실제 백엔드는 무시함
}): Promise<{ paymentId: string }> {
  const res = await api.post('/api/v1/payments/confirm', params)
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
  await api.post(`/api/v1/payments/${paymentId}/refund`)
}
