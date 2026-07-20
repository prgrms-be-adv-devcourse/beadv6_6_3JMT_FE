import type { AdminOrder } from '../types/api/orders'

export function formatAdminOrderSellers(
  order: Pick<AdminOrder, 'sellerCount' | 'sellers'>,
): string {
  const first = order.sellers[0]?.sellerNickname
  if (!first) return '판매자 정보 없음'
  return order.sellerCount > 1 ? `${first} 외 ${order.sellerCount - 1}명` : first
}
