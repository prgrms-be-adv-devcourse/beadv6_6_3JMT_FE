'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';
import {
  Plus, Layers, ShoppingBag, Wallet,
  Info, Clock, SearchCheck, Pencil, CirclePause, Lock,
  AlertTriangle, Star,
  Image as LucideImage, PenLine, CodeXml, Megaphone, MessageCircle, BarChart3, Sparkles,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: number | string;
  title: string;
  cat: string;
  icon: string;
  model: string;
  price: number;
  originalPrice?: number;
  rating: number | string;
  sales: number;
  seller: string;
  badge?: string;
  desc: string;
  status?: 'review' | 'active';
  thumbnail_url?: string | null;
};

/* ── Mock data ─────────────────────────────────────────────────────── */


/* ── Icon utility ───────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  sparkles:         Sparkles,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
};

function PromptIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name] ?? Sparkles;
  return <C style={style} />;
}

/* ── helpers ────────────────────────────────────────────────────────── */

function won(n: number) { return '₩' + n.toLocaleString('ko-KR'); }

/* ── Thumb ──────────────────────────────────────────────────────────── */

function Thumb({ icon, thumbnailUrl, badge, isFree }: { icon: string; thumbnailUrl?: string | null; badge?: string; isFree?: boolean }) {
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)', overflow: 'hidden', position: 'relative' }}>
      {thumbnailUrl ? (
        <Image src={thumbnailUrl} alt="썸네일" fill style={{ objectFit: 'cover' }} />
      ) : (
        <PromptIcon name={icon || 'sparkles'} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
      )}
      {(isFree || badge) && (
        <div style={{ position: 'absolute', top: 10, left: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)', color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {isFree ? '무료' : badge}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────── */

function StatusBadge({ status, stopped }: { status?: string; stopped?: boolean }) {
  if (status === 'review') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-text)', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        <Clock style={{ width: 12, height: 12 }} /> 검수중
      </span>
    );
  }
  if (stopped) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        판매 중단
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-primary)', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      판매중
    </span>
  );
}

/* ── PromptCard (shop 전용 — hideActions, 원본 구조 그대로) ─────────── */

function PromptCard({ p }: { p: Prompt }) {
  return (
    <div
      style={{
        background: 'var(--ph-surface)',
        border: '1px solid var(--ph-border)',
        borderRadius: 'var(--ph-radius-lg)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div className="ph-card-media">
        <Thumb icon={p.icon} thumbnailUrl={p.thumbnail_url} badge={p.badge} isFree={p.price === 0} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)', fontSize: 12, fontWeight: 600, color: 'var(--ph-text-secondary)', whiteSpace: 'nowrap' }}>
          {p.model}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: 'var(--ph-text)' }}>{p.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-text-muted)', fontSize: 13 }}>
        <Star style={{ width: 14, height: 14, color: 'var(--ph-primary)', fill: 'var(--ph-primary)' } as React.CSSProperties} />
        <span style={{ color: 'var(--ph-text)', fontWeight: 600 }}>{p.rating}</span>
        <span>·</span>
        <span>{p.seller}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
        {p.price === 0
          ? <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>
          : <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.price)}</span>}
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap' }}>{p.sales.toLocaleString()}회 판매</span>
      </div>
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
}: {
  variant?: 'solid' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
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
      }}
    >
      {children}
    </button>
  );
}

/* ── ShopPage ───────────────────────────────────────────────────────── */

