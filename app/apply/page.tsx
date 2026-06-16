'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Store, Send, SearchCheck, Check, Clock,
  Link as LinkIcon, BadgePercent, Lock,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

type Category = { id: string; label: string };

/* ── Data ───────────────────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  { id: 'image',     label: '이미지 생성' },
  { id: 'writing',   label: '글쓰기'      },
  { id: 'coding',    label: '코딩'        },
  { id: 'marketing', label: '마케팅'      },
  { id: 'chatbot',   label: '챗봇'        },
  { id: 'data',      label: '데이터 분석' },
];

/* ── Avatar ──────────────────────────────────────────────────────────── */

function Avatar({ name = '', size = 40 }: { name?: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--ph-radius-full)',
        overflow: 'hidden',
        backgroundColor: 'var(--ph-secondary)',
        color: 'var(--ph-primary)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--ph-font-family)',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        flexShrink: 0,
      }}
    >
      {initials || '?'}
    </div>
  );
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
      ? { background: hovered ? 'var(--ph-blue-hover)' : 'var(--ph-primary)', color: '#fff', border: '1px solid transparent', borderRadius: 'var(--ph-radius-md)' }
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'none',
        transition: 'background-color .15s ease, opacity .15s ease',
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
  leading,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
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

/* ── Label ───────────────────────────────────────────────────────────── */

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)' }}>{children}</span>
      {hint && <span style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{hint}</span>}
    </div>
  );
}

/* ── SellerApplyPage ─────────────────────────────────────────────────── */

const STEPS = [
  { Icon: Send,        t: '요청 접수',   d: '신청서가 관리자에게 전달돼요.' },
  { Icon: SearchCheck, t: '관리자 검토', d: '보통 1~2 영업일 내에 확인해요.' },
  { Icon: Store,       t: '판매자 전환', d: '승인되면 바로 프롬프트를 등록할 수 있어요.' },
];

