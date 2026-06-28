import type { MyOrderItem, ProductInfo } from '../types/api/orders'

type PromptLike = ProductInfo & {
  orderProductId?: string
  priceLabel?: string
}

function normalizeCategory(productType?: string): string {
  return productType ? productType.toLowerCase() : 'prompt'
}

function normalizeModel(model?: string | null): string {
  return model || 'Prompt'
}

export function isActivePurchasedOrder(order: MyOrderItem): boolean {
  return order.isRefund === false
}

export function mapOrderToPrompt(order: MyOrderItem): PromptLike | null {
  if (!isActivePurchasedOrder(order)) return null

  if (order.product) {
    return {
      ...order.product,
      orderId: order.orderId,
      orderProductId: order.orderProductId,
      purchasedAt: order.purchasedAt ?? order.paidAt ?? order.createdAt,
    }
  }

  const productId = order.productId ?? order.orderProductId
  if (!productId || !order.title) return null

  return {
    id: productId,
    orderId: order.orderId,
    orderProductId: order.orderProductId,
    title: order.title,
    category: normalizeCategory(order.productType),
    icon: 'sparkles',
    model: normalizeModel(order.model),
    amount: 0,
    rating: order.rating ?? '-',
    salesCount: 0,
    seller: 'PromptHub',
    badge: order.orderStatus,
    desc: '',
    thumbnail_url: null,
    purchasedAt: order.paidAt ?? order.createdAt ?? order.purchasedAt,
    priceLabel: '구매 완료',
  }
}

export function hasPurchasedProduct(orders: MyOrderItem[], productId: string): boolean {
  return orders.some((order) => {
    if (!isActivePurchasedOrder(order)) return false
    if (order.product?.id === productId) return true
    return order.productId === productId
  })
}
