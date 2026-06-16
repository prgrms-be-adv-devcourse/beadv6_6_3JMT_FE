'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Pencil, ArrowRight, History,
  AlertCircle, CheckCircle2,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Category = { id: string; label: string; icon: string };

type Version = { ver: string; date: string; note: string };

type Prompt = {
  id: number;
  title: string;
  cat: string;
  icon: string;
  model: string;
  price: number;
  rating: number;
  sales: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
};

/* ── Data ───────────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: 'image',     label: '이미지 생성', icon: 'image'          },
  { id: 'writing',   label: '글쓰기',      icon: 'pen-line'       },
  { id: 'coding',    label: '코딩',        icon: 'code-xml'       },
  { id: 'marketing', label: '마케팅',      icon: 'megaphone'      },
  { id: 'chatbot',   label: '챗봇',        icon: 'message-circle' },
  { id: 'data',      label: '데이터 분석', icon: 'bar-chart-3'    },
];

const PROMPTS: Prompt[] = [
  { id: 1,  title: '사진 같은 제품 목업 생성기',     cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 5900, rating: 4.9, sales: 1240, seller: '비주얼랩',   badge: '신규',   desc: '제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다.', thumbnail_url: null },
  { id: 2,  title: '전환율 높이는 랜딩 카피 작성',    cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 4900, rating: 4.8, sales: 980,  seller: '카피킷',    badge: '베스트', desc: '후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다.', thumbnail_url: null },
  { id: 3,  title: '리액트 컴포넌트 리팩터링 도우미',  cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 7900, rating: 5.0, sales: 612,  seller: '데브플로우',             desc: '지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다.', thumbnail_url: null },
  { id: 4,  title: '30일 SNS 콘텐츠 캘린더',        cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 3900, rating: 4.7, sales: 2310, seller: '그로스하우스', badge: '베스트', desc: '브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다.', thumbnail_url: null },
  { id: 5,  title: '친절한 CS 챗봇 페르소나',        cat: 'chatbot',   icon: 'message-circle', model: 'Claude 3.5',    price: 6900, rating: 4.9, sales: 540,  seller: '토크봇',                 desc: '고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트.', thumbnail_url: null },
  { id: 6,  title: '엑셀 데이터 인사이트 요약',       cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 0,    rating: 4.6, sales: 430,  seller: '데이터핀',               desc: '표 데이터를 붙여넣으면 핵심 추세·이상치를 보고서 형태로 정리해 줍니다.', thumbnail_url: null },
  { id: 7,  title: '감성 일러스트 캐릭터 시트',       cat: 'image',     icon: 'image',          model: 'Midjourney v6', price: 4500, rating: 4.8, sales: 870,  seller: '비주얼랩',               desc: '일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트.', thumbnail_url: null },
  { id: 8,  title: '유튜브 스크립트 후킹 오프닝',     cat: 'writing',   icon: 'pen-line',       model: 'GPT-4o',        price: 0,    rating: 4.7, sales: 1520, seller: '카피킷',    badge: '신규',   desc: '첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다.', thumbnail_url: null },
  { id: 9,  title: 'A/B 테스트 광고 카피 생성기',    cat: 'marketing', icon: 'megaphone',      model: 'GPT-4o',        price: 4200, rating: 4.6, sales: 780,  seller: '그로스하우스',           desc: '동일 메시지를 다른 톤으로 변형해 A/B 테스트용 카피 세트를 빠르게 만들어 줍니다.', thumbnail_url: null },
  { id: 10, title: '코드 리뷰 자동화 봇',            cat: 'coding',    icon: 'code-xml',       model: 'Claude 3.5',    price: 8900, rating: 4.9, sales: 310,  seller: '데브플로우',             desc: 'PR 코드를 붙여넣으면 보안·가독성·성능 관점에서 리뷰 코멘트를 생성합니다.', thumbnail_url: null },
  { id: 11, title: '여행 일정 플래너',               cat: 'chatbot',   icon: 'message-circle', model: 'GPT-4o',        price: 2900, rating: 4.5, sales: 1100, seller: '토크봇',                 desc: '도시, 일수, 예산을 입력하면 현지인 맞춤 여행 일정을 짜줍니다.', thumbnail_url: null },
  { id: 12, title: '판매 데이터 주간 리포트',         cat: 'data',      icon: 'bar-chart-3',    model: 'GPT-4o',        price: 3500, rating: 4.7, sales: 290,  seller: '데이터핀',               desc: '주간 판매 데이터를 넣으면 KPI 요약과 다음 주 액션 아이템을 뽑아줍니다.', thumbnail_url: null },
];

/* seed version history shared across all prompts */
const SEED_VERSIONS: Version[] = [
  { ver: '1.2', date: '2026.06.15', note: '프롬프트 지시문 개선, 예시 3개 추가' },
  { ver: '1.1', date: '2026.03.28', note: '출력 형식 정리, 불필요한 문장 제거' },
  { ver: '1.0', date: '2026.01.12', note: '최초 등록' },
];

