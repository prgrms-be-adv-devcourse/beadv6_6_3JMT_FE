'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { kakaoLogin } from '@/lib/oauth';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/store/useToastStore';

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
  const showToast = useToast();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const error = searchParams.get('error');
    if (error) {
      if (error === 'access_denied') {
        showToast('카카오 로그인을 취소했습니다.');
      } else {
        showToast(searchParams.get('error_description') ?? '카카오 로그인에 실패했습니다.');
      }
      router.replace('/');
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      showToast('인증 코드가 없습니다. 다시 시도해주세요.');
      router.replace('/');
      return;
    }

    const state = searchParams.get('state');
    const isAdminFlow = state === 'admin';

    const getKakaoPayload = async () => {
      const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
          redirect_uri: `${window.location.origin}/auth/kakao/callback`,
          code,
        }),
      });
      const { access_token } = await tokenRes.json();

      return { accessToken: access_token };
    };

    getKakaoPayload()
      .then((payload) => kakaoLogin(payload))
      .then(({ user, accessToken, refreshToken }) => {
        const roles = user.roles.map((r: string) => r.toLowerCase());

        if (isAdminFlow && !roles.includes('admin')) {
          showToast('관리자 계정이 아닙니다.');
          router.replace('/admin/login');
          return;
        }

        login({ ...user, roles, provider: 'kakao' }, accessToken, refreshToken);
        router.replace(isAdminFlow ? '/admin' : '/');
      })
      .catch((err: unknown) => {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        showToast(message ?? '카카오 로그인에 실패했습니다. 다시 시도해주세요.');
        router.replace(isAdminFlow ? '/admin/login' : '/');
      });
  }, [searchParams, login, router, showToast]);

  return <LoadingUI />;
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <KakaoCallbackContent />
    </Suspense>
  );
}
