'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import {
  ArrowLeft, CalendarCheck, FileText, Lock, Download,
  AlertTriangle, CheckCircle2, MessageCircle,
  Sparkles, Image as LucideImage, PenLine, CodeXml,
  Megaphone, BarChart3,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: number | string;
  title: string;
  category: string;
  icon: string;
  model: string;
  amount: number;
  rating: number | string;
  salesCount: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  purchasedAt?: string;
};

type FormatKey = 'txt' | 'md' | 'pdf';

/* ── Categories ─────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'image',     label: '이미지 생성' },
  { id: 'writing',   label: '글쓰기·카피' },
  { id: 'coding',    label: '코딩·개발' },
  { id: 'marketing', label: '마케팅·광고' },
  { id: 'chatbot',   label: '챗봇·대화' },
  { id: 'data',      label: '데이터 분석' },
];

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

/* ── Prompt text builder ────────────────────────────────────────────── */

const ROLE_BY_CAT: Record<string, string> = {
  image:     '전문 비주얼 디렉터',
  writing:   '전문 카피라이터',
  coding:    '시니어 소프트웨어 엔지니어',
  marketing: '데이터 기반 그로스 마케터',
  chatbot:   'CS 챗봇 설계자',
  data:      '데이터 분석가',
};

function buildPromptText(p: Prompt): string {
  const catLabel = (CATEGORIES.find((c) => c.id === p.category) || { label: '일반' }).label;
  const role = ROLE_BY_CAT[p.category] || '전문가';
  return [
    `당신은 ${role}입니다. 아래 지침에 따라 "${p.title}" 작업을 수행하세요.`,
    ``,
    `[목표]`,
    p.desc,
    ``,
    `[입력 정보]`,
    `- 주제 / 대상: {{여기에 작업 대상을 입력하세요}}`,
    `- 톤앤매너: {{예: 신뢰감 있고 간결하게}}`,
    `- 추가 제약: {{선택 사항}}`,
    ``,
    `[작업 단계]`,
    `1. 입력 정보를 분석해 핵심 요구사항을 3가지로 요약합니다.`,
    `2. ${catLabel} 관점에서 최적의 결과를 ${p.model} 기준으로 생성합니다.`,
    `3. 결과를 바로 사용할 수 있는 형태로 정리하고, 대안 1가지를 함께 제안합니다.`,
    ``,
    `[출력 형식]`,
    `- 핵심 결과: 가장 먼저, 군더더기 없이`,
    `- 대안 제안: 한 줄 요약 + 사용하면 좋은 상황`,
    `- 체크리스트: 결과를 검수할 때 확인할 항목 3가지`,
    ``,
    `[주의사항]`,
    `- 추측이 필요한 부분은 가정한 내용을 명시하세요.`,
    `- 사실 확인이 필요한 수치는 임의로 만들지 마세요.`,
  ].join('\n');
}

/* ── Avatar ──────────────────────────────────────────────────────────── */

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 'var(--ph-radius-full)',
      backgroundColor: 'var(--ph-secondary)',
      color: 'var(--ph-primary)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--ph-font-family)',
      fontWeight: 700,
      fontSize: Math.round(size * 0.4),
      flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

/* ── Badge ───────────────────────────────────────────────────────────── */

function Badge({ tone = 'blue', children }: { tone?: 'blue' | 'neutral'; children: React.ReactNode }) {
  const colors = {
    blue:    { bg: 'var(--ph-secondary)', fg: 'var(--ph-primary)' },
    neutral: { bg: 'var(--ph-gray-100)', fg: 'var(--ph-gray-600)' },
  };
  const c = colors[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      backgroundColor: c.bg, color: c.fg,
      fontFamily: 'var(--ph-font-family)',
      fontSize: 13, fontWeight: 600, lineHeight: 1,
      padding: '5px 9px', borderRadius: 'var(--ph-radius-full)',
    }}>
      {children}
    </span>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */

