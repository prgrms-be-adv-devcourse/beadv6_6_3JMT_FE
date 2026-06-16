'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import Image from 'next/image';
import {
  User, ShoppingBag, Heart, Receipt, Settings, LogOut, Store,
  AlertCircle, ArrowLeft, Lock, AlertTriangle, Star, Check, Mail,
  ShieldCheck, Info, Sparkles, Image as LucideImage, PenLine, CodeXml,
  Megaphone, MessageCircle, BarChart3,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type TabId = 'profile' | 'purchased' | 'wishlist' | 'payments' | 'settings';
type PaymentStatus = 'paid' | 'requested' | 'refunded';

type Prompt = {
  id: number | string;
  title: string;
  cat: string;
  icon: string;
  model: string;
  price: number;
  rating: number | string;
  sales: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  purchasedAt?: string;
};

type UserInfo = {
  name: string;
  email: string;
  role: 'buyer' | 'seller';
};

type NotifState = { email: boolean; marketing: boolean; newPrompt: boolean };

/* ── Mock data ─────────────────────────────────────────────────────── */

const MOCK_USER: UserInfo = {
  name: '김민서',
  email: 'kms12782@nangman.cloud',
  role: 'buyer',
};

const MOCK_PURCHASED: Prompt[] = [
  { id: 1, title: '사진 같은 제품 목업 생성기', cat: 'image', icon: 'image', model: 'Midjourney v6', price: 5900, rating: 4.9, sales: 1240, seller: '비주얼랩', badge: '신규', desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트.', thumbnail_url: null, purchasedAt: '2026-06-01T00:00:00.000Z' },
  { id: 2, title: '전환율 높이는 랜딩 카피 작성', cat: 'writing', icon: 'pen-line', model: 'GPT-4o', price: 4900, rating: 4.8, sales: 980, seller: '카피킷', badge: '베스트', desc: '후킹 헤드라인부터 CTA까지 검증된 프레임워크로 랜딩 페이지 카피를 만들어 줍니다.', thumbnail_url: null, purchasedAt: '2026-05-20T00:00:00.000Z' },
  { id: 3, title: '30일 SNS 콘텐츠 캘린더', cat: 'marketing', icon: 'megaphone', model: 'GPT-4o', price: 3900, rating: 4.7, sales: 2310, seller: '그로스하우스', badge: '베스트', desc: '브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어를 자동 생성합니다.', thumbnail_url: null, purchasedAt: '2026-04-10T00:00:00.000Z' },
];

const MOCK_WISHLIST: Prompt[] = [
  { id: 4, title: '리액트 컴포넌트 리팩터링 도우미', cat: 'coding', icon: 'code-xml', model: 'Claude 3.5', price: 7900, rating: 5.0, sales: 612, seller: '데브플로우', desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고 테스트 코드까지 제안합니다.', thumbnail_url: null },
  { id: 5, title: '엑셀 데이터 인사이트 요약', cat: 'data', icon: 'bar-chart-3', model: 'GPT-4o', price: 0, rating: 4.6, sales: 430, seller: '데이터핀', desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.', thumbnail_url: null },
];

const MOCK_CART = [{ id: 6 }, { id: 7 }];

const PROMPTS_REF: Prompt[] = [
  { id: 1,  title: '사진 같은 제품 목업 생성기',     cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 5900,  rating: 4.9, sales: 1240, seller: '비주얼랩',    badge: '신규',   desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트.',     thumbnail_url: null },
  { id: 2,  title: '전환율 높이는 랜딩 카피 작성',    cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 4900,  rating: 4.8, sales: 980,  seller: '카피킷',      badge: '베스트', desc: '후킹 헤드라인부터 CTA까지 검증된 프레임워크로 카피를 만들어 줍니다.',      thumbnail_url: null },
  { id: 3,  title: '리액트 컴포넌트 리팩터링 도우미',  cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 7900,  rating: 5.0, sales: 612,  seller: '데브플로우',               desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링합니다.',              thumbnail_url: null },
  { id: 4,  title: '30일 SNS 콘텐츠 캘린더',        cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 3900,  rating: 4.7, sales: 2310, seller: '그로스하우스',  badge: '베스트', desc: '브랜드 톤만 입력하면 한 달치 게시물 아이디어와 카피를 자동 생성합니다.', thumbnail_url: null },
  { id: 5,  title: '친절한 CS 챗봇 페르소나',        cat: 'chatbot',   icon: 'message-circle', model: 'Claude 3.5',    price: 6900,  rating: 4.9, sales: 540,  seller: '토크봇',                   desc: '고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트.',      thumbnail_url: null },
  { id: 6,  title: '엑셀 데이터 인사이트 요약',       cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 0,     rating: 4.6, sales: 430,  seller: '데이터핀',                 desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.', thumbnail_url: null },
  { id: 7,  title: '감성 일러스트 캐릭터 시트',       cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 4500,  rating: 4.8, sales: 870,  seller: '비주얼랩',                 desc: '일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.',      thumbnail_url: null },
  { id: 8,  title: '유튜브 스크립트 후킹 오프닝',     cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 0,     rating: 4.7, sales: 1520, seller: '카피킷',      badge: '신규',   desc: '첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다.',          thumbnail_url: null },
  { id: 9,  title: 'A/B 테스트 광고 카피 생성기',    cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 4200,  rating: 4.6, sales: 780,  seller: '그로스하우스',             desc: '동일 메시지를 다른 톤으로 변형해 A/B 테스트용 카피 세트를 만들어 줍니다.', thumbnail_url: null },
  { id: 10, title: '코드 리뷰 자동화 봇',            cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 8900,  rating: 4.9, sales: 310,  seller: '데브플로우',               desc: 'PR 코드를 붙여넣으면 보안·가독성·성능 관점에서 리뷰 코멘트를 생성합니다.', thumbnail_url: null },
  { id: 11, title: '여행 일정 플래너',               cat: 'chatbot',   icon: 'message-circle', model: 'GPT-4o',        price: 2900,  rating: 4.5, sales: 1100, seller: '토크봇',                   desc: '도시, 일수, 예산을 입력하면 현지인 맞춤 여행 일정을 짜줍니다.',          thumbnail_url: null },
  { id: 12, title: '판매 데이터 주간 리포트',         cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 3500,  rating: 4.7, sales: 290,  seller: '데이터핀',                 desc: '주간 판매 데이터를 넣으면 KPI 요약과 다음 주 액션 아이템을 뽑아줍니다.', thumbnail_url: null },
];
const PROMPTS_REF_MAP: Record<string, Prompt> = Object.fromEntries(
  PROMPTS_REF.map((p) => [String(p.id), p])
);

/* ── Icon map ────────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  sparkles:         Sparkles,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
};

/* ── Helpers ─────────────────────────────────────────────────────────── */

function won(n: number) { return '₩' + n.toLocaleString('ko-KR'); }

/* ── Switch ─────────────────────────────────────────────────────────── */

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 46, height: 27, borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: on ? 'var(--ph-primary)' : 'var(--ph-gray-line)',
        position: 'relative', transition: 'background .15s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21,
        borderRadius: '50%', background: '#fff', transition: 'left .15s',
      }} />
    </button>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────── */

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0',
      borderBottom: last ? 'none' : '1px solid var(--ph-border)',
    }}>
      {children}
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */

function Card({
  children,
  padding = '24px',
  style,
  onClick,
}: {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ph-surface)',
        border: '1px solid var(--ph-border)',
        borderRadius: 'var(--ph-radius-lg)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Button ─────────────────────────────────────────────────────────── */

function Button({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  style,
}: {
  variant?: 'solid' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);

  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: 14, padding: '7px 12px', minHeight: 34, minWidth: 64 },
    md: { fontSize: 15, padding: '11px 16px', minHeight: 40, minWidth: 84 },
    lg: { fontSize: 17, padding: '15px 24px', minHeight: 52, minWidth: 120 },
  };

  const variantStyle: React.CSSProperties =
    variant === 'solid'
      ? { background: hovered && !disabled ? 'var(--ph-blue-hover)' : 'var(--ph-primary)', color: '#fff', border: '1px solid transparent', borderRadius: 'var(--ph-radius-md)' }
      : { background: hovered && !disabled ? 'var(--ph-gray-100)' : 'transparent', color: 'var(--ph-text)', border: '1px solid var(--ph-text)', borderRadius: 'var(--ph-radius-sm)' };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontWeight: 600,
        letterSpacing: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        opacity: disabled ? 0.4 : 1,
        boxSizing: 'border-box',
        transition: 'background-color .15s ease, opacity .15s ease',
        ...sizes[size],
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── PHInput ─────────────────────────────────────────────────────────── */

function PHInput({
  label,
  type = 'text',
  value,
  placeholder,
  autoFocus,
  onChange,
  onKeyDown,
}: {
  label?: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}>
          {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '11px 14px',
          border: '1px solid var(--ph-border)',
          borderRadius: 'var(--ph-radius-md)',
          fontFamily: 'var(--ph-font-family)',
          fontSize: 15,
          color: 'var(--ph-text)',
          outline: 'none',
          background: '#fff',
        }}
      />
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  text,
  cta,
  onCta,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div style={{ padding: '72px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
      <Icon style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }} />
      <p style={{ margin: '14px 0 20px', fontSize: 15 }}>{text}</p>
      {cta && <Button variant="solid" onClick={onCta}>{cta}</Button>}
    </div>
  );
}

/* ── SectionTitle ────────────────────────────────────────────────────── */

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{children}</h2>
      {sub && <p style={{ color: 'var(--ph-text-secondary)', fontSize: 15, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}

/* ── PromptCard (mypage variant) ────────────────────────────────────── */

function PromptCard({ p, onClick }: { p: Prompt; onClick?: () => void }) {
  const Icon = ICON_MAP[p.icon] ?? Sparkles;
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ph-surface)',
        border: '1px solid var(--ph-border)',
        borderRadius: 'var(--ph-radius-lg)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        className="ph-card-media"
        style={{
          height: 150, borderRadius: 'var(--ph-radius-lg)',
          background: 'var(--ph-secondary)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--ph-border)', overflow: 'hidden', position: 'relative',
        }}
      >
        {p.thumbnail_url ? (
          <Image src={p.thumbnail_url} alt="썸네일" fill style={{ objectFit: 'cover' }} />
        ) : (
          <Image
            src="/images/promy-character.png"
            alt="기본 이미지"
            width={70}
            height={70}
            style={{ objectFit: 'contain', opacity: 0.75 }}
          />
        )}
        {(p.badge || p.price === 0) && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '4px 8px',
              borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)',
              color: '#fff', fontSize: 12, fontWeight: 700,
            }}>
              {p.price === 0 ? '무료' : p.badge}
            </span>
          </div>
        )}
      </div>
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
          borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-gray-50)',
          border: '1px solid var(--ph-border)', fontSize: 12, fontWeight: 600,
          color: 'var(--ph-text-secondary)',
        }}>
          {p.model}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: 'var(--ph-text)' }}>
        {p.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-text-muted)', fontSize: 13 }}>
        <Star style={{ width: 14, height: 14, color: 'var(--ph-primary)', fill: 'var(--ph-primary)' } as React.CSSProperties} />
        <span style={{ color: 'var(--ph-text)', fontWeight: 600 }}>{p.rating}</span>
        <span>·</span>
        <span>{p.seller}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {p.price === 0
          ? <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>
          : <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.price)}</span>}
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap' }}>
          {p.sales.toLocaleString()}회 판매
        </span>
      </div>
    </div>
  );
}

