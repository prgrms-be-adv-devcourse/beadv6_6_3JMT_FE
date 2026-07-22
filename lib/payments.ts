import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import { buildRefundRequest } from '@/lib/refundContracts'

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<{ paymentId: string }> {
  const res = await api.post(`${API_BASE}/payments/confirm`, params)
  return res.data.data as { paymentId: string }
}

export async function requestRefund(params: {
  orderId: string
  orderProductIds: string[]
}): Promise<void> {
  const request = buildRefundRequest(params.orderId, params.orderProductIds)
  await api.post(request.path, request.body)
}
