import api from '@/lib/auth'
import { normalizeCreateOrderParams } from '@/lib/hybridApi'
import { CreateOrderResult } from '@/types/api/orders'

type CreateOrderSingle = { productId: string }
type CreateOrderCart = { productIds: string[] }
type CreateOrderParams = CreateOrderSingle | CreateOrderCart

export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const res = await api.post('/api/v1/orders', normalizeCreateOrderParams(params))
  return res.data.data as CreateOrderResult
}

export async function downloadOrderProduct(orderId: string, orderProductId: string) {
  return api.patch(`/api/v1/orders/${orderId}/products/${orderProductId}/download`)
}
