'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import api from '@/lib/api';

export default function AuthSync() {
  const { isLoggedIn } = useAuthStore();
  const { setItems } = useWishStore();

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    api.get('/api/v1/users/me/wishlist')
      .then((res) => {
        const products: { id: number; title: string; amount: number; thumbnail_url?: string | null }[] =
          res.data.data ?? [];
        setItems(
          products.map((p) => ({
            id: String(p.id),
            title: p.title,
            amount: p.amount,
            thumbnailUrl: p.thumbnail_url ?? null,
          }))
        );
      })
      .catch(() => {});
  }, [isLoggedIn, setItems]);

  return null;
}
