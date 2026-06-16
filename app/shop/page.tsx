'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

const PROMPTS: Prompt[] = [
  { id: 1,  title: '사진 같은 제품 목업 생성기',    cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 5900, rating: 4.9, sales: 1240, seller: '비주얼랩',    badge: '신규',   desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다.' },
  { id: 2,  title: '전환율 높이는 랜딩 카피 작성',   cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 4900, rating: 4.8, sales: 980,  seller: '카피킷',     badge: '베스트', desc: '후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다.' },
  { id: 3,  title: '리액트 컴포넌트 리팩터링 도우미', cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 7900, rating: 5.0, sales: 612,  seller: '데브플로우',              desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다.' },
  { id: 4,  title: '30일 SNS 콘텐츠 캘린더',       cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 3900, rating: 4.7, sales: 2310, seller: '그로스하우스',  badge: '베스트', desc: '브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다.' },
  { id: 5,  title: '친절한 CS 챗봇 페르소나',       cat: 'chatbot',   icon: 'message-circle', model: 'Claude 3.5',    price: 6900, rating: 4.9, sales: 540,  seller: '토크봇',                  desc: '고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트.' },
  { id: 6,  title: '엑셀 데이터 인사이트 요약',      cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 0,    rating: 4.6, sales: 430,  seller: '데이터핀',                desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.' },
  { id: 7,  title: '감성 일러스트 캐릭터 시트',      cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 4500, rating: 4.8, sales: 870,  seller: '비주얼랩',                desc: '일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.' },
  { id: 8,  title: '유튜브 스크립트 후킹 오프닝',    cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 3500, rating: 4.7, sales: 1520, seller: '카피킷',     badge: '신규',   desc: '첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다.' },
];

const MY_LISTINGS: Prompt[] = [...PROMPTS]
  .sort((a, b) => (b.sales as number) - (a.sales as number))
  .slice(0, 4);

/* ── Stats ─────────────────────────────────────────────────────────── */

const STATS = [
  { label: '등록 프롬프트', value: '8개',       icon: Layers      },
  { label: '누적 판매',     value: '5,360회',   icon: ShoppingBag },
  { label: '이번 달 수익',  value: '₩2,840,000', icon: Wallet      },
];

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

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = (id: string | number) => { setStopped((s) => ({ ...s, [id]: true })); setConfirmId(null); };

  const activeCount = MY_LISTINGS.filter((p) => !isStopped(p.id) && p.status !== 'review').length;
  const reviewCount = MY_LISTINGS.filter((p) => p.status === 'review').length;

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
        {STATS.map(({ label, value, icon: Icon }) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {MY_LISTINGS.map((p) => {
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
