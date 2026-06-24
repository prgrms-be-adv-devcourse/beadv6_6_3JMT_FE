'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/store/useToastStore';
import api from '@/lib/api';
import EmailChangeModal from '@/components/modals/EmailChangeModal';
import Image from 'next/image';
import {
  User, ShoppingBag, Heart, Receipt, Settings, LogOut, Store,
  AlertCircle, ArrowLeft, Lock, AlertTriangle, Star, Check, Mail,
  ShieldCheck, Info,
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import PaymentTable from '@/components/ui/PaymentTable';
import { won } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/modals/ConfirmDialog';

/* ── Types ─────────────────────────────────────────────────────────── */

type TabId = 'profile' | 'purchased' | 'wishlist' | 'payments' | 'settings';
type PaymentStatus = 'paid' | 'requested' | 'refunded';

type Prompt = {
  id: string;
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

type UserInfo = {
  name: string;
  email: string;
  role: 'buyer' | 'seller';
  provider: 'local' | 'kakao';
};

type NotifState = { email: boolean; marketing: boolean; newPrompt: boolean };



/* ── Switch ─────────────────────────────────────────────────────────── */

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        width: 46, height: 27, borderRadius: 9999, border: 'none', cursor: 'pointer',
        background: on ? 'var(--ph-primary)' : 'var(--ph-gray-line)',
        position: 'relative', transition: 'background .15s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21,
        borderRadius: '50%', background: '#fff', transition: 'left .15s',
      }} />
    </button>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────── */

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 0',
      borderBottom: last ? 'none' : '1px solid var(--ph-border)',
    }}>
      {children}
    </div>
  );
}

/* ── PHInput ─────────────────────────────────────────────────────────── */

function PHInput({
  label,
  type = 'text',
  value,
  placeholder,
  autoFocus,
  onChange,
  onKeyDown,
}: {
  label?: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoFocus?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-muted)', marginBottom: 6 }}>
          {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '11px 14px',
          border: '1px solid var(--ph-border)',
          borderRadius: 'var(--ph-radius-md)',
          fontFamily: 'var(--ph-font-family)',
          fontSize: 15,
          color: 'var(--ph-text)',
          outline: 'none',
          background: '#fff',
        }}
      />
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  text,
  cta,
  onCta,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  text: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div style={{ padding: '72px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
      <Icon style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }} />
      <p style={{ margin: '14px 0 20px', fontSize: 15 }}>{text}</p>
      {cta && <Button variant="solid" onClick={onCta}>{cta}</Button>}
    </div>
  );
}

