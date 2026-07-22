import { create } from 'zustand';

interface LineItem {
  id: string;
  productId: string;
  cartProductId: string;
  title: string;
  amount: number;
  thumbnailUrl: string | null;
  sellerId?: string;
}

interface DirectBuyState {
  item: LineItem | null;
  setItem: (item: LineItem | null) => void;
}

export const useDirectBuyStore = create<DirectBuyState>((set) => ({
  item: null,
  setItem: (item) => set({ item }),
}));
