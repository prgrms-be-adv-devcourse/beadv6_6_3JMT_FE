'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Star,
  CheckCircle2, ShoppingCart, Check, History,
  ChevronDown, BellRing, ArrowRight, Info,
  Sparkles, Image as LucideImage, PenLine, CodeXml,
  Megaphone, MessageCircle, BarChart3, BookOpen,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: number;
  title: string;
  cat: string;
  icon: string;
  model: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sales: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  versions?: Version[];
  features?: string[];
};

type Version = { ver: string; date: string; note: string };
type Slide = { caption: string; icon: string; tint: string };

/* ── Mock data ──────────────────────────────────────────────────────── */


/* ── Icon utility ───────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  sparkles:         Sparkles,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
  'book-open':      BookOpen,
};

function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : <Sparkles style={style} />;
}

/* ── Badge ──────────────────────────────────────────────────────────── */

function Badge({
  tone = 'neutral',
  soft = true,
  children,
  style,
}: {
  tone?: 'neutral' | 'blue';
  soft?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 'var(--ph-radius-sm)',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };
  const toneStyle: React.CSSProperties =
    tone === 'blue' && !soft
      ? { background: 'var(--ph-primary)', color: '#fff' }
      : tone === 'blue'
      ? { background: 'var(--ph-secondary)', color: 'var(--ph-primary)', border: '1px solid color-mix(in srgb, var(--ph-primary) 20%, transparent)' }
      : { background: 'var(--ph-gray-100)', color: 'var(--ph-text-secondary)', border: '1px solid var(--ph-border)' };
  return <span style={{ ...base, ...toneStyle, ...style }}>{children}</span>;
}

/* ── Button ─────────────────────────────────────────────────────────── */

function Button({
  variant = 'solid',
  size = 'lg',
  fullWidth,
  onClick,
  children,
}: {
  variant?: 'solid' | 'secondary';
  size?: 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const solidStyle: React.CSSProperties = {
    background: hovered ? 'var(--ph-blue-hover)' : 'var(--ph-primary)',
    color: '#fff',
    border: '1px solid transparent',
  };
  const secondaryStyle: React.CSSProperties = {
    background: hovered ? 'var(--ph-gray-100)' : 'var(--ph-white)',
    color: 'var(--ph-text)',
    border: '1px solid var(--ph-border)',
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontSize: 15,
        fontWeight: 700,
        lineHeight: 1,
        padding: size === 'lg' ? '14px 20px' : '10px 16px',
        borderRadius: 'var(--ph-radius-md)',
        cursor: 'pointer',
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background-color .15s ease',
        ...(variant === 'solid' ? solidStyle : secondaryStyle),
      }}
    >
      {children}
    </button>
  );
}

/* ── Card ───────────────────────────────────────────────────────────── */

function Card({
  padding = '16px',
  children,
  style,
}: {
  padding?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
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

/* ── Avatar ─────────────────────────────────────────────────────────── */

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.slice(0, 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--ph-secondary)',
        color: 'var(--ph-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ── PriceTag ────────────────────────────────────────────────────────── */

function won(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}

function PriceTag({ p, size = 17, purchased = false }: { p: Prompt; size?: number; purchased?: boolean }) {
  const ic = Math.round(size * 0.72);
  if (purchased) {
    return (
      <span style={{ fontSize: size, fontWeight: 700, color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle2 style={{ width: ic, height: ic }} />구매함
      </span>
    );
  }
  if (p.price === 0) return <span style={{ fontSize: size, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>;
  if (p.originalPrice && p.originalPrice > p.price) {
    const pct = Math.round((1 - p.price / p.originalPrice) * 100);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: size - 2, fontWeight: 700, color: 'var(--ph-error)' }}>{pct}%</span>
        <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.price)}</span>
        <span style={{ fontSize: size - 4, color: 'var(--ph-text-muted)', textDecoration: 'line-through' }}>{won(p.originalPrice)}</span>
      </span>
    );
  }
  return <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.price)}</span>;
}

/* ── ImageCarousel ──────────────────────────────────────────────────── */