/* ── SectionTitle ────────────────────────────────────────────────────── */

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{children}</h2>
      {sub && <p style={{ color: 'var(--ph-text-secondary)', fontSize: 15, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  );
}


/* ── PasswordChangeModal ────────────────────────────────────────────── */

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!current) return '현재 비밀번호를 입력해주세요.';
    if (next.length < 8) return '새 비밀번호는 8자 이상이어야 해요.';
    if (next === current) return '현재 비밀번호와 동일한 비밀번호로 변경할 수 없어요.';
    if (next !== confirm) return '새 비밀번호가 서로 일치하지 않아요.';
    return '';
  };

  const submit = async () => {
    const e = validate();
    if (e) { setErr(e); return; }
    setLoading(true);
    setErr('');
    try {
      await api.put('/api/v1/auth/password', { currentPassword: current, newPassword: next });
      setDone(true);
    } catch (ex: unknown) {
      const msg = (ex as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErr(msg ?? '비밀번호 변경에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const errStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
    fontSize: 13, fontWeight: 600, color: 'var(--ph-error)',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: '#fff', borderRadius: 'var(--ph-radius-xl)',
          maxWidth: 440, width: '100%', padding: 28,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--ph-radius-full)',
            background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock style={{ width: 22, height: 22, color: 'var(--ph-primary)' } as React.CSSProperties} />
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ph-text-muted)', padding: 4, lineHeight: 0,
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--ph-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Check style={{ width: 28, height: 28, color: 'var(--ph-primary)' } as React.CSSProperties} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>비밀번호가 변경됐어요</div>
            <p style={{ fontSize: 14, color: 'var(--ph-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              다음 로그인부터 새 비밀번호를 사용하세요.
            </p>
            <Button variant="solid" size="lg" fullWidth onClick={onClose}>확인</Button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, margin: '14px 0 6px' }}>비밀번호 변경</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ph-text-secondary)', margin: '0 0 20px' }}>
              현재 비밀번호를 확인한 후 새 비밀번호로 변경해요. (데모 기본값: password123)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <PHInput
                label="현재 비밀번호"
                type="password"
                value={current}
                placeholder="현재 비밀번호 입력"
                autoFocus
                onChange={(e) => { setCurrent(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              />
              <PHInput
                label="새 비밀번호"
                type="password"
                value={next}
                placeholder="8자 이상"
                onChange={(e) => { setNext(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              />
              <PHInput
                label="새 비밀번호 확인"
                type="password"
                value={confirm}
                placeholder="새 비밀번호 다시 입력"
                onChange={(e) => { setConfirm(e.target.value); setErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              />
            </div>
            {err && (
              <div style={errStyle}>
                <AlertCircle style={{ width: 15, height: 15 }} />{err}
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <Button
                variant="solid" size="lg" fullWidth
                onClick={submit}
                disabled={!current || !next || !confirm || loading}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Skeleton helpers ───────────────────────────────────────────────── */

function ContentSkeleton() {
  const bar = (h: number, w: string, r = 8) => (
    <div style={{ height: h, width: w, borderRadius: r, background: 'var(--ph-gray-100)' }} />
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {bar(30, '40%')}
      {bar(18, '60%', 6)}
      <div style={{ marginTop: 8, height: 140, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-gray-100)' }} />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 240, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-gray-100)' }} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 56, borderRadius: 'var(--ph-radius-md)', background: 'var(--ph-gray-100)' }} />
      ))}
    </div>
  );
}

/* ── MyPage ─────────────────────────────────────────────────────────── */


const NOTIF_ROWS: { k: keyof NotifState; t: string; d: string }[] = [
  { k: 'email',     t: '이메일 알림',      d: '주문·다운로드 관련 안내를 이메일로 받아요' },
  { k: 'newPrompt', t: '새 프롬프트 알림', d: '찜한 크리에이터의 새 프롬프트를 알려드려요' },
  { k: 'marketing', t: '마케팅 정보 수신', d: '할인·이벤트 소식을 받아요' },
];

function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, openLoginModal, login: authLogin, token: authToken, logout } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const showToast = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);

  const VALID_TABS: TabId[] = ['profile', 'purchased', 'wishlist', 'payments', 'settings'];
  const paramTab = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(
    paramTab && VALID_TABS.includes(paramTab) ? paramTab : 'profile'
  );
  const [nick, setNick] = useState('');
  const [savedNick, setSavedNick] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [notif, setNotif] = useState<NotifState>({ email: true, marketing: false, newPrompt: true });
  const [refunds, setRefunds] = useState<Record<string | number, 'requested' | 'refunded'>>({});
  const [refundTarget, setRefundTarget] = useState<Prompt | null>(null);
  const [purchased, setPurchased] = useState<Prompt[]>([]);
  const [wishlist, setWishlist] = useState<Prompt[]>([]);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [loadingPurchased, setLoadingPurchased] = useState(true);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [userLoadError, setUserLoadError] = useState(false);

  const fetchUser = useCallback(async () => {
    setUserLoadError(false);
    try {
      const res = await api.get('/api/v1/users/me');
      const u: UserInfo = { provider: 'local', ...res.data.data };
      setUser(u);
      setNick(u.name);
    } catch {
      setUserLoadError(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // API 실패해도 로컬 로그아웃은 반드시 실행
    } finally {
      logout();
      router.push('/');
    }
  };

  const handleWithdraw = async () => {
    if (withdrawing) return;
    setWithdrawing(true);
    try {
      await api.delete('/api/v1/users/me');
      logout();
      showToast('회원 탈퇴가 완료됐어요.');
      router.push('/');
    } catch {
      showToast('탈퇴 처리 중 오류가 발생했어요. 다시 시도해 주세요.');
      setWithdrawing(false);
      setWithdrawModal(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) { openLoginModal(); return; }
    fetchUser();
    api.get('/api/v1/orders')
      .then((res) => {
        const orders: { orderId: string; purchasedAt: string; product: Prompt | null }[] = res.data.data ?? [];
        setPurchased(
          orders
            .filter((o) => o.product)
            .map((o) => ({ ...o.product!, purchasedAt: o.purchasedAt }))
        );
      })
      .catch(() => {})
      .finally(() => { setLoadingPurchased(false); setLoadingPayments(false); });
    api.get('/api/v1/wishlists')
      .then((res) => {
        const items: { product: Prompt | null }[] = res.data.data ?? [];
        setWishlist(items.map((item) => item.product).filter(Boolean) as Prompt[]);
      })
      .catch(() => {})
      .finally(() => setLoadingWishlist(false));
  }, [isLoggedIn, openLoginModal, fetchUser]);

  const cart = cartItems;

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)' }}>로그인이 필요한 페이지예요.</p>
      </div>
    );
  }

  const updateNickname = async (n: string) => {
    try {
      const res = await api.put('/api/v1/users/me', { nickname: n });
      const updated = res.data.data;
      setUser((u) => u ? { ...u, name: updated.nickname ?? updated.name } : u);
      if (authToken) authLogin(updated, authToken);
      setSavedNick(true);
    } catch {
      setSavedNick(false);
    }
  };
  const updateEmail = async (e: string) => {
    try {
      const res = await api.put('/api/v1/users/me', { email: e });
      const updated = res.data.data;
      setUser((u) => u ? { ...u, email: updated.email } : u);
      if (authToken) authLogin(updated, authToken);
      showToast('이메일이 변경됐어요');
    } catch {
      setUser((u) => u ? { ...u, email: e } : u);
    }
  };
  const requestRefund = (id: string | number) => {
    setRefunds((r) => ({ ...r, [id]: 'requested' as const }));
  };

  const NAV: { id: TabId; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'profile',   label: '프로필',         icon: User        },
    { id: 'purchased', label: '구매한 프롬프트', icon: ShoppingBag },
    { id: 'wishlist',  label: '찜한 프롬프트',   icon: Heart       },
    { id: 'payments',  label: '결제 내역',       icon: Receipt     },
    { id: 'settings',  label: '설정',            icon: Settings    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: '0 0 28px' }}>마이페이지</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '224px 1fr', gap: 36, alignItems: 'start' }}>

        {/* ── 사이드바 ── */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 88 }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                router.replace(`/mypage?tab=${id}`, { scroll: false });
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--ph-font-family)', fontSize: 15,
                fontWeight: tab === id ? 700 : 500, textAlign: 'left',
                background: tab === id ? 'var(--ph-secondary)' : 'transparent',
                color: tab === id ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />{label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '8px 0' }} />
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 'var(--ph-radius-md)', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--ph-font-family)', fontSize: 15, fontWeight: 500, textAlign: 'left',
              background: 'transparent', color: 'var(--ph-error)',
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />로그아웃
          </button>
        </nav>

        {/* ── 컨텐츠 영역 ── */}
        <div>
          {userLoadError ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--ph-text-secondary)', marginBottom: 20 }}>
                정보를 불러오지 못했어요. 다시 시도해 주세요.
              </p>
              <Button variant="secondary" size="md" onClick={fetchUser}>다시 시도</Button>
            </div>
          ) : !user ? (
            <ContentSkeleton />
          ) : (
            <>
          {/* ── 프로필 탭 ── */}
          {tab === 'profile' && (
            <div>
              <SectionTitle sub="내 계정 정보를 확인하세요.">프로필</SectionTitle>
              <Card padding="28px">
                <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                    border: '1px solid var(--ph-border)', flexShrink: 0,
                    background: 'var(--ph-secondary)',
                  }}>
                    <Image
                      src="/images/promy-character.png"
                      alt="프로필 사진"
                      width={96}
                      height={96}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: 'var(--ph-text-muted)', fontSize: 15, marginTop: 4 }}>{user.email}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                      padding: '5px 11px', background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
                      borderRadius: 'var(--ph-radius-full)', fontSize: 13, fontWeight: 600,
                    }}>
                      {user.role === 'seller'
                        ? <><Store style={{ width: 13, height: 13 }} />판매자 계정</>
                        : <><User style={{ width: 13, height: 13 }} />구매자 계정</>}
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => setTab('settings')} style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    프로필 수정
                  </Button>
                </div>
              </Card>

              {/* 통계 카드 3개 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
                {[
                  { label: '구매한 프롬프트', value: purchased.length, toTab: 'purchased' as TabId },
                  { label: '찜한 프롬프트',   value: wishlist.length,  toTab: 'wishlist'  as TabId },
                  { label: '장바구니',         value: cart.length,       toTab: undefined },
                ].map((s) => (
                  <Card
                    key={s.label}
                    padding="20px"
                    style={{ cursor: s.toTab ? 'pointer' : 'default' }}
                    onClick={s.toTab ? () => setTab(s.toTab!) : undefined}
                  >
                    <div style={{ fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 14, color: 'var(--ph-text-muted)', marginTop: 4 }}>{s.label}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── 구매한 프롬프트 탭 ── */}
          {tab === 'purchased' && (
            <div>
              <SectionTitle sub="결제한 프롬프트를 다시 받아볼 수 있어요.">구매한 프롬프트</SectionTitle>
              {loadingPurchased ? (
                <GridSkeleton />
              ) : purchased.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  text="아직 구매한 프롬프트가 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {purchased.map((p) => {
                    const rst = refunds[p.id];
                    if (rst) {
                      const label = rst === 'refunded' ? '환불 완료' : '환불 신청 중';
                      return (
                        <div key={p.id} style={{ position: 'relative', cursor: 'not-allowed' }} aria-disabled="true">
                          <div style={{ pointerEvents: 'none', filter: 'grayscale(0.5)' }}>
                            <PromptCard p={p} />
                          </div>
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 'var(--ph-radius-lg)',
                            background: 'rgba(255,255,255,0.66)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 16,
                          }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: 'var(--ph-radius-full)',
                              background: '#fff', border: '1px solid var(--ph-border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Lock style={{ width: 19, height: 19, color: 'var(--ph-text-secondary)' }} />
                            </div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', padding: '4px 11px',
                              borderRadius: 'var(--ph-radius-full)', fontSize: 12, fontWeight: 600,
                              color: 'var(--ph-red)', background: 'rgba(217,45,32,0.10)', whiteSpace: 'nowrap',
                            }}>
                              {label}
                            </span>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>
                              열람할 수 없는 프롬프트예요
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <PromptCard key={p.id} p={p} onClick={() => router.push(`/reader/${p.id}`)} />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 찜한 프롬프트 탭 ── */}
          {tab === 'wishlist' && (
            <div>
              <SectionTitle sub="관심 있는 프롬프트를 모아뒀어요.">찜한 프롬프트</SectionTitle>
              {loadingWishlist ? (
                <GridSkeleton />
              ) : wishlist.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  text="아직 찜한 프롬프트가 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                  {wishlist.map((p) => (
                    <PromptCard key={p.id} p={p} onClick={() => router.push(`/detail/${p.id}`)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 결제 내역 탭 ── */}
          {tab === 'payments' && (
            <div>
              <SectionTitle sub="결제한 내역과 환불 상태를 확인하세요.">결제 내역</SectionTitle>
              {loadingPayments ? (
                <TableSkeleton />
              ) : purchased.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  text="아직 결제 내역이 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <PaymentTable
                  payments={purchased.map((p) => ({
                    id: String(p.id),
                    title: p.title,
                    amount: p.amount,
                    status: (refunds[p.id] ?? 'paid') as 'paid' | 'requested' | 'refunded',
                    paidAt: p.purchasedAt || new Date().toISOString(),
                  }))}
                  showRefundColumn
                  onRefund={(pay) => {
                    const item = purchased.find((p) => String(p.id) === pay.id);
                    if (item) setRefundTarget(item);
                  }}
                />
              )}
            </div>
          )}

          {/* ── 설정 탭 ── */}
          {tab === 'settings' && (
            <div>
              <SectionTitle sub="알림과 계정을 관리하세요.">설정</SectionTitle>

              <div style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>계정 관리</div>
              <Card padding="8px 24px">
                {/* 닉네임 */}
                <Row>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>닉네임</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>다른 사용자에게 표시돼요</div>
                  </div>
                  <div style={{ flex: 1, maxWidth: 280 }}>
                    <PHInput
                      value={nick}
                      onChange={(e) => { setNick(e.target.value); setSavedNick(false); }}
                      placeholder="닉네임"
                    />
                  </div>
                  <Button
                    variant="solid"
                    onClick={() => updateNickname(nick.trim() || user.name)}
                    disabled={!nick.trim() || nick.trim() === user.name}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {savedNick ? '저장됨 ✓' : '저장'}
                  </Button>
                </Row>
                {/* 이메일 */}
                <Row>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>이메일</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>로그인·알림에 사용돼요</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ph-text-secondary)', fontSize: 15, minWidth: 0 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      padding: '3px 9px', borderRadius: 'var(--ph-radius-full)',
                      background: 'var(--ph-secondary)', color: 'var(--ph-primary)', fontSize: 12, fontWeight: 600,
                    }}>
                      <Check style={{ width: 12, height: 12 }} />인증됨
                    </span>
                  </div>
                  <Button variant="secondary" onClick={() => setEmailModal(true)} style={{ whiteSpace: 'nowrap' }}>
                    이메일 변경
                  </Button>
                </Row>
                {/* 비밀번호 */}
                <Row last>
                  <div style={{ minWidth: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>비밀번호</div>
                    <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>
                      {user.provider === 'kakao'
                        ? '소셜 로그인 계정은 카카오에서 비밀번호를 관리해요'
                        : '로그인 시 사용하는 비밀번호'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }} />
                  {user.provider === 'kakao' ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      padding: '3px 10px', borderRadius: 'var(--ph-radius-full)',
                      background: 'var(--ph-secondary)', color: 'var(--ph-primary)', fontSize: 12, fontWeight: 600,
                    }}>
                      카카오 계정
                    </span>
                  ) : (
                    <Button variant="secondary" onClick={() => setPwModal(true)} style={{ whiteSpace: 'nowrap' }}>
                      비밀번호 변경
                    </Button>
                  )}
                </Row>
              </Card>

              <div style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 12px' }}>알림 설정</div>
              <Card padding="8px 24px">
                {NOTIF_ROWS.map((n, i, arr) => (
                  <Row key={n.k} last={i === arr.length - 1}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{n.t}</div>
                      <div style={{ fontSize: 13, color: 'var(--ph-text-muted)', marginTop: 2 }}>{n.d}</div>
                    </div>
                    <Switch on={notif[n.k]} onChange={(v) => setNotif((s) => ({ ...s, [n.k]: v }))} />
                  </Row>
                ))}
              </Card>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setWithdrawModal(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ph-error)', fontFamily: 'var(--ph-font-family)',
                    fontSize: 14, fontWeight: 600,
                  }}
                >
                  회원 탈퇴
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* ── 비밀번호 변경 모달 ── */}
      {pwModal && <PasswordChangeModal onClose={() => setPwModal(false)} />}

      {/* ── 회원 탈퇴 확인 모달 ── */}
      <ConfirmDialog
        open={withdrawModal}
        title="정말 탈퇴하시겠어요?"
        description={<>탈퇴하면 구매 내역, 찜 목록 등 모든 데이터가 삭제되며<br /><strong>되돌릴 수 없습니다.</strong></>}
        icon={AlertTriangle}
        iconBg="#fef2f2"
        iconColor="var(--ph-error)"
        confirmLabel="탈퇴하기"
        confirmVariant="danger"
        titleAlign="center"
        maxWidth={400}
        loading={withdrawing}
        onConfirm={handleWithdraw}
        onCancel={() => setWithdrawModal(false)}
      />

      {/* ── 이메일 변경 모달 ── */}
      {emailModal && user && (
        <EmailChangeModal
          currentEmail={user.email}
          onClose={() => setEmailModal(false)}
          onVerified={(newEmail) => { updateEmail(newEmail); setEmailModal(false); }}
        />
      )}

      {/* ── 환불 신청 확인 모달 ── */}
      <ConfirmDialog
        open={!!refundTarget}
        title="환불 신청"
        description="환불 신청 시 구매한 상품 열람이 불가합니다. 환불을 신청하시겠습니까?"
        icon={AlertTriangle}
        iconBg="rgba(217,45,32,0.10)"
        iconColor="var(--ph-red)"
        confirmLabel="환불 신청"
        onConfirm={() => { if (refundTarget) { requestRefund(refundTarget.id); setRefundTarget(null); } }}
        onCancel={() => setRefundTarget(null)}
      />
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense>
      <MyPageContent />
    </Suspense>
  );
}
