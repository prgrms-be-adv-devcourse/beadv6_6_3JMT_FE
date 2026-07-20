import api from '@/lib/auth'
import { CartItem, mapCartResponseToItems } from '@/lib/cartAdapters'
import axios from 'axios'
import { API_BASE } from '@/lib/apiBase'

export async function getCartItems(): Promise<CartItem[]> {
  const res = await api.get(`${API_BASE}/cart/products`)
  return mapCartResponseToItems(res.data.data)
}

export async function addCartItem(productId: string): Promise<CartItem | null> {
  try {
    const res = await api.post(`${API_BASE}/cart/products`, { productId })
    return mapCartResponseToItems([res.data.data])[0] ?? null
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const items = await getCartItems()
      return items.find((item) => item.productId === productId) ?? null
    }

    throw error
  }
}

export async function removeCartItem(cartProductId: string): Promise<void> {
  await api.delete(`${API_BASE}/cart/products/${cartProductId}`)
}
