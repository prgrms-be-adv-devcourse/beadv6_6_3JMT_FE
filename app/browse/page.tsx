'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const PROMPTS: Prompt[] = [
  { id: 1,  title: '사진 같은 제품 목업 생성기',     cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 5900,                 rating: 4.9, sales: 1240, seller: '비주얼랩',   badge: '신규',   desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다.' },
  { id: 2,  title: '전환율 높이는 랜딩 카피 작성',    cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 4900, originalPrice: 7900, rating: 4.8, sales: 980,  seller: '카피킷',    badge: '베스트', desc: '후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다.' },
  { id: 3,  title: '리액트 컴포넌트 리팩터링 도우미',  cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 7900,                 rating: 5.0, sales: 612,  seller: '데브플로우',             desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다.' },
  { id: 4,  title: '30일 SNS 콘텐츠 캘린더',        cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 3900, originalPrice: 5900, rating: 4.7, sales: 2310, seller: '그로스하우스', badge: '베스트', desc: '브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다.' },
  { id: 5,  title: '친절한 CS 챗봇 페르소나',        cat: 'chatbot',   icon: 'message-circle', model: 'Claude 3.5',    price: 6900,                 rating: 4.9, sales: 540,  seller: '토크봇',                 desc: '고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트.' },
  { id: 6,  title: '엑셀 데이터 인사이트 요약',       cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 0,                    rating: 4.6, sales: 430,  seller: '데이터핀',               desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.' },
  { id: 7,  title: '감성 일러스트 캐릭터 시트',       cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 4500,                 rating: 4.8, sales: 870,  seller: '비주얼랩',               desc: '일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.' },
  { id: 8,  title: '유튜브 스크립트 후킹 오프닝',     cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 0,                    rating: 4.7, sales: 1520, seller: '카피킷',    badge: '신규',   desc: '첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다.' },
  { id: 9,  title: 'A/B 테스트 광고 카피 생성기',    cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 4200,                 rating: 4.6, sales: 780,  seller: '그로스하우스',           desc: '동일 메시지를 다른 톤으로 변형해 A/B 테스트용 카피 세트를 빠르게 만들어 줍니다.' },
  { id: 10, title: '코드 리뷰 자동화 봇',            cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 8900,                 rating: 4.9, sales: 310,  seller: '데브플로우',             desc: 'PR 코드를 붙여넣으면 보안·가독성·성능 관점에서 리뷰 코멘트를 생성합니다.' },
  { id: 11, title: '여행 일정 플래너',               cat: 'chatbot',   icon: 'message-circle', model: 'GPT-4o',        price: 2900,                 rating: 4.5, sales: 1100, seller: '토크봇',                 desc: '도시, 일수, 예산을 입력하면 현지인 맞춤 여행 일정을 짜줍니다.' },
  { id: 12, title: '판매 데이터 주간 리포트',         cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 3500,                 rating: 4.7, sales: 290,  seller: '데이터핀',               desc: '주간 판매 데이터를 넣으면 KPI 요약과 다음 주 액션 아이템을 뽑아줍니다.' },
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
          <button
            onClick={onCart}
            title="장바구니 담기"
            style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-md)', background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
          >
            <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-text-muted)' } as React.CSSProperties} />
          </button>
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
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('인기순');

  const clearQuery = () => router.push('/browse');

  let list = cat === 'all' ? PROMPTS : PROMPTS.filter((p) => p.cat === cat);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((p) => {
      const catLabel = (CATEGORIES.find((c) => c.id === p.cat) || {}).label || '';
      return [p.title, p.seller, p.model, catLabel].join(' ').toLowerCase().includes(q);
    });
  }
  list = [...list].sort((a, b) =>
    sort === '인기순' ? b.sales - a.sales : sort === '평점순' ? b.rating - a.rating : a.price - b.price
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>프롬프트 탐색</h1>
      <p style={{ color: 'var(--ph-text-secondary)', fontSize: 16, margin: '0 0 28px' }}>
        {query ? <span>'{query}' 검색 결과 · </span> : null}{list.length}개의 프롬프트
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {CATEGORIES.map((c) => (
          <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Tag>
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
