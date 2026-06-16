'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Sparkles, Search, Image as LucideImage, PenLine,
  CodeXml, Megaphone, MessageCircle, BarChart3,
  ChevronRight, Star, ShieldCheck, Zap, Wallet,
  Heart, ShoppingCart,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';

/* ── Mock Data ─────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'image',     label: '이미지 생성', icon: 'image',          desc: '광고컷·일러스트·목업' },
  { id: 'writing',   label: '글쓰기',      icon: 'pen-line',       desc: '카피·블로그·이메일' },
  { id: 'coding',    label: '코딩',        icon: 'code-xml',       desc: '리팩터링·디버깅·테스트' },
  { id: 'marketing', label: '마케팅',      icon: 'megaphone',      desc: 'SNS·광고·전략' },
  { id: 'chatbot',   label: '챗봇',        icon: 'message-circle', desc: '페르소나·상담' },
  { id: 'data',      label: '데이터 분석', icon: 'bar-chart-3',    desc: '요약·인사이트' },
];

const TAGS = [
  { label: 'ChatGPT',     q: 'GPT-4o' },
  { label: 'Midjourney',  q: 'Midjourney' },
  { label: 'Claude',      q: 'Claude' },
  { label: '블로그 글쓰기', q: '글쓰기' },
  { label: '제품 사진',    q: '이미지' },
  { label: 'SNS 마케팅',  q: '마케팅' },
];

type Prompt = {
  id: number; title: string; cat: string; icon: string; model: string;
  price: number; originalPrice?: number; rating: number; sales: number;
  seller: string; badge?: string; desc: string;
};


/* ── Lucide icon map ─────────────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
  sparkles:         Sparkles,
  search:           Search,
  image:            LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  megaphone:        Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
  'chevron-right':  ChevronRight,
  star:             Star,
  'shield-check':   ShieldCheck,
  zap:              Zap,
  wallet:           Wallet,
};

function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : null;
}

/* ── Shared UI pieces ────────────────────────────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 14, fontWeight: 600 }}>
      <Icon name="sparkles" style={{ width: 15, height: 15 }} />
      {children}
    </div>
  );
}

function SearchBar({ value, onChange, onSubmit }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        height: 64, background: 'var(--ph-white)', padding: '0 8px 0 22px',
        borderRadius: 'var(--ph-radius-xl)',
        border: `1px solid ${focus ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
        transition: 'border-color .15s ease',
      }}
    >
      <Icon name="search" style={{ width: 22, height: 22, color: 'var(--ph-text-muted)', flexShrink: 0 }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder="어떤 작업에 필요한 프롬프트를 찾으세요?"
        style={{
          flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--ph-font-family)', fontSize: 18, color: 'var(--ph-text)',
        }}
      />
      <button
        type="submit"
        style={{
          flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)',
          fontWeight: 600, color: '#fff', background: 'var(--ph-primary)',
          borderRadius: 'calc(var(--ph-radius-xl) - 6px)',
          height: 50, padding: '0 24px', fontSize: 16,
        }}
      >검색</button>
    </form>
  );
}

function PopularTags({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text-muted)', marginRight: 2 }}>인기 검색</span>
      {TAGS.map((t) => (
        <button
          key={t.label}
          onClick={() => onPick(t.q)}
          style={{
            fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600, lineHeight: 1,
            padding: '8px 14px', borderRadius: 'var(--ph-radius-full)', cursor: 'pointer',
            background: 'var(--ph-white)', color: 'var(--ph-text-secondary)',
            border: '1px solid var(--ph-border)', transition: 'border-color .15s ease, color .15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ph-primary)'; e.currentTarget.style.color = 'var(--ph-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ph-border)'; e.currentTarget.style.color = 'var(--ph-text-secondary)'; }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function Card({ children, padding = '16px', style }: {
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', padding, ...style }}>
      {children}
    </div>
  );
}

function won(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}

function PriceTag({ p }: { p: Prompt }) {
  if (p.price === 0) return <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>;
  if (p.originalPrice && p.originalPrice > p.price) {
    const pct = Math.round((1 - p.price / p.originalPrice) * 100);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ph-error)' }}>{pct}%</span>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.price)}</span>
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', textDecoration: 'line-through' }}>{won(p.originalPrice)}</span>
      </span>
    );
  }
  return <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.price)}</span>;
}

function Thumb({ icon }: { icon: string }) {
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
      <Icon name={icon || 'sparkles'} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 }} />
    </div>
  );
}

function PromptCard({ p }: { p: Prompt }) {
  const router = useRouter();
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
      onClick={() => router.push('/detail/' + p.id)}
      style={{
        background: 'var(--ph-surface)', border: `1px solid ${hovered ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
        borderRadius: 'var(--ph-radius-lg)', padding: 14, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color .15s ease',
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
            <Heart style={{ width: 16, height: 16, color: isWished ? 'var(--ph-error)' : 'var(--ph-text-muted)', fill: isWished ? 'var(--ph-error)' : 'none' }} />
          </button>
          {p.price !== 0 && (
            <button
              onClick={onCart}
              title="장바구니 담기"
              style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-md)', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-text-muted)' }} />
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
        <Icon name="star" style={{ width: 14, height: 14, color: 'var(--ph-primary)' }} />
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

/* ── Hero — Toss 방향 ────────────────────────────────────────────── */

