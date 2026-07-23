'use client';

import React from 'react';
import { Sparkles, X, MessageCircle } from 'lucide-react';

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
  if (!open) return null;

  const kakaoLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
      redirect_uri: `${window.location.origin}/auth/kakao/callback`,
      response_type: 'code',
    });
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`;
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
          PromptHub 로그인
        </h2>
        <p style={{ fontSize: 15, color: 'var(--ph-text-secondary)', margin: '0 0 24px' }}>
          소셜 계정으로 간편하게 로그인하세요.
        </p>

        {/* 카카오 로그인 */}
        <button
          onClick={kakaoLogin}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', height: 52, borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer', background: '#FEE500', color: '#191600', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700 }}
        >
          <MessageCircle style={{ width: 19, height: 19 }} />
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}
