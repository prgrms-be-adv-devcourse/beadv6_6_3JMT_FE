import api from '@/lib/auth'
import type { PaginationMeta, PaymentHistoryItem } from '@/types/api/orders'
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

export async function getPaymentHistory(
  page = 1,
  size = 20,
): Promise<{ data: PaymentHistoryItem[]; meta: PaginationMeta }> {
  const res = await api.get(`${API_BASE}/payments`, { params: { page, size } })
  return { data: res.data.data ?? [], meta: res.data.meta }
}

export async function requestRefund(params: {
  paymentId: string
  orderProductIds: string[]
}): Promise<void> {
  const request = buildRefundRequest(params.paymentId, params.orderProductIds)
  await api.post(request.path, request.body)
}
