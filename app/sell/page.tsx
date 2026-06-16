'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Store, Eye, Images, Check, CheckCircle2, X, Star,
  LucideImage, PenLine, CodeXml, Megaphone, MessageCircle, BarChart3,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Category = { id: string; label: string; icon: string };

/* ── Data ───────────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: 'image',     label: '이미지 생성', icon: 'image'          },
  { id: 'writing',   label: '글쓰기',      icon: 'pen-line'       },
  { id: 'coding',    label: '코딩',        icon: 'code-xml'       },
  { id: 'marketing', label: '마케팅',      icon: 'megaphone'      },
  { id: 'chatbot',   label: '챗봇',        icon: 'message-circle' },
  { id: 'data',      label: '데이터 분석', icon: 'bar-chart-3'    },
];

/* ── Icon map ────────────────────────────────────────────────────────── */

type IconName = 'image' | 'pen-line' | 'code-xml' | 'megaphone' | 'message-circle' | 'bar-chart-3';

const ICON_MAP: Record<IconName, React.ComponentType<{ style?: React.CSSProperties }>> = {
  'image':          LucideImage,
  'pen-line':       PenLine,
  'code-xml':       CodeXml,
  'megaphone':      Megaphone,
  'message-circle': MessageCircle,
  'bar-chart-3':    BarChart3,
};

function CatIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name as IconName];
  return C ? <C style={style} /> : null;
}

/* ── Button ─────────────────────────────────────────────────────────── */

