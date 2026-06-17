'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';
import {
  Plus, Layers, ShoppingBag, Wallet,
  Info, SearchCheck, Pencil, CirclePause, Lock,
  AlertTriangle, Receipt,
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import PaymentTable from '@/components/ui/PaymentTable';
import { won } from '@/lib/utils';
import Button from '@/components/ui/Button';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: number | string;
  title: string;
  category: string;
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number | string;
  salesCount: number;
  seller: string;
  badge?: string;
  desc: string;
  status?: 'review' | 'active';
  thumbnail_url?: string | null;
};

type Payment = {
  id: string;
  productId: number | string;
  amount: number;
  status: 'paid' | 'requested' | 'refunded';
  paidAt: string;
};

type ActiveTab = 'listings' | 'payments';
type PaymentsFilter = 'all' | 'paid' | 'requested' | 'refunded';


/* ── ShopPage ───────────────────────────────────────────────────────── */

export default function ShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings');
  const [stopped, setStopped] = useState<Record<string | number, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [myListings, setMyListings] = useState<Prompt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsFilter, setPaymentsFilter] = useState<PaymentsFilter>('all');
  const [stats, setStats] = useState([
    { label: '등록 프롬프트', value: '-',  icon: Layers      },
    { label: '누적 판매',     value: '-',  icon: ShoppingBag },
    { label: '이번 달 수익',  value: '-',  icon: Wallet      },
  ]);

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/sellers/me/products').catch(() => ({ data: { data: [] } })),
      api.get('/api/v1/sellers/me/stats').catch(() => ({ data: { data: {} } })),
      api.get('/api/v1/sellers/me/payments').catch(() => ({ data: { data: [] } })),
    ]).then(([productsRes, statsRes, paymentsRes]) => {
      const products = productsRes.data.data ?? [];
      const d = statsRes.data.data ?? {};
      setMyListings(products);
      setPayments(paymentsRes.data.data ?? []);
      setStats([
        { label: '등록 프롬프트', value: `${products.length}개`,                               icon: Layers      },
        { label: '누적 판매',     value: `${(d.totalSalesCount ?? 0).toLocaleString('ko-KR')}회`,   icon: ShoppingBag },
        { label: '누적 수익',     value: `₩${(d.totalRevenue ?? 0).toLocaleString('ko-KR')}`, icon: Wallet      },
      ]);
    });
  }, []);

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = async (id: string | number) => {
    try {
      await api.delete(`/api/v1/product/${id}`);
    } catch {
      // 실패해도 UI는 동일하게 처리
    } finally {
      setStopped((s) => ({ ...s, [id]: true }));
      setConfirmId(null);
    }
  };

  const activeCount = myListings.filter((p) => !isStopped(p.id) && p.status !== 'review').length;
  const reviewCount = myListings.filter((p) => p.status === 'review').length;

  const filteredPayments = paymentsFilter === 'all'
    ? payments
    : payments.filter((p) => p.status === paymentsFilter);

  const FILTER_OPTIONS: { value: PaymentsFilter; label: string }[] = [
    { value: 'all',       label: '전체' },
    { value: 'paid',      label: '결제완료' },
    { value: 'requested', label: '환불 신청 중' },
    { value: 'refunded',  label: '환불 완료' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>

      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.015em', margin: 0 }}>내 상점</h1>
          <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', margin: '8px 0 0' }}>{user?.name ?? '판매자'}님의 판매 현황이에요</p>
        </div>
        <Button variant="solid" size="lg" onClick={() => router.push('/sell')}>
          <Plus style={{ width: 17, height: 17 }} /> 새 프롬프트 등록
        </Button>
      </div>

      {/* ── 통계 카드 3개 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '28px 0 8px' }}>
        {stats.map(({ label, value, icon: Icon }) => (
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

      {/* ── 탭 ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ph-border)', marginTop: 36 }}>
        {([
          { id: 'listings', label: '내 프롬프트', icon: Layers },
          { id: 'payments', label: '정산 내역',   icon: Receipt },
        ] as { id: ActiveTab; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '12px 20px',
              border: 'none', background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--ph-font-family)',
              fontSize: 15, fontWeight: activeTab === id ? 700 : 500,
              color: activeTab === id ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
              borderBottom: activeTab === id ? '2px solid var(--ph-primary)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color .15s ease',
            }}
          >
            <Icon style={{ width: 16, height: 16 }} /> {label}
          </button>
        ))}
      </div>

      {/* ── 내 프롬프트 탭 ── */}
      {activeTab === 'listings' && (
        <section style={{ marginTop: 28, paddingBottom: 80 }}>
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

          <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {myListings.map((p) => {
              const review = p.status === 'review';
              const off = isStopped(p.id);
              const dim = review || off;

              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* 카드 + 오버레이 */}
                  <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(0.7)' : 'none', pointerEvents: dim ? 'none' : 'auto', transition: 'opacity .15s ease, filter .15s ease' }}>
                    <PromptCard p={p} showStatus stopped={off} />
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
      )}

      {/* ── 결제 내역 탭 ── */}
      {activeTab === 'payments' && (
        <section style={{ marginTop: 28, paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>결제 내역</h2>
            {/* 필터 버튼 */}
            <div style={{ display: 'flex', gap: 8 }}>
              {FILTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPaymentsFilter(value)}
                  style={{
                    fontFamily: 'var(--ph-font-family)',
                    fontSize: 13, fontWeight: 600,
                    padding: '7px 14px',
                    borderRadius: 'var(--ph-radius-full)',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'background .15s ease, color .15s ease, border-color .15s ease',
                    background: paymentsFilter === value ? 'var(--ph-primary)' : 'transparent',
                    color: paymentsFilter === value ? '#fff' : 'var(--ph-text-secondary)',
                    borderColor: paymentsFilter === value ? 'var(--ph-primary)' : 'var(--ph-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div style={{ padding: '72px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
              <Receipt style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }} />
              <p style={{ margin: '14px 0 0', fontSize: 15 }}>결제 내역이 없어요.</p>
            </div>
          ) : (
            <PaymentTable
              payments={filteredPayments.map((pay) => ({
                id: pay.id,
                title: myListings.find((p) => String(p.id) === String(pay.productId))?.title ?? `상품 #${pay.productId}`,
                amount: pay.amount,
                status: pay.status,
                paidAt: pay.paidAt,
              }))}
            />
          )}
        </section>
      )}
    </div>
  );
}
