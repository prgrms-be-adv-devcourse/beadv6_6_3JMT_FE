'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { getCartItems } from '@/lib/cart';

export default function AuthSync() {
  const { isLoggedIn } = useAuthStore();
  const { setItems } = useWishStore();
  const setCartItems = useCartStore((state) => state.setItems);

  // 앱 마운트 시 토큰 유효성 검증 — 무효 토큰이면 401 인터셉터가 logout() 처리
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get(`${API_BASE}/users/me`).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위시리스트 동기화
  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => setItems([]));
      return;
    }
    api.get(`${API_BASE}/wishlists`)
      .then((res) => {
        const items: { productId: string; product: { id: string; title: string; amount: number; thumbnail_url?: string | null } | null }[] =
          res.data.data ?? [];
        setItems(
          items
            .filter((w) => w.product)
            .map((w) => ({
              id: String(w.product!.id),
              title: w.product!.title,
              amount: w.product!.amount,
              thumbnailUrl: w.product!.thumbnail_url ?? null,
            }))
        );
      })
      .catch(() => {});
  }, [isLoggedIn, setItems]);

  // 장바구니 동기화
  useEffect(() => {
    if (!isLoggedIn) {
      Promise.resolve().then(() => setCartItems([]));
      return;
    }

    getCartItems()
      .then(setCartItems)
      .catch(() => {});
  }, [isLoggedIn, setCartItems]);


  return null;
}