function HeroToss({ query, onChange, onSearch }: {
  query: string;
  onChange: (v: string) => void;
  onSearch: (q: string) => void;
}) {
  return (
    <section style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f3f7fd 42%, #e6effb 100%)' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '96px 32px 88px', textAlign: 'center' }}>
        <div className="rise">
          <Badge>12,000개 이상의 검증된 프롬프트</Badge>
        </div>
        <h1 className="rise" style={{ animationDelay: '.05s', fontSize: 54, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.025em', margin: '24px auto 0', maxWidth: 720 }}>
          더 좋은 결과를 만드는 AI 프롬프트, 여기 다 있어요
        </h1>
        <p className="rise" style={{ animationDelay: '.1s', fontSize: 19, lineHeight: 1.6, color: 'var(--ph-text-secondary)', maxWidth: 540, margin: '20px auto 0' }}>
          크리에이터가 검증한 프롬프트를 구매하고, 내 프롬프트로 수익도 만들어 보세요.
        </p>
        <div className="rise" style={{ animationDelay: '.15s', maxWidth: 620, margin: '36px auto 0' }}>
          <SearchBar value={query} onChange={onChange} onSubmit={onSearch} />
        </div>
        <div className="rise" style={{ animationDelay: '.2s', marginTop: 22 }}>
          <PopularTags onPick={onSearch} />
        </div>
        <div className="rise float" style={{ animationDelay: '.25s', display: 'flex', justifyContent: 'center', marginTop: 48 }}>
          <Image
            src="/images/hero-mockup.png"
            alt="PromptHub 히어로 목업"
            width={662}
            height={986}
            style={{ height: 260, width: 'auto', maxWidth: '100%', display: 'block', userSelect: 'none' }}
            priority
          />
        </div>
      </div>
    </section>
  );
}

/* ── Section Header ──────────────────────────────────────────────── */

function SectionHead({ title, sub, actionLabel, onAction }: {
  title: string; sub?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: 33, fontWeight: 700, margin: 0, letterSpacing: '-0.015em' }}>{title}</h2>
        {sub && <p style={{ color: 'var(--ph-text-secondary)', fontSize: 16, margin: '8px 0 0' }}>{sub}</p>}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontSize: 15, fontWeight: 600, color: 'var(--ph-primary)', padding: 0 }}
        >{actionLabel}</button>
      )}
    </div>
  );
}

/* ── Popular Grid ────────────────────────────────────────────────── */

