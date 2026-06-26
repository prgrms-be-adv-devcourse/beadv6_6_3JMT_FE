'use client';

import React from 'react';
import { Sparkles, X, MessageCircle, Info } from 'lucide-react';
import api from '@/lib/auth';
import { isApiMockingEnabled } from '@/lib/hybridApi';
import { useAuthStore } from '@/store/useAuthStore';

/* ── 타입 ──────────────────────────────────────────────── */

export type UserRole = 'buyer' | 'seller';

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin?: (role: UserRole, email?: string) => void;
}

/* ── Logo (모달 내부용) ─────────────────────────────────── */

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--ph-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles style={{ width: 17, height: 17 }} />
      </span>
      <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ph-text)' }}>
        Prompt<span style={{ color: 'var(--ph-primary)' }}>Hub</span>
      </span>
    </div>
  );
}

/* ── LoginModal ────────────────────────────────────────── */

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login } = useAuthStore();
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [serviceAgree, setServiceAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const isMocking = isApiMockingEnabled(process.env.NEXT_PUBLIC_API_MOCKING);

  React.useEffect(() => {
    if (open) {
      setMode('login');
      setName('');
      setEmail('');
      setPassword('');
      setServiceAgree(false);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const signup = mode === 'signup';

  const kakaoLogin = () => {
    if (isMocking) {
      window.location.href = '/auth/kakao/callback?code=mock-kakao-code-001';
    } else {
      const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
        redirect_uri: `${window.location.origin}/auth/kakao/callback`,
        response_type: 'code',
      });
      window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`;
    }
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (signup && !serviceAgree) {
      setError('서비스 이용약관에 동의해주세요.');
      return;
    }
    setLoading(true);
    try {
      const endpoint = signup ? '/api/v1/auth/signup' : '/api/v1/auth/login';
      const body = signup ? { name, email, password, serviceAgree } : { email, password };
      const res = await api.post(endpoint, body);
      const { user, token } = res.data.data;
      login({ ...user, provider: user.provider ?? 'local' }, token);
      onClose();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? '요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 420, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 'var(--ph-radius-xl)', border: '1px solid var(--ph-border)', padding: 32 }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4 }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* 타이틀 */}
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em', margin: '20px 0 6px' }}>
          {signup ? 'PromptHub 시작하기' : 'PromptHub 로그인'}
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ph-text-secondary)', margin: '0 0 24px' }}>
          {signup ? '30초면 가입하고 바로 둘러볼 수 있어요.' : '소셜 계정으로 간편하게 로그인하세요.'}
        </p>

        {/* 카카오 로그인 */}
        <button
          onClick={kakaoLogin}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', height: 52, borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer', background: '#FEE500', color: '#191600', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700 }}
        >
          <MessageCircle style={{ width: 19, height: 19 }} />
          카카오로 시작하기
        </button>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--ph-border)' }} />
          <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>또는 이메일로</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ph-border)' }} />
        </div>

        {/* 이메일 폼 */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {signup && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>
              닉네임
              <input
                placeholder="프롬이"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ height: 44, padding: '0 14px', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)', outline: 'none', background: '#fff' }}
              />
            </label>
          )}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>
            이메일
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ height: 44, padding: '0 14px', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)', outline: 'none', background: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>
            비밀번호
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ height: 44, padding: '0 14px', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)', outline: 'none', background: '#fff' }}
            />
          </label>
          {signup && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--ph-text-secondary)', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={serviceAgree}
                onChange={(e) => setServiceAgree(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--ph-primary)', cursor: 'pointer', flexShrink: 0 }}
              />
              <span>
                <b style={{ color: 'var(--ph-text)' }}>서비스 이용약관</b> 및{' '}
                <b style={{ color: 'var(--ph-text)' }}>개인정보 처리방침</b>에 동의합니다. (필수)
              </span>
            </label>
          )}
          {error && (
            <div style={{ fontSize: 13, color: 'var(--ph-error)', padding: '6px 10px', background: '#fff1f1', borderRadius: 'var(--ph-radius-sm)', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 4, height: 52, borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--ph-primary)', color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '처리 중...' : signup ? '가입하고 시작하기' : '로그인'}
          </button>
        </form>

        {/* 데모 안내 — MSW Mock 활성화 시에만 표시 */}
        {isMocking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontSize: 12.5, color: 'var(--ph-text-muted)', lineHeight: 1.5 }}>
            <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>
              데모 계정 (비밀번호: <b style={{ color: 'var(--ph-text-secondary)' }}>password123</b>)
              {' '}— 구매자:{' '}
              <b style={{ color: 'var(--ph-text-secondary)' }}>buyer@prompthub.kr</b>
              {' '}/ 판매자:{' '}
              <b style={{ color: 'var(--ph-text-secondary)' }}>seller@prompthub.kr</b>
              {' '}/ 관리자:{' '}
              <b style={{ color: 'var(--ph-text-secondary)' }}>admin@prompthub.kr</b>
            </span>
          </div>
        )}

        {/* 모드 전환 */}
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--ph-text-secondary)' }}>
          {signup ? '이미 계정이 있으신가요? ' : '아직 계정이 없으신가요? '}
          <button
            onClick={() => setMode(signup ? 'login' : 'signup')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-primary)', fontWeight: 700, fontSize: 14 }}
          >
            {signup ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>
    </div>
  );
}