/* ── EmailChangeModal ───────────────────────────────────────────────── */

function EmailChangeModal({
  currentEmail,
  onClose,
  onVerified,
}: {
  currentEmail: string;
  onClose: () => void;
  onVerified: (email: string) => void;
}) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [code, setCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [codeErr, setCodeErr] = useState('');
  const [secsLeft, setSecsLeft] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (secsLeft <= 0) return;
    const t = setTimeout(() => setSecsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secsLeft]);

  useEffect(() => {
    if (step === 'verify') codeRef.current?.focus();
  }, [step]);

  const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

  const sendCode = () => {
    const v = email.trim();
    if (!validEmail(v)) { setErr('올바른 이메일 형식이 아니에요'); return; }
    if (v.toLowerCase() === currentEmail.toLowerCase()) { setErr('현재 사용 중인 이메일과 같아요'); return; }
    const c = genCode();
    setSentCode(c); setErr(''); setCode(''); setCodeErr(''); setSecsLeft(180); setStep('verify');
  };

  const resend = () => {
    if (secsLeft > 0) return;
    setSentCode(genCode()); setCode(''); setCodeErr(''); setSecsLeft(180);
  };

  const verify = () => {
    if (code.length !== 6) return;
    if (code !== sentCode) { setCodeErr('인증번호가 일치하지 않아요'); return; }
    onVerified(email.trim());
  };

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const errStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
    fontSize: 13, fontWeight: 600, color: 'var(--ph-error)',
  };

  const StepIcon = step === 'input' ? Mail : ShieldCheck;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#fff', borderRadius: 'var(--ph-radius-xl)',
          maxWidth: 440, width: '100%', padding: 28,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--ph-radius-full)',
            background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <StepIcon style={{ width: 22, height: 22, color: 'var(--ph-primary)' } as React.CSSProperties} />
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ph-text-muted)', padding: 4, lineHeight: 0,
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 이메일 입력 단계 */}
        {step === 'input' && (
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>이메일 변경</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 20px' }}>
              새 이메일 주소를 입력하면 인증번호를 보내드려요. 인증을 완료해야 변경돼요.
            </p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}>현재 이메일</div>
              <div style={{
                fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)',
                padding: '11px 14px', background: 'var(--ph-gray-50)',
                border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)',
              }}>
                {currentEmail}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <PHInput
                label="새 이메일"
                type="email"
                value={email}
                placeholder="you@example.com"
                autoFocus
                onChange={(e) => { setEmail(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') sendCode(); }}
              />
              {err && (
                <div style={errStyle}>
                  <AlertCircle style={{ width: 15, height: 15 }} />{err}
                </div>
              )}
            </div>
            <div style={{ marginTop: 24 }}>
              <Button variant="solid" size="lg" fullWidth onClick={sendCode} disabled={!email.trim()}>
                인증번호 받기
              </Button>
            </div>
          </div>
        )}

        {/* 인증번호 입력 단계 */}
        {step === 'verify' && (
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>인증번호 입력</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 16px' }}>
              <strong style={{ color: 'var(--ph-text)', fontWeight: 700 }}>{email.trim()}</strong>
              {' '}으로 보낸 6자리 인증번호를 입력하세요.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              background: 'var(--ph-secondary)', borderRadius: 'var(--ph-radius-md)',
              marginBottom: 18, fontSize: 13, color: 'var(--ph-primary)', fontWeight: 600,
            }}>
              <Info style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>
                데모용 인증번호: <span style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}>{sentCode}</span>
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                ref={codeRef}
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') verify(); }}
                placeholder="000000"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 24, fontWeight: 700, letterSpacing: '0.34em', textAlign: 'center',
                  padding: '14px 16px',
                  border: `1px solid ${codeErr ? 'var(--ph-error)' : 'var(--ph-border)'}`,
                  borderRadius: 'var(--ph-radius-md)', color: 'var(--ph-text)', outline: 'none',
                }}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, fontWeight: 600,
                color: secsLeft > 0 ? 'var(--ph-text-muted)' : 'var(--ph-error)',
                fontFamily: 'ui-monospace, monospace',
              }}>
                {secsLeft > 0 ? mmss(secsLeft) : '만료'}
              </span>
            </div>
            {codeErr && (
              <div style={errStyle}>
                <AlertCircle style={{ width: 15, height: 15 }} />{codeErr}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <button
                onClick={() => { setStep('input'); setCodeErr(''); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)',
                  fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0,
                }}
              >
                <ArrowLeft style={{ width: 14, height: 14 }} />이메일 다시 입력
              </button>
              <button
                onClick={resend}
                disabled={secsLeft > 0}
                style={{
                  background: 'none', border: 'none',
                  cursor: secsLeft > 0 ? 'default' : 'pointer',
                  color: secsLeft > 0 ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
                  fontFamily: 'var(--ph-font-family)', fontSize: 13, fontWeight: 600, padding: 0,
                }}
              >
                인증번호 재발송
              </button>
            </div>
            <div style={{ marginTop: 22 }}>
              <Button
                variant="solid" size="lg" fullWidth
                onClick={verify}
                disabled={code.length !== 6 || secsLeft <= 0}
              >
                인증하고 변경하기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MyPage ─────────────────────────────────────────────────────────── */

const STATUS_MAP: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  paid:      { label: '결제완료',      color: 'var(--ph-primary)',    bg: 'var(--ph-secondary)' },
  requested: { label: '환불 신청 중', color: 'var(--ph-red)',        bg: 'rgba(217,45,32,0.10)' },
  refunded:  { label: '환불 완료',    color: 'var(--ph-gray-600)',   bg: 'var(--ph-gray-100)' },
};

