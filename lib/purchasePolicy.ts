type SellerOwnedItem = {
  sellerId?: string
}

export const SELF_PURCHASE_MESSAGE = '본인 상품은 구매할 수 없어요'

export function isSelfPurchase(
  userId: string | null | undefined,
  sellerId: string | null | undefined,
): boolean {
  return Boolean(userId && sellerId && userId === sellerId)
}

export function hasSelfPurchaseItem(
  userId: string | null | undefined,
  items: SellerOwnedItem[],
): boolean {
  return items.some((item) => isSelfPurchase(userId, item.sellerId))
}
