import api from '@/lib/auth'
import { PaymentItem, PaginationMeta } from '@/types/api/orders'
import { API_BASE } from '@/lib/apiBase'

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
}): Promise<{ paymentId: string }> {
  const res = await api.post(`${API_BASE}/payments/confirm`, params)
  return res.data.data as { paymentId: string }
}

export async function getPayments(
  page = 1,
  size = 20,
): Promise<{ data: PaymentItem[]; meta: PaginationMeta }> {
  const res = await api.get(`${API_BASE}/orders/payments`, { params: { page, size } })
  return { data: res.data.data, meta: res.data.meta }
}

export async function requestRefund(paymentId: string): Promise<void> {
  await api.post(`${API_BASE}/payments/${paymentId}/refund`, null)
}