const NOTIF_ROWS: { k: keyof NotifState; t: string; d: string }[] = [
  { k: 'email',     t: '이메일 알림',      d: '주문·다운로드 관련 안내를 이메일로 받아요' },
  { k: 'newPrompt', t: '새 프롬프트 알림', d: '찜한 크리에이터의 새 프롬프트를 알려드려요' },
  { k: 'marketing', t: '마케팅 정보 수신', d: '할인·이벤트 소식을 받아요' },
];

export default function MyPagePage() {
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const { items: wishItems } = useWishStore();
  const [user, setUser] = useState<UserInfo>(MOCK_USER);
  const [tab, setTab] = useState<TabId>('profile');
  const [nick, setNick] = useState(MOCK_USER.name);
  const [savedNick, setSavedNick] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [notif, setNotif] = useState<NotifState>({ email: true, marketing: false, newPrompt: true });
  const [refunds, setRefunds] = useState<Record<string | number, 'requested' | 'refunded'>>({});
  const [refundTarget, setRefundTarget] = useState<Prompt | null>(null);

  useEffect(() => {
    if (!isLoggedIn) openLoginModal();
  }, [isLoggedIn, openLoginModal]);

  const purchased = MOCK_PURCHASED;
  const wishlist: Prompt[] = wishItems.map((item) =>
    PROMPTS_REF_MAP[item.id] ?? {
      id: item.id, title: item.title, price: item.price,
      thumbnail_url: item.thumbnailUrl,
      cat: '', icon: 'sparkles', model: '—', rating: '—', sales: 0, seller: '—', desc: '',
    }
  );
  const cart = MOCK_CART;

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)' }}>로그인이 필요한 페이지예요.</p>
      </div>
    );
  }

  const updateNickname = (n: string) => { setUser((u) => ({ ...u, name: n })); setSavedNick(true); };
  const updateEmail = (e: string) => { setUser((u) => ({ ...u, email: e })); };
  const requestRefund = (id: string | number) => {
    setRefunds((r) => ({ ...r, [id]: 'requested' as const }));
  };

  const NAV: { id: TabId; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'profile',   label: '프로필',         icon: User        },
    { id: 'purchased', label: '구매한 프롬프트', icon: ShoppingBag },
    { id: 'wishlist',  label: '찜한 프롬프트',   icon: Heart       },
    { id: 'payments',  label: '결제 내역',       icon: Receipt     },
    { id: 'settings',  label: '설정',            icon: Settings    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: '0 0 28px' }}>마이페이지</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '224px 1fr', gap: 36, alignItems: 'start' }}>

        {/* ── 사이드바 ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 88 }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--ph-font-family)', fontSize: 15,
                fontWeight: tab === id ? 700 : 500, textAlign: 'left',
                background: tab === id ? 'var(--ph-secondary)' : 'transparent',
                color: tab === id ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />{label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '8px 0' }} />
          <button
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--ph-font-family)', fontSize: 15, fontWeight: 500, textAlign: 'left',
              background: 'transparent', color: 'var(--ph-error)',
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />로그아웃
          </button>
        </nav>

        {/* ── 컨텐츠 영역 ── */}
        <div>

          {/* ── 프로필 탭 ── */}
          {tab === 'profile' && (
            <div>
              <SectionTitle sub="내 계정 정보를 확인하세요.">프로필</SectionTitle>
              <Card padding="28px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                    border: '1px solid var(--ph-border)', flexShrink: 0,
                    background: 'var(--ph-secondary)',
                  }}>
                    <Image
                      src="/images/promy-character.png"
                      alt="프로필 사진"
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: 'var(--ph-text-muted)', fontSize: 15, marginTop: 4 }}>{user.email}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                      padding: '5px 11px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
                      borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600,
                    }}>
                      {user.role === 'seller'
                        ? <><Store style={{ width: 13, height: 13 }} />판매자 계정</>
                        : <><User style={{ width: 13, height: 13 }} />구매자 계정</>}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => setTab('settings')} style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    프로필 수정
                  </Button>
                </div>
              </Card>

              {/* 통계 카드 3개 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
                {[
                  { label: '구매한 프롬프트', value: purchased.length, toTab: 'purchased' as TabId },
                  { label: '찜한 프롬프트',   value: wishlist.length,  toTab: 'wishlist'  as TabId },
                  { label: '장바구니',         value: cart.length,      toTab: undefined },
                ].map((s) => (
                  <Card
                    key={s.label}
                    padding="20px"
                    style={{ cursor: s.toTab ? 'pointer' : 'default' }}
                    onClick={s.toTab ? () => setTab(s.toTab!) : undefined}
                  >
                    <div style={{ fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 14, color: 'var(--ph-text-muted)', marginTop: 4 }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── 구매한 프롬프트 탭 ── */}
          {tab === 'purchased' && (
            <div>
              <SectionTitle sub="결제한 프롬프트를 다시 받아볼 수 있어요.">구매한 프롬프트</SectionTitle>
              {purchased.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  text="아직 구매한 프롬프트가 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {purchased.map((p) => {
                    const rst = refunds[p.id];
                    if (rst) {
                      const label = rst === 'refunded' ? '환불 완료' : '환불 신청 중';
                      return (
                        <div key={p.id} style={{ position: 'relative', cursor: 'not-allowed' }} aria-disabled="true">
                          <div style={{ pointerEvents: 'none', filter: 'grayscale(0.5)' }}>
                            <PromptCard p={p} />
                          </div>
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 'var(--ph-radius-lg)',
                            background: 'rgba(255,255,255,0.66)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 16,
                          }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 'var(--ph-radius-full)',
                              background: '#fff', border: '1px solid var(--ph-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Lock style={{ width: 19, height: 19, color: 'var(--ph-text-secondary)' }} />
                            </div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
                              borderRadius: 'var(--ph-radius-full)', fontSize: 12, fontWeight: 600,
                              color: 'var(--ph-red)', background: 'rgba(217,45,32,0.10)', whiteSpace: 'nowrap',
                            }}>
                              {label}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>
                              열람할 수 없는 프롬프트예요
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <PromptCard key={p.id} p={p} onClick={() => router.push(`/reader/${p.id}`)} />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 찜한 프롬프트 탭 ── */}
          {tab === 'wishlist' && (
            <div>
              <SectionTitle sub="관심 있는 프롬프트를 모아뒀어요.">찜한 프롬프트</SectionTitle>
              {wishlist.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  text="아직 찜한 프롬프트가 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {wishlist.map((p) => (
                    <PromptCard key={p.id} p={p} onClick={() => router.push(`/detail/${p.id}`)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 결제 내역 탭 ── */}
          {tab === 'payments' && (
            <div>
              <SectionTitle sub="결제한 내역과 환불 상태를 확인하세요.">결제 내역</SectionTitle>
              {purchased.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  text="아직 결제 내역이 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <Card padding="0" style={{ overflow: 'hidden' }}>
                  {/* 테이블 헤더 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1fr) 116px 110px 116px 108px',
                    alignItems: 'center', gap: 12, padding: '14px 22px',
                    borderBottom: '1px solid var(--ph-border)',
                    fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)',
                    background: 'var(--ph-gray-50)',
                  }}>
                    <div>상품명</div>
                    <div>결제일</div>
                    <div>금액</div>
                    <div>상태</div>
                    <div style={{ textAlign: 'right' }}>환불</div>
                  </div>
                  {purchased.map((p, i) => {
                    const refundState = refunds[p.id];
                    const st: PaymentStatus = refundState ?? 'paid';
                    const meta = STATUS_MAP[st];
                    const isFree = p.price === 0;
                    const canRefund = !refundState && !isFree;
                    const dateStr = new Date(p.purchasedAt || Date.now()).toLocaleDateString('ko-KR');
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0,1fr) 116px 110px 116px 108px',
                          alignItems: 'center', gap: 12, padding: '16px 22px',
                          borderTop: i ? '1px solid var(--ph-border)' : 'none',
                        }}
                      >
                        <div style={{ minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ph-text-secondary)' }}>{dateStr}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>
                          {p.price === 0 ? '무료' : won(p.price)}
                        </div>
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', padding: '4px 10px',
                            borderRadius: 'var(--ph-radius-full)', fontSize: 12, fontWeight: 600,
                            color: meta.color, background: meta.bg, whiteSpace: 'nowrap',
                          }}>
                            {meta.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {isFree ? (
                            <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>—</span>
                          ) : canRefund ? (
                            <Button variant="secondary" size="sm" onClick={() => setRefundTarget(p)}>환불 신청</Button>
                          ) : (
                            <button disabled style={{
                              fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600,
                              padding: '7px 12px', minHeight: 34, borderRadius: 'var(--ph-radius-sm)',
                              border: '1px solid var(--ph-border)', background: 'var(--ph-gray-100)',
                              color: 'var(--ph-text-muted)', cursor: 'not-allowed',
                            }}>
                              환불 신청
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              )}
            </div>
          )}

          {/* ── 설정 탭 ── */}
          {tab === 'settings' && (
            <div>
              <SectionTitle sub="알림과 계정을 관리하세요.">설정</SectionTitle>

              <div style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>계정 관리</div>
              <Card padding="8px 24px">
                {/* 닉네임 */}
                <Row>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>닉네임</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>다른 사용자에게 표시돼요</div>
                  </div>
                  <div style={{ flex: 1, maxWidth: 280 }}>
                    <PHInput
                      value={nick}
                      onChange={(e) => { setNick(e.target.value); setSavedNick(false); }}
                      placeholder="닉네임"
                    />
                  </div>
                  <Button
                    variant="solid"
                    onClick={() => updateNickname(nick.trim() || user.name)}
                    disabled={!nick.trim() || nick.trim() === user.name}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {savedNick ? '저장됨 ✓' : '저장'}
                  </Button>
                </Row>
                {/* 이메일 */}
                <Row>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>이메일</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>로그인·알림에 사용돼요</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ph-text-secondary)', fontSize: 15, minWidth: 0 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      padding: '3px 9px', borderRadius: 'var(--ph-radius-full)',
                      background: 'var(--ph-secondary)', color: 'var(--ph-primary)', fontSize: 12, fontWeight: 600,
                    }}>
                      <Check style={{ width: 12, height: 12 }} />인증됨
                    </span>
                  </div>
                  <Button variant="secondary" onClick={() => setEmailModal(true)} style={{ whiteSpace: 'nowrap' }}>
                    이메일 변경
                  </Button>
                </Row>
                {/* 비밀번호 */}
                <Row last>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>비밀번호</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <Button variant="secondary" onClick={() => {}} style={{ whiteSpace: 'nowrap' }}>
                    비밀번호 변경
                  </Button>
                </Row>
              </Card>

              <div style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 12px' }}>알림 설정</div>
              <Card padding="8px 24px">
                {NOTIF_ROWS.map((n, i, arr) => (
                  <Row key={n.k} last={i === arr.length - 1}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{n.t}</div>
                      <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>{n.d}</div>
                    </div>
                    <Switch on={notif[n.k]} onChange={(v) => setNotif((s) => ({ ...s, [n.k]: v }))} />
                  </Row>
                ))}
              </Card>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {}}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ph-error)', fontFamily: 'var(--ph-font-family)',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  회원 탈퇴
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 이메일 변경 모달 ── */}
      {emailModal && (
        <EmailChangeModal
          currentEmail={user.email}
          onClose={() => setEmailModal(false)}
          onVerified={(newEmail) => { updateEmail(newEmail); setEmailModal(false); }}
        />
      )}

      {/* ── 환불 신청 확인 모달 ── */}
      {refundTarget && (
        <div
          onClick={() => setRefundTarget(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{
              background: '#fff', borderRadius: 'var(--ph-radius-xl)',
              maxWidth: 420, width: '100%', padding: 28,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--ph-radius-full)',
              background: 'rgba(217,45,32,0.10)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <AlertTriangle style={{ width: 22, height: 22, color: 'var(--ph-red)' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>환불 신청</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 24px' }}>
              환불 신청 시 구매한 상품 열람이 불가합니다. 환불을 신청하시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Button variant="secondary" size="lg" fullWidth onClick={() => setRefundTarget(null)}>취소</Button>
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  variant="solid" size="lg" fullWidth
                  onClick={() => { requestRefund(refundTarget.id); setRefundTarget(null); }}
                >
                  환불 신청
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