function Card({ children, padding = '16px', style }: { children: React.ReactNode; padding?: string; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: 'var(--ph-surface)',
      border: '1px solid var(--ph-border)',
      borderRadius: 'var(--ph-radius-lg)',
      padding,
      boxSizing: 'border-box',
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */

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

/* ── StarRate ────────────────────────────────────────────────────────── */

function StarRate({ value, onRate, size = 34 }: { value: number; onRate: (n: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div style={{ display: 'flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= active;
        return (
          <button
            key={n}
            onClick={() => onRate(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n}점`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0 }}
          >
            <svg
              width={size} height={size} viewBox="0 0 24 24"
              fill={on ? 'var(--ph-primary)' : 'none'}
              stroke={on ? 'var(--ph-primary)' : 'var(--ph-gray-line)'}
              strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
              style={{ transition: 'fill .12s ease, stroke .12s ease' }}
            >
              <path d="M12 2.6l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 18.6l-5.91 3.11 1.13-6.57L2.45 9.54l6.6-.96z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────── */

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--ph-black)', color: '#fff',
      padding: '12px 22px', borderRadius: 'var(--ph-radius-full)',
      fontSize: 14, fontWeight: 600, zIndex: 9999,
      whiteSpace: 'nowrap', pointerEvents: 'none',
      fontFamily: 'var(--ph-font-family)',
    }}>
      {message}
    </div>
  );
}

/* ── ConfirmDialog ───────────────────────────────────────────────────── */

function ConfirmDialog({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
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
          background: 'var(--ph-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle style={{ width: 22, height: 22, color: 'var(--ph-primary)' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 24px' }}>
          {body}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>취소</Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="solid" size="lg" fullWidth onClick={onConfirm}>다운로드 진행</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [p, setP] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fmt, setFmt] = useState<FormatKey>('txt');
  const [myRating, setMyRating] = useState(0);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!id) { router.push('/mypage'); return; }
    api.get('/api/v1/orders')
      .then((res) => {
        const orders: { orderId: string; purchasedAt: string; product: Prompt | null }[] = res.data.data ?? [];
        const found = orders.find((o) => o.product && String(o.product.id) === String(id));
        if (!found?.product) {
          router.push('/mypage');
          return;
        }
        setP({ ...found.product, purchasedAt: found.purchasedAt });
      })
      .catch(() => router.push('/mypage'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ph-font-family)', color: 'var(--ph-text-muted)', fontSize: 16 }}>
        불러오는 중...
      </div>
    );
  }

  if (!p) return null;

  const text = buildPromptText(p);
  const safeName = (p.title || 'prompt').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'prompt';
  const dateStr = new Date(p.purchasedAt || Date.now()).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const catLabel = (CATEGORIES.find((c) => c.id === p.category) || { label: '일반' }).label;

  const showToast = (msg: string) => { setToast(msg); };

  const escapeHtml = (s: string) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const triggerBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const fmtLabel: Record<FormatKey, string> = { txt: '.txt', md: '.md', pdf: '.pdf' };

  const doDownload = (format: FormatKey) => {
    if (format === 'pdf') {
      const w = window.open('', '_blank');
      if (!w) { showToast('팝업이 차단되어 PDF를 열 수 없어요'); return; }
      w.document.write(
        '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>' +
        escapeHtml(p.title) +
        '</title><style>@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");body{font-family:Pretendard,system-ui,sans-serif;padding:48px;color:#111;}h1{font-size:22px;margin:0 0 20px;}pre{white-space:pre-wrap;word-break:break-word;font-family:Pretendard,system-ui,sans-serif;font-size:14px;line-height:1.7;margin:0;}</style></head><body><h1>' +
        escapeHtml(p.title) +
        '</h1><pre>' +
        escapeHtml(text) +
        '</pre><scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},300);};</scr' + 'ipt></body></html>'
      );
      w.document.close();
      showToast('PDF 인쇄 창을 열었어요');
      return;
    }
    const content = format === 'md' ? ('# ' + p.title + '\n\n' + text) : text;
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    triggerBlob(new Blob([content], { type: mime + ';charset=utf-8' }), safeName + '.' + format);
    showToast(fmtLabel[format] + ' 파일을 다운로드했어요');
  };

  const confirmDownload = () => {
    setConfirmOpen(false);
    setDownloaded(true);
  };

  const backLink = (
    <button
      onClick={() => router.push('/mypage')}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--ph-text-secondary)',
        fontFamily: 'var(--ph-font-family)',
        fontSize: 14, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0,
      }}
    >
      <ArrowLeft style={{ width: 16, height: 16 }} />
      다른 구매 프롬프트 보기
    </button>
  );

  const Icon = ICON_MAP[p.icon] ?? Sparkles;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-background)', fontFamily: 'var(--ph-font-family)' }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--ph-surface)',
        borderBottom: '1px solid var(--ph-border)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 18, fontWeight: 700, fontFamily: 'var(--ph-font-family)', color: 'var(--ph-text)' }}
          >
            PromptHub
          </button>
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 32px 80px' }}>
        {/* Back link */}
        <div style={{ marginBottom: 22 }}>{backLink}</div>

        {/* Header badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Badge tone="blue">{catLabel}</Badge>
          <Badge tone="neutral">{p.model}</Badge>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 13, fontWeight: 600, color: 'var(--ph-primary)',
          }}>
            <CheckCircle2 style={{ width: 15, height: 15 }} /> 구매 완료
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.015em',
          margin: 0, lineHeight: 1.3,
        }}>
          {p.title}
        </h1>

        {/* Purchase date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--ph-text-muted)', fontSize: 14 }}>
          <CalendarCheck style={{ width: 15, height: 15 }} /> 구매일 {dateStr}
        </div>

        {/* Prompt text card */}
        <Card padding="0" style={{ marginTop: 28, overflow: 'hidden' }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '16px 20px', borderBottom: '1px solid var(--ph-border)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText style={{ width: 17, height: 17, color: 'var(--ph-primary)' }} />
              프롬프트 전문
            </div>

            {downloaded ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={fmt}
                  onChange={(e) => setFmt(e.target.value as FormatKey)}
                  aria-label="파일 형식"
                  style={{
                    height: 34, padding: '0 30px 0 12px',
                    borderRadius: 'var(--ph-radius-sm)',
                    border: '1px solid var(--ph-border)',
                    background: '#fff',
                    fontFamily: 'var(--ph-font-family)',
                    fontSize: 14, fontWeight: 600,
                    color: 'var(--ph-text)',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B95A1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                  }}
                >
                  <option value="txt">.txt</option>
                  <option value="md">.md</option>
                  <option value="pdf">.pdf</option>
                </select>
                <Button variant="solid" size="sm" onClick={() => doDownload(fmt)}>
                  <Download style={{ width: 15, height: 15 }} /> 다운로드
                </Button>
              </div>
            ) : (
              <Button variant="solid" size="sm" onClick={() => setConfirmOpen(true)}>
                <Download style={{ width: 15, height: 15 }} /> 다운로드
              </Button>
            )}
          </div>

          {/* Prompt text (blur until downloaded) */}
          <div style={{ position: 'relative' }}>
            <pre style={{
              margin: 0, padding: '22px 20px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 14, lineHeight: 1.7,
              color: 'var(--ph-text)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: 'var(--ph-gray-50)',
              filter: downloaded ? 'none' : 'blur(6px)',
              userSelect: downloaded ? 'auto' : 'none',
              transition: 'filter .25s ease',
              minHeight: downloaded ? 'auto' : 180,
            }}>
              {text}
            </pre>
            {!downloaded && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, textAlign: 'center', padding: 20,
              }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 'var(--ph-radius-full)',
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid var(--ph-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock style={{ width: 20, height: 20, color: 'var(--ph-text-secondary)' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>
                  다운로드하면 프롬프트 전문을 확인할 수 있어요
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Star rating card */}
        <Card padding="22px 24px" style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>이 프롬프트를 평가해 주세요</div>
              <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 4 }}>
                {myRating
                  ? `내 별점 ${myRating}.0 · 다시 누르면 변경돼요`
                  : '별점을 남기면 다른 구매자에게 도움이 돼요'}
              </div>
            </div>
            <StarRate value={myRating} onRate={setMyRating} />
          </div>
        </Card>

        {/* Seller info card */}
        <Card padding="22px 24px" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={p.seller} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{p.seller}</div>
              <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>
                판매자 · 별점 {p.rating}
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => showToast('판매자에게 문의를 보냈어요')}
              style={{ whiteSpace: 'nowrap' }}
            >
              <MessageCircle style={{ width: 16, height: 16 }} /> 문의하기
            </Button>
          </div>
        </Card>

        {/* Prompt thumbnail */}
        {p.thumbnail_url && (
          <Card padding="0" style={{ marginTop: 20, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 240 }}>
              <Image src={p.thumbnail_url} alt="썸네일" fill style={{ objectFit: 'cover' }} />
            </div>
          </Card>
        )}
        {!p.thumbnail_url && (
          <Card padding="22px 24px" style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: 'var(--ph-primary)', opacity: 0.5 }}>
              <Icon style={{ width: 48, height: 48 } as React.CSSProperties} />
            </div>
          </Card>
        )}

        {/* Bottom back link */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '36px 0 8px' }}>
          {backLink}
        </div>
      </div>

      {/* ── Download confirm dialog ──────────────────────────────────── */}
      {confirmOpen && (
        <ConfirmDialog
          title="다운로드 전 확인"
          body="다운로드 후에는 환불 처리가 불가합니다. 계속하시겠습니까?"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmDownload}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </div>
  );
}