function ImageCarousel({ slides, thumbnailUrl }: { slides: Slide[]; thumbnailUrl?: string | null }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const s = slides[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + n) % n);
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  const arrowStyle = (dir: 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left: dir === 'left' ? 14 : 'auto',
    right: dir === 'right' ? 14 : 'auto',
    width: 42,
    height: 42,
    borderRadius: 'var(--ph-radius-full)',
    border: '1px solid var(--ph-border)',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--ph-text)',
  });

  /* 첫 번째 슬라이드에 thumbnail_url이 있으면 <Image>, 없으면 아이콘 플레이스홀더 */
  const isFirstAndHasImage = i === 0 && thumbnailUrl;
  const imgSrc = isFirstAndHasImage ? thumbnailUrl : null;

  return (
    <div>
      <div style={{ position: 'relative', height: 360, borderRadius: 'var(--ph-radius-xl)', overflow: 'hidden', border: '1px solid var(--ph-border)' }}>
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={s.caption}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : thumbnailUrl === null && i === 0 ? (
          <div style={{ height: '100%', background: s.tint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'background .2s ease' }}>
            <Image
              src="/images/promy-character.png"
              alt="대표 이미지"
              width={140}
              height={140}
              style={{ objectFit: 'contain', opacity: 0.85 }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>{s.caption}</span>
          </div>
        ) : (
          <div style={{ height: '100%', background: s.tint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, transition: 'background .2s ease' }}>
            <Icon name={s.icon} style={{ width: 84, height: 84, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>{s.caption}</span>
          </div>
        )}

        {n > 1 && (
          <button
            onClick={() => setI((x) => (x - 1 + n) % n)}
            aria-label="이전 이미지"
            style={arrowStyle('left')}
          >
            <ChevronLeft style={{ width: 20, height: 20 }} />
          </button>
        )}
        {n > 1 && (
          <button
            onClick={() => setI((x) => (x + 1) % n)}
            aria-label="다음 이미지"
            style={arrowStyle('right')}
          >
            <ChevronRight style={{ width: 20, height: 20 }} />
          </button>
        )}

        <div style={{ position: 'absolute', top: 14, right: 16, fontSize: 12, fontWeight: 600, color: 'var(--ph-text-secondary)', background: 'rgba(255,255,255,0.85)', borderRadius: 'var(--ph-radius-full)', padding: '4px 10px' }}>
          {i + 1} / {n}
        </div>

        {n > 1 && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {slides.map((_, k) => (
              <span
                key={k}
                onClick={() => setI(k)}
                style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 9999, background: k === i ? 'var(--ph-primary)' : 'rgba(0,0,0,0.22)', cursor: 'pointer', transition: 'all .15s' }}
              />
            ))}
          </div>
        )}
      </div>

      {n > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {slides.map((sl, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`${k + 1}번 이미지`}
              style={{ flex: 1, height: 66, borderRadius: 'var(--ph-radius-md)', border: `1px solid ${k === i ? 'var(--ph-primary)' : 'var(--ph-border)'}`, background: sl.tint, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <Icon name={sl.icon} style={{ width: 22, height: 22, color: 'var(--ph-primary)', opacity: 0.8 } as React.CSSProperties} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Thumb (카드 썸네일 플레이스홀더) ───────────────────────────────── */

function Thumb({ icon, thumbnailUrl }: { icon: string; thumbnailUrl?: string | null }) {
  if (thumbnailUrl) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', overflow: 'hidden', position: 'relative', border: '1px solid var(--ph-border)' }}>
        <Image src={thumbnailUrl} alt="" fill style={{ objectFit: 'cover' }} />
      </div>
    );
  }
  if (thumbnailUrl === null) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
        <Image src="/images/promy-character.png" alt="" width={60} height={60} style={{ objectFit: 'contain', opacity: 0.85 }} />
      </div>
    );
  }
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
      <Icon name={icon || 'sparkles'} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
    </div>
  );
}

/* ── CircleBtn ──────────────────────────────────────────────────────── */

function CircleBtn({
  icon,
  active,
  fill,
  onClick,
  label,
  activeColor = 'var(--ph-primary)',
}: {
  icon: 'heart' | 'shopping-cart' | 'check';
  active?: boolean;
  fill?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  activeColor?: string;
}) {
  const isHeart = icon === 'heart';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-full)', border: '1px solid var(--ph-border)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: active ? activeColor : 'var(--ph-text-secondary)', padding: 0 }}
    >
      {isHeart ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill={fill ? activeColor : 'none'} stroke={fill ? activeColor : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
        </svg>
      ) : icon === 'check' ? (
        <Check style={{ width: 16, height: 16 }} />
      ) : (
        <ShoppingCart style={{ width: 16, height: 16 }} />
      )}
    </button>
  );
}

