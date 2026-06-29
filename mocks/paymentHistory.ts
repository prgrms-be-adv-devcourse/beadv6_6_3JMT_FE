import type { MockPaymentHistoryItem, PaymentItem } from './data/users.ts'
import { PRODUCTS } from './data/products.ts'

export function mapMockPaymentToHistoryItem(payment: PaymentItem): MockPaymentHistoryItem {
  const firstProduct = PRODUCTS.find((product) => product.id === payment.productIds[0])
  const title = firstProduct
    ? payment.productIds.length > 1
      ? `${firstProduct.title} 외 ${payment.productIds.length - 1}건`
      : firstProduct.title
    : payment.productIds.length > 1
      ? `결제 상품 외 ${payment.productIds.length - 1}건`
      : '결제 상품'

  return {
    orderId: payment.orderId,
    paymentId: payment.paymentId,
    paymentStatus: payment.status === 'paid' ? 'PAID' : 'REFUNDED',
    isRefundable: payment.status === 'paid',
    productType: firstProduct?.productType ?? 'PROMPT',
    title,
    amount: payment.totalAmount,
    paidAt: payment.paidAt,
  }
}
