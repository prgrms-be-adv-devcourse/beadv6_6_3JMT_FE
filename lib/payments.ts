import api from '@/lib/auth'

type CreateOrderSingle = { productId: string }
type CreateOrderCart = { productIds: string[] }
type CreateOrderParams = CreateOrderSingle | CreateOrderCart

export async function createOrder(params: CreateOrderParams): Promise<{ orderId: string }> {
  const res = await api.post('/api/v1/orders', params)
  return res.data.data as { orderId: string }
}

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  _productIds?: string[] // MSW 전용: SW 재시작 시 MOCK_ORDERS 복원용. 실제 백엔드는 무시함
}): Promise<{ paymentId: string }> {
  const res = await api.post('/api/v1/payments/confirm', params)
  return res.data.data as { paymentId: string }
}

export type PaymentStatus = 'PAID' | 'REFUNDING' | 'REFUNDED'

export interface PaymentItem {
  orderId: string
  orderProductId: string
  paymentId: string
  paymentStatus: PaymentStatus
  isRefund: boolean
  productType: string
  title: string
  amount: number
  paidAt: string
}

export interface PaymentMeta {
  page: number
  size: number
  total: number
  hasNext: boolean
}

export async function getPayments(
  page = 1,
  size = 20,
): Promise<{ data: PaymentItem[]; meta: PaymentMeta }> {
  const res = await api.get('/api/v1/orders/payments', { params: { page, size } })
  return { data: res.data.data, meta: res.data.meta }
}

export async function requestRefund(paymentId: string): Promise<void> {
  await api.post(`/api/v1/payments/${paymentId}/refund`)
}
