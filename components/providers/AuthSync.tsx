'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import api from '@/lib/api';

export default function AuthSync() {
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuthStore();
  const { setItems } = useWishStore();

  // 위시리스트 동기화
  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      return;
    }
    api.get('/api/v1/wishlists')
      .then((res) => {
        const items: { productId: number; product: { id: number; title: string; amount: number; thumbnail_url?: string | null } | null }[] =
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

  // admin 계정이 비-admin 페이지에 있으면 자동 로그아웃.
  // prevId 값으로 세 가지 상황을 구분한다:
  //   undefined → 첫 렌더(persist 복원 포함) → logout 실행 (이미 admin으로 복원된 경우 처리)
  //   null      → 직전에 비로그인 상태 (= 이번 세션에서 방금 로그인한 경우) → logout 안 함
  //   string    → 직전에 로그인된 상태 (= 이미 로그인된 채로 페이지 이동) → logout 실행
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = user?.id ?? null;

    const isAdminOnNonAdminPage = user?.role === 'admin' && !pathname.startsWith('/admin');
    if (!isAdminOnNonAdminPage) return;

    // prevId === null: 비로그인 상태에서 admin으로 로그인한 직후 → 로그아웃 안 함
    if (prevId !== null) logout();
  }, [user, pathname, logout]);

  return null;
}
