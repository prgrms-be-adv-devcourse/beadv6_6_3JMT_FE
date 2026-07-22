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
  const { isLoggedIn, _hasHydrated } = useAuthStore();
  const { setItems } = useWishStore();

  const isFullscreen = pathname.startsWith('/admin');

  // 토큰 유효성 검증 겸 프로필 이미지 동기화 — persist 복원(hydrate) 후에 실행해야 user가 채워져 있음
  useEffect(() => {
    if (!_hasHydrated || !isLoggedIn) return;
    const { user, token, login } = useAuthStore.getState();
    if (!user || !token) return;
    getUserMe()
      .then((profile) => {
        if (profile.profileImageUrl !== user.profileImageUrl) {
          login({ ...user, profileImageUrl: profile.profileImageUrl }, token);
        }
      })
      .catch(() => {});
  }, [isLoggedIn, _hasHydrated]);

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
