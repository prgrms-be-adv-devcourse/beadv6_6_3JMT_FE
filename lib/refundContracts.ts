import { API_BASE } from './apiBase.ts'

export function buildRefundRequest(orderId: string, orderProductIds: string[]) {
  return {
    path: `${API_BASE}/orders/${encodeURIComponent(orderId)}/refund`,
    body: { orderProductIds },
  }
}