function PopularGrid() {
  const [featured, setFeatured] = useState<Prompt[]>([]);

  useEffect(() => {
    api.get('/api/v1/products', { params: { sort: 'popular', size: '8' } })
      .then((res) => setFeatured(res.data.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '84px 32px 0' }}>
      <SectionHead
        title="이번 주 인기 프롬프트"
        sub="가장 많이 팔린 프롬프트를 만나보세요"
        actionLabel="전체 보기 →"
        onAction={() => { window.location.href = '/browse'; }}
      />
      <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {featured.map((p) => <PromptCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

/* ── Category Section ────────────────────────────────────────────── */

function CategorySection({ onPick }: { onPick: (label: string) => void }) {
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px 0' }}>
      <SectionHead title="카테고리별로 찾아보기" sub="필요한 작업에 맞는 프롬프트를 골라보세요" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 22px', background: 'var(--ph-white)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-xl)', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', textAlign: 'left', transition: 'border-color .15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ph-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ph-border)'; }}
          >
            <span style={{ width: 52, height: 52, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={c.icon} style={{ width: 24, height: 24 }} />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--ph-text)' }}>{c.label}</span>
              <span style={{ display: 'block', fontSize: 14, color: 'var(--ph-text-muted)', marginTop: 3 }}>{c.desc}</span>
            </span>
            <Icon name="chevron-right" style={{ width: 18, height: 18, color: 'var(--ph-text-muted)', marginLeft: 'auto' }} />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── Why Section ─────────────────────────────────────────────────── */

function WhySection() {
  const items = [
    { icon: 'shield-check', title: '검증된 프롬프트',    desc: '큐레이션을 거쳐 실제로 작동하는 프롬프트만 등록됩니다. 실패하는 결과에 시간 낭비하지 마세요.' },
    { icon: 'zap',          title: '결제 즉시 다운로드', desc: '구매하면 바로 사용할 수 있어요. 복사해서 붙여넣기만 하면 끝, 기다릴 필요 없이.' },
    { icon: 'wallet',       title: '수수료 단 15%',      desc: '판매 수익의 85%가 크리에이터의 몫. 내 프롬프트로 부수입을 만들어 보세요.' },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px 0' }}>
      <SectionHead title="왜 PromptHub일까요?" sub="가장 쉽고 안전하게 프롬프트를 사고파는 방법" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {items.map((f) => (
          <Card key={f.title} padding="32px">
            <span style={{ width: 52, height: 52, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={f.icon} style={{ width: 26, height: 26 }} />
            </span>
            <h3 style={{ fontSize: 21, fontWeight: 700, margin: '20px 0 10px' }}>{f.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ph-text-secondary)', margin: 0 }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ── Seller CTA ──────────────────────────────────────────────────── */

function SellerCTA() {
  const router = useRouter();
  const { isLoggedIn, user: authUser, openLoginModal } = useAuthStore();

  const onSell = () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    router.push(authUser?.role === 'seller' ? '/shop' : '/apply');
  };

  return (
    <section style={{ maxWidth: 1200, margin: '112px auto 0', padding: '0 32px' }}>
      <div style={{ background: 'linear-gradient(135deg, #eaf2fe, #e0ebfb)', borderRadius: 'var(--ph-radius-xl)', padding: '56px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.25 }}>내 프롬프트로<br />수익을 만들어 보세요</h2>
          <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', margin: '14px 0 28px', lineHeight: 1.6 }}>잘 만든 프롬프트 하나가 꾸준한 수입이 됩니다. 등록은 무료, 수수료는 단 15%.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={onSell}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 52, padding: '0 28px', borderRadius: 'var(--ph-radius-md)', background: 'var(--ph-primary)', color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >판매 시작하기</button>
            <button
              onClick={() => router.push('/browse')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 52, padding: '0 28px', borderRadius: 'var(--ph-radius-md)', background: 'var(--ph-white)', color: 'var(--ph-text)', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700, border: '1px solid var(--ph-border)', cursor: 'pointer' }}
            >둘러보기</button>
          </div>
        </div>
        <div className="float" style={{ flexShrink: 0 }}>
          <Image
            src="/images/promy-character.png"
            alt="프롬이 마스코트"
            width={405}
            height={598}
            style={{ width: 'auto', height: 200, display: 'block' }}
          />
        </div>
      </div>
    </section>
  );
}

/* ── HomeScreen ──────────────────────────────────────────────────── */

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const onSearch = (q: string) => {
    window.location.href = `/browse?q=${encodeURIComponent(q)}`;
  };

  return (
    <div>
      <HeroToss query={query} onChange={setQuery} onSearch={onSearch} />
      <PopularGrid />
      <CategorySection onPick={(id) => router.push(`/browse?category=${id}`)} />
      <WhySection />
      <SellerCTA />
      <div style={{ height: 120 }} />
    </div>
  );
}
