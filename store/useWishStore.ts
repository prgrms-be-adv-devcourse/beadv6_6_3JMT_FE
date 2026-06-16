import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishItem {
  id: string
  title: string
  price: number
  thumbnailUrl: string | null
}

interface WishState {
  items: WishItem[]
  addItem: (item: WishItem) => void
  removeItem: (id: string) => void
  toggle: (item: WishItem) => void
}

export const useWishStore = create<WishState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.id === item.id)) return state
          return { items: [...state.items, item] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      toggle: (item) =>
        set((state) =>
          state.items.some((i) => i.id === item.id)
            ? { items: state.items.filter((i) => i.id !== item.id) }
            : { items: [...state.items, item] }
        ),
    }),
    { name: 'wish' }
  )
)
