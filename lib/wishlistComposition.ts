import type { ProductByIdsItem } from './products.ts'
import type { WishlistItem } from './wishlists.ts'

export interface WishlistCard {
  id: string
  title: string
  thumbnail_url: string | null
  amount: number
  seller: string
  rating: number
  salesCount: number
  productType: string
  icon: string
  model: string
  desc: string
}

export interface SyncedWishItem {
  id: string
  wishlistId: string
}

export function composeWishlistCards(
  wishlists: WishlistItem[],
  products: ProductByIdsItem[],
  sellerNames: Record<string, string | null>,
): WishlistCard[] {
  const productMap = new Map(products.map((product) => [product.productId, product]))

  return wishlists.flatMap((wishlist) => {
    const product = productMap.get(wishlist.productId)
    if (!product) return []

    return [{
      id: product.productId,
      title: product.title,
      thumbnail_url: product.thumbnailUrl,
      amount: product.amount,
      seller: sellerNames[product.sellerId] ?? '탈퇴한 판매자',
      rating: product.averageRating,
      salesCount: product.salesCount,
      productType: product.productType,
      icon: '',
      model: product.model,
      desc: '',
    }]
  })
}

export function toSyncedWishItems(wishlists: WishlistItem[]): SyncedWishItem[] {
  return wishlists.map((wishlist) => ({
    id: wishlist.productId,
    wishlistId: wishlist.wishlistId,
  }))
}
