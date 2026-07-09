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
