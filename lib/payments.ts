import api from '@/lib/auth'

type CreateOrderSingle = { productId: string }
type CreateOrderCart = { productIds: string[] }
type CreateOrderParams = CreateOrderSingle | CreateOrderCart

export async function createOrder(params: CreateOrderParams): Promise<{ orderId: string }> {
  const res = await api.post('/api/v1/orders', params)
  return res.data.data as { orderId: string }
}

// TODO: 임시 로컬 테스트용 — 실제 배포 시 제거
// Next.js 프록시(/payment-proxy)를 통해 MSW 우회 및 CORS 해결
const PAYMENT_PROXY = '/payment-proxy'
const TEST_USER_ID = '770e8400-e29b-41d4-a716-446655440002'

function paymentTestHeaders() {
  return {
    'X-User-Id': TEST_USER_ID,
    'X-User-Role': 'BUYER',
    'X-Request-Id': crypto.randomUUID(),
  }
}

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
  _productIds?: string[] // MSW 전용: SW 재시작 시 MOCK_ORDERS 복원용. 실제 백엔드는 무시함
}): Promise<{ paymentId: string }> {
  const res = await api.post(`${PAYMENT_PROXY}/api/v1/payments/confirm`, params, {
    headers: paymentTestHeaders(),
  })
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

// TODO: 임시 로컬 테스트용 — 실제 배포 시 제거
export async function requestRefund(paymentId: string): Promise<void> {
  await api.post(`${PAYMENT_PROXY}/api/v1/payments/${paymentId}/refund`, null, {
    headers: paymentTestHeaders(),
  })
}
