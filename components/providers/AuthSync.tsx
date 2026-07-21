'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';

export default function AuthSync() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuthStore();
  const { setItems } = useWishStore();

  const isFullscreen = pathname.startsWith('/admin') || pathname.startsWith('/reader');

  // 앱 마운트 시 토큰 유효성 검증 — 무효 토큰이면 401 인터셉터가 logout() 처리
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get(`${API_BASE}/users/me`).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위시리스트 동기화
  useEffect(() => {
    if (!isLoggedIn || isFullscreen) {
      if (!isLoggedIn) Promise.resolve().then(() => setItems([]));
      return;
    }
    api.get(`${API_BASE}/wishlists`)
      .then((res) => {
        const items: { wishlistId: string; productId: string; title: string; price: number; thumbnailUrl: string | null }[] =
          res.data.data ?? [];
        setItems(
          items.map((w) => ({
            id: String(w.productId),
            title: w.title,
            amount: w.price,
            thumbnailUrl: w.thumbnailUrl ?? null,
            wishlistId: w.wishlistId,
          }))
        );
      })
      .catch(() => {});
  }, [isLoggedIn, isFullscreen, setItems]);

  return null;
}
