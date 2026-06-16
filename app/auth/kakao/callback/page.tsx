'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

function LoadingUI() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--ph-bg)',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'var(--ph-primary)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles style={{ width: 26, height: 26 }} />
      </span>
      <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: 0 }}>
        카카오 로그인 처리 중...
      </p>
    </div>
  );
}

function KakaoCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');

    if (!code) {
      router.replace('/');
      return;
    }

    api
      .post<{ data: { user: { id: string; name: string; email: string; role: 'buyer' | 'seller' }; token: string } }>(
        '/api/v1/auth/oauth/kakao',
        { code },
      )
      .then((res) => {
        const { user, token } = res.data.data;
        login(user, token);
        router.replace('/');
      })
      .catch(() => {
        router.replace('/');
      });
  }, [searchParams, login, router]);

  return <LoadingUI />;
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <KakaoCallbackContent />
    </Suspense>
  );
}