export default function ApplyPage() {
  const router = useRouter();

  // 프로토타입: 실제 인증 상태 대신 간단히 null로 처리
  const [user] = useState<{ name: string; email: string } | null>(null);

  const [picked, setPicked] = useState<string[]>([]);
  const [intro, setIntro] = useState('');
  const [link, setLink] = useState('');
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState(false);

  const name = user ? user.name : '';
  const email = user ? user.email : '';

  const togglePick = (id: string) =>
    setPicked((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s
    );

  const valid = picked.length > 0 && agree;

  const submit = () => {
    if (!valid) return;
    setDone(true);
    window.scrollTo({ top: 0 });
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

  /* ── 비로그인 게이트 ── */
  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '120px 32px', textAlign: 'center' }}>
        <span
          style={{
            width: 64, height: 64,
            borderRadius: 'var(--ph-radius-full)',
            background: 'var(--ph-secondary)',
            color: 'var(--ph-primary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Lock style={{ width: 28, height: 28 }} />
        </span>
        <h1 style={{ fontSize: 27, fontWeight: 700, margin: '24px 0 10px', letterSpacing: '-0.01em' }}>
          로그인이 필요해요
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '0 0 28px', lineHeight: 1.6 }}>
          판매자 등록은 로그인 계정의 이름·이메일로 신청해요. 먼저 로그인해 주세요.
        </p>
        <Button variant="solid" size="lg" onClick={() => router.push('/')}>로그인</Button>
      </div>
    );
  }

  /* ── 신청 완료 상태 ── */
  if (done) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '96px 32px 0', textAlign: 'center' }}>
        <span
          style={{
            width: 72, height: 72,
            borderRadius: 'var(--ph-radius-full)',
            background: 'var(--ph-secondary)',
            color: 'var(--ph-primary)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Check style={{ width: 34, height: 34 }} />
        </span>
        <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: '-0.015em', margin: '26px 0 12px' }}>
          등록 요청이 접수됐어요
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', lineHeight: 1.65, margin: '0 0 14px' }}>
          관리자 검토 후 <b style={{ color: 'var(--ph-text)' }}>{email || '등록하신 이메일'}</b>로 결과를 안내드릴게요.<br />
          보통 1~2 영업일이 걸려요.
        </p>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
            borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 30,
          }}
        >
          <Clock style={{ width: 14, height: 14 }} /> 검토 대기 중
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Button variant="solid" size="lg" onClick={() => router.push('/')}>홈으로</Button>
          <Button variant="secondary" size="lg" onClick={() => router.push('/browse')}>프롬프트 둘러보기</Button>
        </div>
      </div>
    );
  }

  /* ── 신청 폼 ── */
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px 0' }}>
      {/* 뒤로가기 */}
      <button
        onClick={() => router.push('/')}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)',
          fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 홈으로
      </button>

      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
            borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600, marginBottom: 14,
          }}
        >
          <Store style={{ width: 14, height: 14 }} /> 판매자 신청
        </div>
        <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>판매자 등록 요청</h1>
        <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>
          간단한 신청서를 보내면 관리자가 검토 후 판매자 권한을 드려요.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40, alignItems: 'start' }}>

        {/* ── 폼 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* 신청자 정보 + 카테고리 */}
          <Card padding="28px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <Label hint="로그인 정보에서 자동 입력">신청자 정보</Label>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                    background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)',
                    borderRadius: 'var(--ph-radius-md)',
                  }}
                >
                  <Avatar name={name} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ph-text)' }}>{name}</div>
                    <div
                      style={{
                        fontSize: 13.5, color: 'var(--ph-text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {email}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 600, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap',
                    }}
                  >
                    <Lock style={{ width: 13, height: 13 }} /> 로그인 정보
                  </span>
                </div>
              </div>

              <div>
                <Label hint={`${picked.length}/3`}>주력 카테고리</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORIES.map((c) => (
                    <Tag key={c.id} selected={picked.includes(c.id)} onClick={() => togglePick(c.id)}>
                      {c.label}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 판매 계획 소개 */}
          <Card padding="28px">
            <Label hint="선택">판매할 프롬프트 소개</Label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={5}
              placeholder={
                '어떤 프롬프트를 판매할 계획인지 알려주세요.\n예) 마케팅 카피·블로그 글쓰기용 GPT 프롬프트를 주로 만듭니다.'
              }
              style={taStyle}
            />
          </Card>

          {/* 포트폴리오 링크 */}
          <Card padding="28px">
            <Label hint="선택">포트폴리오 / 링크</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="블로그, 포트폴리오, SNS 주소"
              leading={<LinkIcon style={{ width: 16, height: 16, color: 'var(--ph-text-muted)' }} />}
            />
          </Card>

          {/* 약관 동의 */}
          <Card padding="20px 24px">
            <button
              onClick={() => setAgree(!agree)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', padding: 0, fontFamily: 'var(--ph-font-family)',
              }}
            >
              <span
                style={{
                  width: 22, height: 22, flexShrink: 0,
                  borderRadius: 'var(--ph-radius-sm)',
                  border: agree ? 'none' : '1.5px solid var(--ph-gray-line)',
                  background: agree ? 'var(--ph-primary)' : '#fff',
                  color: '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .15s ease',
                }}
              >
                {agree && <Check style={{ width: 14, height: 14 }} />}
              </span>
              <span style={{ fontSize: 14, color: 'var(--ph-text)' }}>
                판매자 이용약관과 정산 정책(수수료 15%)에 동의합니다.
              </span>
            </button>
          </Card>

          {/* 제출 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="lg" onClick={() => router.push('/')}>취소</Button>
              <Button variant="solid" size="lg" onClick={submit} disabled={!valid}>등록 요청 보내기</Button>
            </div>
          </div>
        </div>

        {/* ── 사이드: 진행 안내 ── */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding="24px">
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>어떻게 진행되나요</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {STEPS.map(({ Icon, t, d }, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      width: 38, height: 38, flexShrink: 0,
                      borderRadius: 'var(--ph-radius-lg)',
                      background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ width: 18, height: 18 }} />
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t}</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', lineHeight: 1.5, marginTop: 2 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="20px 24px" style={{ background: 'var(--ph-secondary)', border: 'none' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <BadgePercent style={{ width: 18, height: 18, color: 'var(--ph-primary)', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ph-text-secondary)' }}>
                등록은 <b style={{ color: 'var(--ph-text)' }}>무료</b>예요. 판매가 발생할 때만{' '}
                <b style={{ color: 'var(--ph-text)' }}>수수료 15%</b>가 적용돼요.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}