function Button({
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
}: {
  variant?: 'solid' | 'secondary';
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
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
      ? { background: disabled ? 'var(--ph-primary)' : hovered ? 'var(--ph-blue-hover)' : 'var(--ph-primary)', color: '#fff', border: '1px solid transparent', borderRadius: 'var(--ph-radius-md)' }
      : { background: hovered ? 'var(--ph-gray-100)' : 'transparent', color: 'var(--ph-text)', border: '1px solid var(--ph-text)', borderRadius: 'var(--ph-radius-sm)' };

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
        letterSpacing: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textDecoration: 'none',
        boxShadow: 'none',
        width: fullWidth ? '100%' : undefined,
        transition: 'background-color .15s ease, color .15s ease, opacity .15s ease',
        opacity: disabled ? 0.4 : 1,
        boxSizing: 'border-box',
        ...sizes[size],
        ...variantStyle,
        ...style,
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

/* ── ImageSlot ───────────────────────────────────────────────────────── */

function ImageSlot({
  placeholder,
  height,
  thumbnailUrl,
}: {
  placeholder: string;
  height: number;
  thumbnailUrl?: string | null;
}) {
  const [file, setFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(URL.createObjectURL(f));
  };

  const src = file ?? (thumbnailUrl ?? null);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px dashed var(--ph-border)',
        borderRadius: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--ph-gray-50)',
        transition: 'border-color .15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ph-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ph-border)'; }}
    >
      {src ? (
        <Image src={src} alt="업로드 이미지" fill style={{ objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', textAlign: 'center', padding: '0 8px', userSelect: 'none' }}>
          {placeholder}
        </span>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />
    </div>
  );
}

/* ── won ─────────────────────────────────────────────────────────────── */

function won(n: number | string) {
  return '₩' + Number(n || 0).toLocaleString('ko-KR');
}

/* ── Toast ───────────────────────────────────────────────────────────── */

function Toast({ message }: { message: string }) {
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: 32, transform: 'translateX(-50%)', zIndex: 90, background: 'var(--ph-text)', color: '#fff', padding: '13px 22px', borderRadius: 'var(--ph-radius-full)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
      <CheckCircle2 style={{ width: 17, height: 17 }} />{message}
    </div>
  );
}

/* ── SellScreen ──────────────────────────────────────────────────────── */

export default function SellPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('writing');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<null | 'saved' | 'submitted'>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const catObj = CATEGORIES.find((c) => c.id === cat) || CATEGORIES[0];

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    const v = tagInput.trim().replace(/^#/, '');
    if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
    setTagInput('');
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const submit = () => {
    if (!title.trim()) { showToast('프롬프트 제목을 입력해 주세요'); return; }
    setStatus('submitted');
    showToast('검수 요청이 접수됐어요 · 관리자 승인 후 판매가 시작돼요');
    router.push('/shop');
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

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 0' }}>
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
            <Store style={{ width: 14, height: 14 }} /> 판매자 · 프롬프트 등록
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>새 프롬프트 등록</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>판매 수수료는 단 15%. 나머지는 모두 판매자의 몫이에요.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'start' }}>

        {/* ── 폼 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

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
              rows={9}
              placeholder={'실제 판매할 프롬프트 본문을 입력하세요.\n\n예) 당신은 전문 카피라이터입니다. 아래 제품 정보를 바탕으로...\n- 타깃:\n- 톤앤매너:\n- 출력 형식:'}
              style={taStyle}
            />
            <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye style={{ width: 14, height: 14 }} /> 입력한 내용은 오른쪽 미리보기에 실시간으로 반영돼요.
            </p>
          </Card>

          {/* 태그 & 이미지 카드 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* 태그 */}
              <div>
                <Label hint={`${tags.length}/8`}>태그</Label>
                <form onSubmit={addTag} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="태그를 입력하고 Enter (예: 카피라이팅)"
                      leading={<span style={{ fontWeight: 700, color: 'var(--ph-text-muted)' }}>#</span>}
                    />
                  </div>
                  <Button variant="secondary" size="sm" type="submit">추가</Button>
                </form>
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {tags.map((t) => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 8px 6px 12px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600 }}>
                        #{t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          aria-label="태그 삭제"
                          style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-primary)', padding: 0 }}
                        >
                          <X style={{ width: 14, height: 14 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 대표 썸네일 */}
              <div>
                <Label hint="권장 4:3 · 최대 5MB">대표 썸네일</Label>
                <ImageSlot placeholder="썸네일을 드래그하거나 클릭해 업로드" height={220} />
              </div>

              {/* 소개 이미지 */}
              <div>
                <Label hint="최대 5장">소개 이미지</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <ImageSlot key={k} placeholder="+ 추가" height={96} />
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Images style={{ width: 14, height: 14 }} /> 예시 결과·사용법 이미지를 추가하면, 구매자가 상세 페이지에서 넘겨보며 확인할 수 있어요.
                </p>
              </div>
            </div>
          </Card>

          {/* 제출 버튼 영역 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            {status === 'saved' && (
              <span style={{ color: 'var(--ph-text-secondary)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> 임시저장됐어요
              </span>
            )}
            {status === 'submitted' && (
              <span style={{ color: 'var(--ph-primary)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} /> 등록 검토 요청이 접수됐어요
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" onClick={() => setStatus('saved')}>임시저장</Button>
              <Button variant="solid" size="lg" onClick={submit}>등록하기</Button>
            </div>
          </div>
        </div>

        {/* ── 라이브 미리보기 ── */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ph-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye style={{ width: 15, height: 15 }} /> 미리보기
          </div>

          {/* 프롬프트 카드 미리보기 */}
          <Card padding="14px" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
              <CatIcon name={catObj.icon} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>{model || '모델 미정'}</Badge>
              <Badge tone="blue" style={{ whiteSpace: 'nowrap' }}>{catObj.label}</Badge>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: title ? 'var(--ph-text)' : 'var(--ph-text-muted)' }}>
              {title || '프롬프트 제목이 여기에 표시돼요'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-text-muted)', fontSize: 13 }}>
              <Star style={{ width: 14, height: 14, fill: 'var(--ph-primary)', color: 'var(--ph-primary)' } as React.CSSProperties} />
              <span style={{ color: 'var(--ph-text)', fontWeight: 600 }}>신규</span>
              <span>·</span>
              <span>내 상점</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{price ? won(price) : '₩ —'}</span>
              <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>0회 판매</span>
            </div>
          </Card>

          {/* 내용 미리보기 */}
          <Card padding="16px">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>프롬프트 내용</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: body ? 'var(--ph-text-secondary)' : 'var(--ph-text-muted)', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', fontFamily: 'var(--ph-font-family)' }}>
              {body || '내용을 입력하면 이곳에서 실제 표시 형태를 확인할 수 있어요.'}
            </div>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {tags.map((t) => <span key={t} style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>#{t}</span>)}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div style={{ height: 80 }} />

      {toast && <Toast message={toast} />}
    </div>
  );
}