function nextVer(latest: string): string {
  const parts = String(latest || '1.0').split('.').map((n) => parseInt(n, 10) || 0);
  parts[parts.length - 1] += 1;
  return parts.join('.');
}

/* ── Button ─────────────────────────────────────────────────────────── */

function Button({
  variant = 'solid',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  children,
}: {
  variant?: 'solid' | 'secondary';
  size?: 'lg' | 'md' | 'sm';
  disabled?: boolean;
  type?: 'button' | 'submit';
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
      ? { background: disabled ? 'var(--ph-primary)' : hovered ? 'var(--ph-blue-hover)' : 'var(--ph-primary)', color: '#fff', border: '1px solid transparent', borderRadius: 'var(--ph-radius-md)' }
      : { background: hovered ? 'var(--ph-gray-100)' : 'transparent', color: 'var(--ph-text)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-sm)' };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'none',
        transition: 'background-color .15s ease',
        opacity: disabled ? 0.4 : 1,
        boxSizing: 'border-box',
        ...sizes[size],
        ...variantStyle,
      }}
    >
      {children}
    </button>
  );
}

/* ── Input ───────────────────────────────────────────────────────────── */

function Input({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  leading,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  leading?: React.ReactNode;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: `1px solid ${focus ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
        borderRadius: 'var(--ph-radius-md)',
        padding: '0 14px',
        background: 'var(--ph-surface)',
        transition: 'border-color .15s ease',
      }}
    >
      {leading && <span style={{ display: 'flex', color: 'var(--ph-text-muted)' }}>{leading}</span>}
      <input
        value={value}
        onChange={onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--ph-font-family)',
          fontSize: 15,
          color: 'var(--ph-text)',
          padding: '11px 0',
          minWidth: 0,
        }}
      />
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */

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
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Tag ─────────────────────────────────────────────────────────────── */

function Tag({
  selected = false,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--ph-font-family)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: 1,
        padding: '9px 14px',
        borderRadius: 'var(--ph-radius-full)',
        cursor: 'pointer',
        transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
        background: selected ? 'var(--ph-secondary)' : 'var(--ph-white)',
        color: selected ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
        border: `1px solid ${selected ? 'transparent' : 'var(--ph-border)'}`,
        boxShadow: 'none',
      }}
    >
      {children}
    </button>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────── */

function Badge({
  tone = 'blue',
  soft = true,
  children,
  style,
}: {
  tone?: 'blue' | 'neutral';
  soft?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const bg =
    tone === 'blue' && !soft ? 'var(--ph-primary)'
    : tone === 'blue' ? 'var(--ph-secondary)'
    : 'var(--ph-gray-100)';
  const fg =
    tone === 'blue' && !soft ? '#fff'
    : tone === 'blue' ? 'var(--ph-primary)'
    : 'var(--ph-gray-600)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: bg,
        color: fg,
        fontFamily: 'var(--ph-font-family)',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
        padding: '5px 9px',
        borderRadius: 'var(--ph-radius-full)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Label ───────────────────────────────────────────────────────────── */

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>{children}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{hint}</span>}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)', zIndex: 90, background: 'var(--ph-text)', color: '#fff', padding: '13px 22px', borderRadius: 'var(--ph-radius-full)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
      <CheckCircle2 style={{ width: 17, height: 17 }} />{message}
    </div>
  );
}

/* ── EditScreen ──────────────────────────────────────────────────────── */

function EditScreen({ prompt }: { prompt: Prompt }) {
  const router = useRouter();

  const [title, setTitle] = useState(prompt.title);
  const [cat, setCat] = useState(prompt.cat);
  const [model, setModel] = useState(prompt.model);
  const [price, setPrice] = useState(prompt.price === 0 ? '0' : String(prompt.price));
  const [body, setBody] = useState(prompt.desc);
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const versions = SEED_VERSIONS;
  const curVer = versions[0].ver;
  const nxtVer = nextVer(curVer);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const taStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--ph-border)',
    borderRadius: 'var(--ph-radius-md)',
    padding: '12px 14px',
    fontFamily: 'var(--ph-font-family)',
    fontSize: 15,
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    color: 'var(--ph-text)',
  };

  const save = () => {
    if (!note.trim()) {
      setNoteErr(true);
      showToast('업데이트 내용을 입력해 주세요');
      return;
    }
    showToast(`v${nxtVer} 새 버전으로 저장됐어요`);
    setTimeout(() => router.push('/shop'), 1200);
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 32px 0' }}>
      {/* 뒤로가기 */}
      <button
        onClick={() => router.push('/shop')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 내 상점으로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <Pencil style={{ width: 14, height: 14 }} /> 상품 수정
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>프롬프트 수정</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            저장하면{' '}
            <Badge tone="neutral">현재 v{curVer}</Badge>
            <ArrowRight style={{ width: 15, height: 15, color: 'var(--ph-text-muted)' }} />
            <Badge tone="blue" soft={false}>v{nxtVer}</Badge>
            {' '}새 버전으로 기록돼요.
          </p>
        </div>
      </div>

      {/* 폼 — 단일 컬럼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 기본 정보 카드 */}
        <Card padding="28px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <Label hint={`${title.length}/60`}>프롬프트 제목</Label>
              <Input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="예: 전환율 높이는 랜딩 카피 작성" />
            </div>
            <div>
              <Label>카테고리</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Tag>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <Label>대상 모델</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="예: GPT-4o" />
              </div>
              <div>
                <Label>가격</Label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  inputMode="numeric"
                  placeholder="4900"
                  leading={<span style={{ fontWeight: 700 }}>₩</span>}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 프롬프트 내용 카드 */}
        <Card padding="28px">
          <Label hint={`${body.length}자`}>프롬프트 내용</Label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="판매할 프롬프트 본문을 입력하세요."
            style={taStyle}
          />
        </Card>

        {/* 업데이트 내용 — 필수 */}
        <Card padding="28px" style={{ border: `1px solid ${noteErr ? 'var(--ph-error)' : 'var(--ph-border)'}` }}>
          <Label hint="필수">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <History style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} /> 업데이트 내용
            </span>
          </Label>
          <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '0 0 12px' }}>
            이번 수정에서 무엇이 바뀌었는지 적어 주세요. 구매자에게 버전 기록으로 표시돼요.
          </p>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setNoteErr(false); }}
            rows={3}
            placeholder="예: 프롬프트 지시문 개선, 예시 3개 추가"
            style={{ ...taStyle, borderColor: noteErr ? 'var(--ph-error)' : 'var(--ph-border)' }}
          />
          {noteErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--ph-error)' }}>
              <AlertCircle style={{ width: 15, height: 15 }} /> 업데이트 내용은 필수예요
            </div>
          )}
        </Card>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <Button variant="secondary" size="lg" onClick={() => router.push('/shop')}>취소</Button>
            <Button variant="solid" size="lg" disabled={!title.trim()} onClick={save}>새 버전으로 저장</Button>
          </div>
        </div>
      </div>

      <div style={{ height: 80 }} />

      {toast && <Toast message={toast} />}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function EditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const prompt = PROMPTS.find((x) => x.id === id);

  if (!prompt) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>프롬프트를 찾을 수 없어요.</p>
        <button
          onClick={() => router.push('/shop')}
          style={{ background: 'var(--ph-primary)', color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)', padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
        >
          내 상점으로 돌아가기
        </button>
      </div>
    );
  }

  return <EditScreen prompt={prompt} />;
}
