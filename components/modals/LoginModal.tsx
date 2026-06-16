'use client';

import React from 'react';
import { Sparkles, X, MessageCircle, Info } from 'lucide-react';

/* ── 타입 ──────────────────────────────────────────────── */

export type UserRole = 'buyer' | 'seller';

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (role: UserRole, email?: string) => void;
}

/* ── 역할 결정 ─────────────────────────────────────────── */

const SELLER_ACCOUNTS = ['seller@prompthub.kr', 'promptlab@prompthub.kr'];

function resolveRole(email: string): UserRole {
  const e = (email || '').trim().toLowerCase();
  return SELLER_ACCOUNTS.includes(e) || /seller|판매/.test(e) ? 'seller' : 'buyer';
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

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [mode, setMode] = React.useState<'login' | 'signup'>('login');
  const [email, setEmail] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setMode('login');
      setEmail('');
    }
  }, [open]);

  if (!open) return null;

  const signup = mode === 'signup';

  const kakaoLogin = () => onLogin('buyer');
  const emailLogin = () => onLogin(resolveRole(email), email);

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
          onSubmit={(e) => { e.preventDefault(); emailLogin(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {signup && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>
              닉네임
              <input
                placeholder="프롬이"
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
              style={{ height: 44, padding: '0 14px', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)', outline: 'none', background: '#fff' }}
            />
          </label>
          <button
            type="submit"
            style={{ marginTop: 4, height: 52, borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer', background: 'var(--ph-primary)', color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700 }}
          >
            {signup ? '가입하고 시작하기' : '로그인'}
          </button>
        </form>

        {/* 데모 안내 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontSize: 12.5, color: 'var(--ph-text-muted)', lineHeight: 1.5 }}>
          <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>
            데모: 로그인 시 계정 권한이 자동 확인돼요. 판매자 화면은{' '}
            <b style={{ color: 'var(--ph-text-secondary)' }}>seller@prompthub.kr</b>
            {' '}로 로그인해 보세요.
          </span>
        </div>

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
