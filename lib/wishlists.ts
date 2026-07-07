import api from '@/lib/auth'

export interface WishlistItem {
  wishlistId: string
  productId: string
  title: string
  thumbnailUrl: string | null
  price: number
  sellerNickname: string
  averageRating: number
  salesCount: number
  model: string
  addedAt: string
}

export interface AddWishlistResponse {
  wishlistId: string
  productId: string
  createdAt: string
}

export async function checkWishlistExists(productId: string): Promise<boolean> {
  const res = await api.get<{ success: boolean; data: { wished: boolean }; message: string }>(
    '/api/v1/wishlists/exists',
    { params: { productId } },
  )
  return res.data.data?.wished ?? false
}

export async function getWishlists<T = WishlistItem>(): Promise<T[]> {
  const res = await api.get<{ success: boolean; data: T[]; message: string }>('/api/v1/wishlists')
  return res.data.data ?? []
}

export async function addWishlist(productId: string): Promise<AddWishlistResponse> {
  const res = await api.post<{ success: boolean; data: AddWishlistResponse; message: string }>(
    '/api/v1/wishlists',
    { productId },
  )
  return res.data.data
}

export async function removeWishlist(wishlistId: string): Promise<void> {
  await api.delete(`/api/v1/wishlists/${wishlistId}`)
}

export async function getWishlistIdForProduct(productId: string): Promise<string | null> {
  const wished = await checkWishlistExists(productId)
  if (!wished) return null
  const items = await getWishlists()
  return items.find((w) => w.productId === productId)?.wishlistId ?? null
}