/* ── Related PromptCard ─────────────────────────────────────────────── */

function PromptCard({ p, onOpen }: { p: Prompt; onOpen?: (p: Prompt) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen && onOpen(p)}
      style={{ background: 'var(--ph-surface)', border: `1px solid ${hovered ? 'var(--ph-primary)' : 'var(--ph-border)'}`, borderRadius: 'var(--ph-radius-lg)', padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color .15s ease' }}
    >
      <div className="ph-card-media" style={{ position: 'relative' }}>
        <Thumb icon={p.icon} thumbnailUrl={p.thumbnail_url} />
        {(p.price === 0 || p.badge) && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <Badge tone="blue" soft={false}>{p.price === 0 ? '무료' : p.badge}</Badge>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>{p.model}</Badge>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: 'var(--ph-text)' }}>{p.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-text-muted)', fontSize: 13 }}>
        <Star style={{ width: 14, height: 14, fill: 'var(--ph-primary)', color: 'var(--ph-primary)' } as React.CSSProperties} />
        <span style={{ color: 'var(--ph-text)', fontWeight: 600 }}>{p.rating}</span>
        <span>·</span>
        <span>{p.seller}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
        <PriceTag p={p} />
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap' }}>{p.sales.toLocaleString()}회 판매</span>
      </div>
    </div>
  );
}

/* ── DetailScreen ───────────────────────────────────────────────────── */

