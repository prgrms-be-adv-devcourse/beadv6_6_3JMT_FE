import api from '@/lib/auth'
import { CartItem, mapCartResponseToItems } from '@/lib/cartAdapters'
import axios from 'axios'
import { API_BASE } from '@/lib/apiBase'
import { hasHttpStatus } from '@/lib/httpContracts'

export async function getCartItems(): Promise<CartItem[]> {
  try {
    const res = await api.get(`${API_BASE}/cart`)
    return mapCartResponseToItems(res.data.data)
  } catch (error) {
    if (hasHttpStatus(error, 404)) return []
    throw error
  }
}

export async function addCartItem(productId: string): Promise<CartItem | null> {
  try {
    const res = await api.post(`${API_BASE}/cart`, { productId })
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
  await api.delete(`${API_BASE}/cart/${cartProductId}`)
}
