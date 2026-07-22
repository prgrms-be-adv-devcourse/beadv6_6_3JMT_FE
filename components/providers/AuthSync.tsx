'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { getUserMe } from '@/lib/users';
import { getWishlists } from '@/lib/wishlists';
import { toSyncedWishItems } from '@/lib/wishlistComposition';

export default function AuthSync() {
  const pathname = usePathname();
  const { isLoggedIn, user, token, login } = useAuthStore();
  const { setItems } = useWishStore();

  const isFullscreen = pathname.startsWith('/admin') || pathname.startsWith('/reader');

  // 앱 마운트 시 토큰 유효성 검증 겸 프로필 이미지 동기화 — 무효 토큰이면 401 인터셉터가 logout() 처리
  useEffect(() => {
    if (!isLoggedIn || !user || !token) return;
    getUserMe()
      .then((profile) => {
        if (profile.profileImageUrl !== user.profileImageUrl) {
          login({ ...user, profileImageUrl: profile.profileImageUrl }, token);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 위시리스트 동기화
  useEffect(() => {
    if (!isLoggedIn || isFullscreen) {
      if (!isLoggedIn) Promise.resolve().then(() => setItems([]));
      return;
    }
    getWishlists()
      .then((items) => setItems(toSyncedWishItems(items)))
      .catch(() => {});
  }, [isLoggedIn, isFullscreen, setItems]);

  return null;
}