function DetailScreen({ p, related }: { p: Prompt; related: Prompt[] }) {
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const { items: wishItems, toggle } = useWishStore();
  const { items: cartItems, addItem } = useCartStore();
  const [showVersions, setShowVersions] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const inWish = wishItems.some((i) => i.id === String(p.id));
  const inCart = cartItems.some((i) => i.id === String(p.id));

  const onCart = () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    addItem({ id: String(p.id), title: p.title, price: p.price, thumbnailUrl: p.thumbnail_url ?? null });
  };

  const onWish = () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    toggle({ id: String(p.id), title: p.title, price: p.price, thumbnailUrl: p.thumbnail_url ?? null });
  };

  const features = p.features ?? ['결제 즉시 다운로드', '상업적 이용 가능', '무료 업데이트 제공'];
  const versions = p.versions ?? [];
  const latest = versions[0];

  const gallery: Slide[] = [
    { caption: '대표 이미지', icon: p.icon, tint: 'var(--ph-secondary)' },
    { caption: '예시 결과 1', icon: 'image',     tint: 'var(--ph-gray-50)' },
    { caption: '예시 결과 2', icon: p.icon,      tint: 'var(--ph-secondary)' },
    { caption: '사용 가이드', icon: 'book-open', tint: 'var(--ph-gray-50)' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/browse')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 탐색으로 돌아가기
      </button>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          <ImageCarousel slides={gallery} thumbnailUrl={p.thumbnail_url} />

          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>{p.model}</Badge>
            {p.badge && <Badge tone="blue" soft={false} style={{ whiteSpace: 'nowrap' }}>{p.badge}</Badge>}
          </div>

          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.01em', margin: '16px 0 0' }}>{p.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0 32px', color: 'var(--ph-text-secondary)', fontSize: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star style={{ width: 16, height: 16, fill: 'var(--ph-primary)', color: 'var(--ph-primary)' } as React.CSSProperties} />
              <b style={{ color: 'var(--ph-text)' }}>{p.rating}</b>
            </span>
            <span>·</span>
            <span>{p.sales.toLocaleString()}회 판매</span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>프롬프트 소개</h3>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ph-text-secondary)', margin: 0, maxWidth: 620 }}>{p.desc}</p>

          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 16px' }}>판매자</h3>
          <Card padding="20px" style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={p.seller} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.seller}</div>
              <div style={{ color: 'var(--ph-text-muted)', fontSize: 14 }}>검증된 크리에이터 · 프롬프트 24개</div>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 버전 상태 배너 (구매한 경우에만 표시) */}
          {purchased && latest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} /> 최신 버전(v{latest.ver})을 보유하고 있어요
            </div>
          )}

          {/* 구매 카드 */}
          <Card padding="24px">
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              <PriceTag p={p} size={32} purchased={purchased} />
            </div>
            <div style={{ color: 'var(--ph-text-muted)', fontSize: 14, marginTop: 4 }}>
              {purchased
                ? '이미 보유한 프롬프트예요'
                : p.price === 0
                ? '무료 제공 · 구매 없이 바로 사용'
                : '1회 결제 · 영구 이용'}
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                variant="solid"
                size="lg"
                fullWidth
                onClick={() => setPurchased(true)}
              >
                {purchased
                  ? p.price === 0 ? '받기 완료 ✓' : '구매 완료 ✓'
                  : p.price === 0 ? '무료로 받기' : '프롬프트 구매하기'}
              </Button>

              <div style={{ display: 'flex', gap: 10 }}>
                {p.price !== 0 && (
                  <div style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={onCart}
                    >
                      {inCart
                        ? <><Check style={{ width: 17, height: 17 }} /> 담긴</>
                        : <><ShoppingCart style={{ width: 17, height: 17 }} /> 장바구니</>}
                    </Button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={onWish}
                  >
                    <svg viewBox="0 0 24 24" width="17" height="17" fill={inWish ? '#FF3040' : 'none'} stroke={inWish ? '#FF3040' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
                    </svg>
                    {' '}찜
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ph-text-secondary)' }}>
                  <CheckCircle2 style={{ width: 17, height: 17, color: 'var(--ph-primary)', flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
          </Card>

          {/* 버전 기록 */}
          <Card padding="0" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setShowVersions((v) => !v)}
              aria-expanded={showVersions}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', textAlign: 'left' }}
            >
              <History style={{ width: 18, height: 18, color: 'var(--ph-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ph-text)' }}>버전 기록</span>
              {latest && <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>v{latest.ver}</Badge>}
              <ChevronDown style={{ width: 18, height: 18, color: 'var(--ph-text-muted)', marginLeft: 'auto', transform: showVersions ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' } as React.CSSProperties} />
            </button>

            {showVersions && (
              <div style={{ borderTop: '1px solid var(--ph-border)', padding: '6px 18px 14px' }}>
                {versions.map((v, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <div
                      key={v.ver}
                      style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: idx === versions.length - 1 ? 'none' : '1px solid var(--ph-border)', opacity: isCurrent ? 1 : 0.5 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: isCurrent ? 'var(--ph-primary)' : 'var(--ph-gray-line)', flexShrink: 0 }} />
                        {idx !== versions.length - 1 && <span style={{ width: 2, flex: 1, background: 'var(--ph-border)', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>v{v.ver}</span>
                          <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>{v.date}</span>
                          {isCurrent
                            ? <Badge tone="blue" soft={false} style={{ whiteSpace: 'nowrap' }}>현재</Badge>
                            : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ph-text-muted)' }}>구매 불가</span>}
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--ph-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{v.note}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, color: 'var(--ph-text-muted)' }}>
                  <Info style={{ width: 14, height: 14, flexShrink: 0 }} /> 구매는 최신 버전에만 가능하며, 이전 버전은 구매할 수 없어요.
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Related prompts */}
      {related.length > 0 && (
        <section style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 27, fontWeight: 700, margin: '0 0 24px' }}>비슷한 프롬프트</h2>
          <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {related.map((r) => (
              <PromptCard key={r.id} p={r} onOpen={(rp) => router.push(`/detail/${rp.id}`)} />
            ))}
          </div>
        </section>
      )}


      <div style={{ height: 80 }} />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [product, setProduct] = useState<Prompt | null>(null);
  const [related, setRelated] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/api/v1/products/${id}`),
      api.get(`/api/v1/products/${id}/related`),
    ])
      .then(([pRes, rRes]) => {
        setProduct(pRes.data.data);
        setRelated(rRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--ph-text-muted)' }}>불러오는 중...</div>;

  if (!product) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>프롬프트를 찾을 수 없어요.</p>
        <button
          onClick={() => router.push('/browse')}
          style={{ background: 'var(--ph-primary)', color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)', padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
        >
          탐색으로 돌아가기
        </button>
      </div>
    );
  }

  return <DetailScreen p={product} related={related} />;
}
