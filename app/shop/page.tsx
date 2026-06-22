'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';
import {
  Plus, Layers, ShoppingBag, Wallet,
  Info, SearchCheck, Pencil, CirclePause, Lock,
  AlertTriangle, Receipt, Banknote,
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import { StatusBadge } from '@/components/admin/Badge';
import { Table, Th, Td, Tr } from '@/components/admin/DataTable';
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

type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'SETTLEMENT_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED';

type Settlement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  productCount: number;
  totalAmount: number;
  feeTotalAmount: number;
  refundAmount: number;
  settlementTotalAmount: number;
  status: SettlementStatus;
};

type ActiveTab = 'listings' | 'settlements';
type SettlementFilter = 'all' | SettlementStatus;


/* ── ShopPage ───────────────────────────────────────────────────────── */

export default function ShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings');
  const [stopped, setStopped] = useState<Record<string | number, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | number | null>(null);
  const [myListings, setMyListings] = useState<Prompt[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('all');
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [stats, setStats] = useState([
    { label: '등록 프롬프트', value: '-',  icon: Layers      },
    { label: '누적 판매',     value: '-',  icon: ShoppingBag },
    { label: '이번 달 수익',  value: '-',  icon: Wallet      },
  ]);

  const loadSettlements = () => {
    api.get('/api/v1/sellers/me/settlements')
      .then((res) => setSettlements(res.data.data ?? []))
      .catch(() => setSettlements([]));
  };

  useEffect(() => {
    Promise.all([
      api.get('/api/v1/sellers/me/products').catch(() => ({ data: { data: [] } })),
      api.get('/api/v1/sellers/me/stats').catch(() => ({ data: { data: {} } })),
    ]).then(([productsRes, statsRes]) => {
      const products = productsRes.data.data ?? [];
      const d = statsRes.data.data ?? {};
      setMyListings(products);
      setStats([
        { label: '등록 프롬프트', value: `${products.length}개`,                               icon: Layers      },
        { label: '누적 판매',     value: `${(d.totalSalesCount ?? 0).toLocaleString('ko-KR')}회`,   icon: ShoppingBag },
        { label: '누적 수익',     value: `₩${(d.totalRevenue ?? 0).toLocaleString('ko-KR')}`, icon: Wallet      },
      ]);
    });
    loadSettlements();
  }, []);

  // 지급 신청 (승인 건 → 지급 신청)
  const requestPayout = async (id: string) => {
    setRequestingId(id);
    try {
      await api.put(`/api/v1/sellers/me/settlements/${id}/request-payout`);
      loadSettlements();
    } finally {
      setRequestingId(null);
    }
  };

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = async (id: string | number) => {
    try {
      await api.delete(`/api/v1/products/${id}`);
    } catch {
      // 실패해도 UI는 동일하게 처리
    } finally {
      setStopped((s) => ({ ...s, [id]: true }));
      setConfirmId(null);
    }
  };

  const activeCount = myListings.filter((p) => !isStopped(p.id) && p.status !== 'review').length;
  const reviewCount = myListings.filter((p) => p.status === 'review').length;

  // 누적 정산 수익 = 지급 완료(PAID) 정산 건의 지급액 합계
  const settledRevenue = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.settlementTotalAmount, 0);

  const cards = [
    ...stats,
    { label: '누적 정산 수익', value: won(settledRevenue), icon: Banknote },
  ];

  const filteredSettlements = settlementFilter === 'all'
    ? settlements
    : settlements.filter((s) => s.status === settlementFilter);

  const SETTLEMENT_FILTERS: { value: SettlementFilter; label: string }[] = [
    { value: 'all',                label: '전체' },
    { value: 'PENDING_APPROVAL',   label: '대기' },
    { value: 'SETTLEMENT_ON_HOLD', label: '승인 보류' },
    { value: 'APPROVED',           label: '승인' },
    { value: 'PAYOUT_REQUESTED',   label: '지급 신청' },
    { value: 'PAYOUT_ON_HOLD',     label: '지급 보류' },
    { value: 'PAID',               label: '지급 완료' },
    { value: 'CANCELLED',          label: '취소' },
  ];

  const fmtPeriod = (start: string, end: string) => {
    const s = start.replace(/-/g, '.');
    const e = end.slice(5).replace(/-/g, '.');
    return `${s} ~ ${e}`;
  };

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

      {/* ── 통계 카드 4개 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '28px 0 8px' }}>
        {cards.map(({ label, value, icon: Icon }) => (
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
          { id: 'settlements', label: '정산 내역', icon: Receipt },
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

      {/* ── 정산 내역 탭 ── */}
      {activeTab === 'settlements' && (
        <section style={{ marginTop: 28, paddingBottom: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>정산 내역</h2>
              <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '6px 0 0' }}>판매 수수료 15% 차감 후 지급액 기준 · 승인 건은 지급 신청할 수 있어요</p>
            </div>
            {/* 상태 필터 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SETTLEMENT_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSettlementFilter(value)}
                  style={{
                    fontFamily: 'var(--ph-font-family)',
                    fontSize: 13, fontWeight: 600,
                    padding: '7px 14px',
                    borderRadius: 'var(--ph-radius-full)',
                    border: '1px solid',
                    cursor: 'pointer',
                    transition: 'background .15s ease, color .15s ease, border-color .15s ease',
                    background: settlementFilter === value ? 'var(--ph-primary)' : 'transparent',
                    color: settlementFilter === value ? '#fff' : 'var(--ph-text-secondary)',
                    borderColor: settlementFilter === value ? 'var(--ph-primary)' : 'var(--ph-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredSettlements.length === 0 ? (
            <div style={{ padding: '72px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
              <Banknote style={{ width: 40, height: 40, display: 'block', margin: '0 auto' }} />
              <p style={{ margin: '14px 0 0', fontSize: 15 }}>정산 내역이 없어요.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <Th>정산 기간</Th>
                    <Th align="right">판매</Th>
                    <Th align="right">총 거래액</Th>
                    <Th align="right">수수료</Th>
                    <Th align="right">지급액</Th>
                    <Th>상태</Th>
                    <Th align="right" width={170}> </Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSettlements.map((r) => (
                    <Tr key={r.id}>
                      <Td>
                        <span className="whitespace-nowrap text-ph-text-secondary">
                          {fmtPeriod(r.periodStart, r.periodEnd)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {r.productCount.toLocaleString('ko-KR')}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.totalAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          −{won(r.feeTotalAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.settlementTotalAmount)}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td align="right">
                        {r.status === 'APPROVED' ? (
                          <button
                            onClick={() => requestPayout(r.id)}
                            disabled={requestingId === r.id}
                            className="inline-flex h-[34px] items-center justify-center gap-[5px] whitespace-nowrap rounded-ph-sm border border-transparent bg-ph-primary px-[12px] text-[13.5px] font-semibold text-white transition-colors hover:bg-ph-blue-hover disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Banknote size={15} />
                            지급 신청하기
                          </button>
                        ) : null}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
