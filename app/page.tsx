'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShaderBackground from '@/components/ui/shader-background';
import PromptCard from '@/components/ui/PromptCard';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { ICON_MAP } from '@/lib/iconMap';
import { useAuthStore } from '@/store/useAuthStore';
import Card from '@/components/ui/Card';
import { PRODUCT_TYPES } from '@/lib/productTypes';

/* ── Mock Data ─────────────────────────────────────────────────────── */

const PRODUCT_TYPE_DESC: Record<string, string> = {
  PROMPT: '어떤 AI 모델에도 바로 쓰는 프롬프트',
  NOTION: '정리된 업무·학습용 노션 템플릿',
  PPT: '발표 바로 가능한 프레젠테이션 템플릿',
  EXCEL: '즉시 활용하는 스프레드시트·데이터 양식',
};

const TAGS = [
  { label: 'ChatGPT',     q: 'GPT-4o' },
  { label: 'Midjourney',  q: 'Midjourney' },
  { label: 'Claude',      q: 'Claude' },
  { label: '블로그 글쓰기', q: '글쓰기' },
  { label: '제품 사진',    q: '이미지' },
  { label: 'SNS 마케팅',  q: '마케팅' },
];

type Prompt = {
  id: string; title: string; icon: string; model: string;
  amount: number; originalAmount?: number; rating: number; salesCount: number;
  seller: string; badge?: string; desc: string;
};


function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : null;
}

/* ── Shared UI pieces ────────────────────────────────────────────── */

function Badge({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px',
      background: dark ? 'rgba(255,255,255,0.12)' : 'var(--ph-secondary)',
      color: dark ? 'rgba(255,255,255,0.9)' : 'var(--ph-primary)',
      borderRadius: 'var(--ph-radius-full)', fontSize: 14, fontWeight: 600,
      border: dark ? '1px solid rgba(255,255,255,0.18)' : 'none',
    }}>
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

function PopularTags({ onPick, dark }: { onPick: (q: string) => void; dark?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.55)' : 'var(--ph-text-muted)', marginRight: 2 }}>인기 검색</span>
      {TAGS.map((t) => (
        <button
          key={t.label}
          onClick={() => onPick(t.q)}
          style={{
            fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600, lineHeight: 1,
            padding: '8px 14px', borderRadius: 'var(--ph-radius-full)', cursor: 'pointer',
            background: dark ? 'rgba(255,255,255,0.08)' : 'var(--ph-white)',
            color: dark ? 'rgba(255,255,255,0.8)' : 'var(--ph-text-secondary)',
            border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--ph-border)',
            transition: 'border-color .15s ease, color .15s ease, background .15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.6)' : 'var(--ph-primary)';
            e.currentTarget.style.color = dark ? '#ffffff' : 'var(--ph-primary)';
            if (dark) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.2)' : 'var(--ph-border)';
            e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.8)' : 'var(--ph-text-secondary)';
            if (dark) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
        >{t.label}</button>
      ))}
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
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <ShaderBackground />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 940, margin: '0 auto', padding: '96px 32px 88px', textAlign: 'center' }}>
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
  const router = useRouter();
  const [featured, setFeatured] = useState<Prompt[]>([]);

  useEffect(() => {
    api.get(`${API_BASE}/products`, { params: { sort: 'popular', size: '8', productType: 'PROMPT' } })
      .then((res) => setFeatured(res.data.data ?? []))
      .catch(() => {});
  }, []);

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '84px 32px 0' }}>
      <SectionHead
        title="이번 주 인기 프롬프트"
        sub="가장 많이 팔린 프롬프트를 만나보세요"
        actionLabel="전체 보기 →"
        onAction={() => router.push('/browse')}
      />
      <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        {featured.map((p) => (
          <PromptCard key={p.id} p={p} showActions onOpen={(item) => router.push('/detail/' + item.id)} />
        ))}
      </div>
    </section>
  );
}

/* ── Product Type Section ─────────────────────────────────────────── */

function ProductTypeSection({ onPick }: { onPick: (id: string) => void }) {
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '96px 32px 0' }}>
      <SectionHead title="상품 유형별로 찾아보기" sub="필요한 형태에 맞는 상품을 골라보세요" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {PRODUCT_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 22px', background: 'var(--ph-white)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-xl)', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', textAlign: 'left', transition: 'border-color .15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ph-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ph-border)'; }}
          >
            <span style={{ width: 52, height: 52, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="sparkles" style={{ width: 24, height: 24 }} />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: 'var(--ph-text)' }}>{t.label}</span>
              <span style={{ display: 'block', fontSize: 14, color: 'var(--ph-text-muted)', marginTop: 3 }}>{PRODUCT_TYPE_DESC[t.id]}</span>
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
    router.push(authUser?.roles?.includes('seller') ? '/shop' : '/apply');
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
    router.push(`/browse?q=${encodeURIComponent(q)}`);
  };

  return (
    <div>
      <HeroToss query={query} onChange={setQuery} onSearch={onSearch} />
      <PopularGrid />
      <ProductTypeSection onPick={(id) => router.push(`/browse?productType=${id}`)} />
      <WhySection />
      <SellerCTA />
      <div style={{ height: 120 }} />
    </div>
  );
}
