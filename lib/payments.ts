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
