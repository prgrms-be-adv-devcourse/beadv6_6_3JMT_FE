'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  Star, X, Check, SearchX,
  Image as LucideImage, PenLine, CodeXml, Megaphone, MessageCircle, BarChart3, Sparkles,
  Heart, ShoppingCart,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';

/* ── Types ────────────────────────────────────────────────────────── */

type Category = { id: string; label: string; icon?: string; desc?: string };
type Prompt = {
  id: number; title: string; cat: string; icon: string; model: string;
  price: number; originalPrice?: number; rating: number; sales: number;
  seller: string; badge?: string; desc: string;
};

/* ── Mock data ────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: 'all',       label: '전체' },
  { id: 'image',     label: '이미지 생성', icon: 'image',          desc: '광고컷·일러스트·목업' },
  { id: 'writing',   label: '글쓰기',      icon: 'pen-line',       desc: '카피·블로그·이메일' },
  { id: 'coding',    label: '코딩',        icon: 'code-xml',       desc: '리팩터링·디버깅·테스트' },
  { id: 'marketing', label: '마케팅',      icon: 'megaphone',      desc: 'SNS·광고·전략' },
  { id: 'chatbot',   label: '챗봇',        icon: 'message-circle', desc: '페르소나·상담' },
  { id: 'data',      label: '데이터 분석', icon: 'bar-chart-3',    desc: '요약·인사이트' },
];


/* ── Icon utility ────────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  sparkles:         Sparkles,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
};

function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : null;
}

/* ── Helper ──────────────────────────────────────────────────────── */

function won(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}

/* ── Tag (디자인 시스템 Tag 원본 그대로) ─────────────────────────── */

function Tag({
  selected = false,
  children,
  onClick,
}: {
  selected?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontSize: '14px',
        fontWeight: 600,
        lineHeight: 1,
        padding: '9px 14px',
        borderRadius: 'var(--ph-radius-full)',
        cursor: 'pointer',
        transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
        backgroundColor: selected ? 'var(--ph-secondary)' : 'var(--ph-white)',
        color: selected ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--ph-border)'}`,
        boxShadow: 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── PriceTag ────────────────────────────────────────────────────── */

function PriceTag({ p, size = 17 }: { p: Prompt; size?: number }) {
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

/* ── Thumb (이미지 없을 때 아이콘 플레이스홀더) ───────────────────── */

function Thumb({ icon }: { icon: string }) {
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
      <Icon name={icon || 'sparkles'} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
    </div>
  );
}

/* ── PromptCard ──────────────────────────────────────────────────── */

function PromptCard({ p, onOpen }: { p: Prompt; onOpen?: (p: Prompt) => void }) {
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const { items: wishItems, toggle } = useWishStore();
  const { addItem } = useCartStore();
  const [hovered, setHovered] = useState(false);

  const isWished = wishItems.some((i) => i.id === String(p.id));

  const onWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { openLoginModal(); return; }
    toggle({ id: String(p.id), title: p.title, price: p.price, thumbnailUrl: null });
  };

  const onCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { openLoginModal(); return; }
    addItem({ id: String(p.id), title: p.title, price: p.price, thumbnailUrl: null });
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen && onOpen(p)}
      style={{
        background: 'var(--ph-surface)',
        border: `1px solid ${hovered ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
        borderRadius: 'var(--ph-radius-lg)',
        padding: '14px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color .15s ease',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
      }}
    >
      <div className="ph-card-media" style={{ position: 'relative' }}>
        <Thumb icon={p.icon} />
        {(p.price === 0 || p.badge) && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)', color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {p.price === 0 ? '무료' : p.badge}
            </span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            onClick={onWish}
            title="찜하기"
            style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-md)', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <Heart style={{ width: 16, height: 16, color: isWished ? 'var(--ph-error)' : 'var(--ph-text-muted)', fill: isWished ? 'var(--ph-error)' : 'none' } as React.CSSProperties} />
          </button>
          {p.price !== 0 && (
            <button
              onClick={onCart}
              title="장바구니 담기"
              style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-md)', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-text-muted)' } as React.CSSProperties} />
            </button>
          )}
        </div>
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
        <PriceTag p={p} />
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap' }}>{p.sales.toLocaleString()}회 판매</span>
      </div>
    </div>
  );
}

/* ── BrowseScreen (원본 BrowseScreen 그대로 이식) ─────────────────── */

function BrowseScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const [sort, setSort] = useState('인기순');
  const [list, setList] = useState<Prompt[]>([]);

  useEffect(() => {
    setList([]);
    const sortParam = sort === '평점순' ? 'rating' : sort === '가격순' ? 'price-asc' : 'popular';
    api.get('/api/v1/products', {
      params: { q: query || undefined, category: category !== 'all' ? category : undefined, sort: sortParam },
    })
      .then((res) => setList(res.data.data ?? []))
      .catch(() => {});
  }, [query, category, sort]);

  const setCategory = (id: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (id !== 'all') params.set('category', id);
    router.push('/browse' + (params.toString() ? `?${params.toString()}` : ''));
  };

  const clearQuery = () => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    router.push('/browse' + (params.toString() ? `?${params.toString()}` : ''));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>프롬프트 탐색</h1>
      <p style={{ color: 'var(--ph-text-secondary)', fontSize: 16, margin: '0 0 28px' }}>
        {query ? <span>'{query}' 검색 결과 · </span> : null}{list.length}개의 프롬프트
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <Tag key={c.id} selected={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</Tag>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        {query && (
          <button
            onClick={clearQuery}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ph-secondary)', color: 'var(--ph-primary)', border: 'none', borderRadius: 'var(--ph-radius-full)', padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
          >
            <X style={{ width: 13, height: 13 }} /> 검색 초기화
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {(['인기순', '평점순', '가격순'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: sort === s ? 700 : 500, color: sort === s ? 'var(--ph-text)' : 'var(--ph-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {sort === s && <Check style={{ width: 15, height: 15 }} />}{s}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '90px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
          <SearchX style={{ width: 40, height: 40, margin: '0 auto' }} />
          <p style={{ marginTop: 12 }}>검색 결과가 없어요. 다른 키워드로 찾아보세요.</p>
        </div>
      ) : (
        <div
          className="ph-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
        >
          {list.map((p) => (
            <PromptCard key={p.id} p={p} onOpen={(p) => router.push(`/detail/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page export ─────────────────────────────────────────────────── */

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseScreen />
    </Suspense>
  );
}
