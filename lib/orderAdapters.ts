import type { MyOrderItem, ProductInfo } from '../types/api/orders'
import type { ProductByIdsItem } from './products.ts'

type PromptLike = ProductInfo & {
  orderProductId?: string
  priceLabel?: string
  downloaded?: boolean
  isRefundable?: boolean
}

export type PurchasedPrompt = PromptLike & {
  sellerId?: string
}

function normalizeModel(model?: string | null): string {
  return model || 'Prompt'
}

export function isActivePurchasedOrder(order: MyOrderItem): boolean {
  if (order.orderProductStatus) {
    return (
      (order.orderStatus === 'COMPLETED' ||
        order.orderStatus === 'REFUND_REQUESTED' ||
        order.orderStatus === 'PARTIAL_REFUNDED') &&
      order.orderProductStatus === 'PAID'
    )
  }

  return order.orderStatus !== 'REFUNDED' && order.orderStatus !== 'ALL_REFUNDED'
}

export function mapOrderToPrompt(order: MyOrderItem): PromptLike | null {
  if (!isActivePurchasedOrder(order)) return null

  if (order.product) {
    return {
      ...order.product,
      orderId: order.orderId,
      orderProductId: order.orderProductId,
      purchasedAt: order.purchasedAt ?? order.paidAt ?? order.createdAt,
      downloaded: order.downloaded,
      isRefundable: order.isRefundable,
    }
  }

  const productId = order.productId ?? order.orderProductId
  if (!productId || !order.title) return null

  return {
    id: productId,
    orderId: order.orderId,
    orderProductId: order.orderProductId,
    title: order.title,
    productType: order.productType ?? 'PROMPT',
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
    downloaded: order.downloaded,
    isRefundable: order.isRefundable,
  }
}

export function composePurchasedPrompts(
  prompts: PurchasedPrompt[],
  products: ProductByIdsItem[],
  sellerNames: Record<string, string | null>,
): PurchasedPrompt[] {
  const productById = new Map(products.map((product) => [product.productId, product]))

  return prompts.map((prompt) => {
    const product = productById.get(prompt.id)
    if (!product) return prompt

    return {
      ...prompt,
      title: product.title,
      productType: product.productType,
      model: normalizeModel(product.model),
      amount: product.amount,
      rating: product.averageRating,
      salesCount: product.salesCount,
      seller: sellerNames[product.sellerId] ?? prompt.seller,
      sellerId: product.sellerId,
      thumbnail_url: product.thumbnailUrl,
    }
  })
}

export function hasPurchasedProduct(orders: MyOrderItem[], productId: string): boolean {
  return orders.some((order) => {
    if (!isActivePurchasedOrder(order)) return false
    if (order.product?.id === productId) return true
    return order.productId === productId
  })
}