export default function ShopPage() {
  const router = useRouter();
  const [stopped, setStopped] = useState<Record<string | number, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [myListings, setMyListings] = useState<Prompt[]>([]);
  const [stats, setStats] = useState([
    { label: '등록 프롬프트', value: '-',  icon: Layers      },
    { label: '누적 판매',     value: '-',  icon: ShoppingBag },
    { label: '이번 달 수익',  value: '-',  icon: Wallet      },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/sellers/me/products').catch(() => ({ data: { data: [] } })),
      api.get('/api/v1/sellers/me/stats').catch(() => ({ data: { data: {} } })),
    ]).then(([productsRes, statsRes]) => {
      const products = productsRes.data.data ?? [];
      const d = statsRes.data.data ?? {};
      setMyListings(products);
      setStats([
        { label: '등록 프롬프트', value: `${products.length}개`,                             icon: Layers      },
        { label: '누적 판매',     value: `${(d.totalSales ?? 0).toLocaleString('ko-KR')}회`, icon: ShoppingBag },
        { label: '이번 달 수익',  value: `₩${(d.totalRevenue ?? 0).toLocaleString('ko-KR')}`, icon: Wallet    },
      ]);
    });
  }, []);

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = (id: string | number) => { setStopped((s) => ({ ...s, [id]: true })); setConfirmId(null); };

  const activeCount = myListings.filter((p) => !isStopped(p.id) && p.status !== 'review').length;
  const reviewCount = myListings.filter((p) => p.status === 'review').length;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>내 상점</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>프롬프트랩님의 판매 현황이에요</p>
        </div>
        <Button variant="solid" size="lg" onClick={() => router.push('/sell')}>
          <Plus style={{ width: 17, height: 17 }} /> 새 프롬프트 등록
        </Button>
      </div>

      {/* ── 통계 카드 3개 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '28px 0 8px' }}>
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            style={{ background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', padding: '22px', display: 'flex', alignItems: 'center', gap: 14 }}
          >
            <span style={{ width: 46, height: 46, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon style={{ width: 22, height: 22 }} />
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{value}</div>
              <div style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 내 프롬프트 섹션 ── */}
      <section style={{ marginTop: 44, paddingBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>내 프롬프트</h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)', fontSize: 13, fontWeight: 600 }}>
            판매 중 {activeCount}
          </span>
          {reviewCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 9px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', fontSize: 13, fontWeight: 600 }}>
              검수중 {reviewCount}
            </span>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
          새로 등록한 프롬프트는 관리자 검수를 거쳐 승인되면 판매가 시작돼요. 판매를 중단하면 다시 등록할 수 없어요.
        </p>

        <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {myListings.map((p) => {
            const review = p.status === 'review';
            const off = isStopped(p.id);
            const dim = review || off;

            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 카드 + 오버레이 */}
                <div style={{ position: 'relative' }}>
                  {/* 상태 배지 */}
                  <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 2 }}>
                    <StatusBadge status={p.status} stopped={off} />
                  </div>
                  {/* 카드 (검수중/판매 중단이면 흐리게) */}
                  <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(0.7)' : 'none', pointerEvents: dim ? 'none' : 'auto', transition: 'opacity .15s ease, filter .15s ease' }}>
                    <PromptCard p={p} />
                  </div>
                </div>

                {/* 카드 아래 액션 */}
                {review ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ph-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <SearchCheck style={{ width: 14, height: 14, color: 'var(--ph-primary)' }} /> 관리자 검수 대기 중이에요
                    </span>
                    <Button variant="secondary" size="sm" fullWidth onClick={() => router.push(`/edit/${p.id}`)}>
                      <Pencil style={{ width: 15, height: 15 }} /> 수정
                    </Button>
                  </div>
                ) : off ? (
                  <Button variant="secondary" size="sm" fullWidth disabled>
                    <Lock style={{ width: 15, height: 15 }} /> 재등록 불가
                  </Button>
                ) : confirmId === p.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ph-error)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <AlertTriangle style={{ width: 14, height: 14 }} /> 중단하면 다시 등록할 수 없어요
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(null)}>취소</Button>
                      <Button variant="solid" size="sm" fullWidth onClick={() => stopSelling(p.id)}>중단</Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="sm" fullWidth onClick={() => router.push(`/edit/${p.id}`)}>
                      <Pencil style={{ width: 15, height: 15 }} /> 수정
                    </Button>
                    <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(p.id)}>
                      <CirclePause style={{ width: 15, height: 15 }} /> 판매 중단
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
