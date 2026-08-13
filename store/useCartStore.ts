import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  productId: string
  cartProductId: string
  title: string
  amount: number
  thumbnailUrl: string | null
  sellerId?: string
  addedAt?: string
}

interface CartState {
  items: CartItem[]
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  upsertItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items) => set({ items }),
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state
          return { items: [...state.items, item] }
        }),
      upsertItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId)
          if (!exists) return { items: [...state.items, item] }
          return {
            items: state.items.map((i) => (i.productId === item.productId ? item : i)),
          }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.cartProductId !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'cart' }
  )
)
