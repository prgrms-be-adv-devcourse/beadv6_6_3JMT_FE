import { API_BASE } from './apiBase.ts'

export function buildRefundRequest(paymentId: string, orderProductIds: string[]) {
  return {
    path: `${API_BASE}/orders/refunds`,
    body: { paymentId, orderProductIds },
  }
}
