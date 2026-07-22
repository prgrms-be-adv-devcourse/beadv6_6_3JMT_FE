import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface WishlistItem {
  wishlistId: string
  productId: string
  addedAt: string
}

export interface AddWishlistResponse {
  wishlistId: string
  productId: string
  createdAt: string
}

export async function checkWishlistExists(productId: string): Promise<boolean> {
  const res = await api.get<{ success: boolean; data: { wished: boolean }; message: string }>(
    `${API_BASE}/wishlists/exists`,
    { params: { productId } },
  )
  return res.data.data?.wished ?? false
}

export async function getWishlists(): Promise<WishlistItem[]> {
  const res = await api.get<{
    success: boolean
    data: WishlistItem[]
    message: string
  }>(`${API_BASE}/wishlists`)
  return res.data.data ?? []
}

export async function addWishlist(productId: string): Promise<AddWishlistResponse> {
  const res = await api.post<{ success: boolean; data: AddWishlistResponse; message: string }>(
    `${API_BASE}/wishlists`,
    { productId },
  )
  return res.data.data
}

export async function removeWishlist(wishlistId: string): Promise<void> {
  await api.delete(`${API_BASE}/wishlists/${wishlistId}`)
}

export async function getWishlistIdForProduct(productId: string): Promise<string | null> {
  const wished = await checkWishlistExists(productId)
  if (!wished) return null
  const items = await getWishlists()
  return items.find((w) => w.productId === productId)?.wishlistId ?? null
}
