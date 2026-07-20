import type { OrderListItem, PaymentHistoryItem, PaymentItem } from '../types/api/orders'

type PaymentOrderFields = Pick<
  OrderListItem,
  'orderId' | 'orderProductId' | 'title' | 'downloaded' | 'isRefundable'
>

export function mapPaymentHistory(
  payments: PaymentHistoryItem[],
  orders: PaymentOrderFields[],
): PaymentItem[] {
  return payments.map((payment) => {
    const products = orders.filter((order) => order.orderId === payment.orderId)
    const firstTitle = products[0]?.title ?? '주문 상품'

    return {
      ...payment,
      title: products.length > 1 ? `${firstTitle} 외 ${products.length - 1}건` : firstTitle,
      orderProductIds: products.map((product) => product.orderProductId),
      downloaded: products.some((product) => product.downloaded),
      isRefundable:
        payment.paymentStatus === 'PAID' &&
        products.length > 0 &&
        products.every((product) => product.isRefundable),
    }
  })
}
