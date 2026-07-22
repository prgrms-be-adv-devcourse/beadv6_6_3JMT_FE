'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { useAuthStore } from '@/store/useAuthStore';
import Image from 'next/image';
import {
  Plus, Layers, ShoppingBag, Wallet,
  Info, SearchCheck, Pencil, CirclePause, Lock,
  AlertTriangle, Receipt, Banknote, Send,
} from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import { StatusBadge } from '@/components/admin/Badge';
import { Table, Th, Td, Tr } from '@/components/admin/DataTable';
import { won } from '@/lib/utils';
import Button from '@/components/ui/Button';
import {
  getSellerSettlements,
  getSellerSettlementSummary,
  requestSettlementPayout,
  type SellerSettlementItem,
  type SellerSettlementSummary,
  type SettlementDisplayStatus,
} from '@/lib/settlements';
import {
  getSellerProductSummary,
  type SellerProductSummary,
} from '@/lib/products';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: string;
  title: string;
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number | string;
  salesCount: number;
  seller: string;
  badge?: string;
  desc: string;
  status?: 'review' | 'active' | 'draft' | 'rejected' | 'stopped';
  thumbnail_url?: string | null;
  rejectionReason?: string | null;
};

type ActiveTab = 'listings' | 'settlements';
type SettlementFilter = 'all' | SettlementDisplayStatus;

const SETTLEMENT_PAGE_SIZE = 10;


/* ── ShopPage ───────────────────────────────────────────────────────── */

export default function ShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'review' | 'rejected' | 'draft' | 'stopped'>('all');
  const [stopped, setStopped] = useState<Record<string, boolean>>({});
  const [expandedReason, setExpandedReason] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<Prompt[]>([]);
  const [settlements, setSettlements] = useState<SellerSettlementItem[]>([]);
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>('all');
  const [settlementHasNext, setSettlementHasNext] = useState(false);
  const [loadingMoreSettlements, setLoadingMoreSettlements] = useState(false);
  const [productSummary, setProductSummary] = useState<SellerProductSummary | null>(null);
  const [settlementSummary, setSettlementSummary] = useState<SellerSettlementSummary | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  // 정산 내역 (상태 필터 + 0-base 페이징). append=true면 "더 보기"로 누적
  const loadSettlements = (filter: SettlementFilter, page: number, append: boolean) => {
    if (append) setLoadingMoreSettlements(true);
    getSellerSettlements({
      status: filter === 'all' ? undefined : filter,
      page,
      size: SETTLEMENT_PAGE_SIZE,
    })
      .then((res) => {
        setSettlements((prev) => (append ? [...prev, ...res.items] : res.items));
        setSettlementHasNext((res.page + 1) * res.size < res.totalElements);
      })
      .catch(() => {
        if (!append) setSettlements([]);
      })
      .finally(() => setLoadingMoreSettlements(false));
  };

  const loadProductSummary = () => {
    getSellerProductSummary()
      .then(setProductSummary)
      .catch(() => setProductSummary(null));
  };

  const loadSettlementSummary = () => {
    getSellerSettlementSummary()
      .then(setSettlementSummary)
      .catch(() => setSettlementSummary(null));
  };

  useEffect(() => {
    // 프롬프트 목록(그리드)은 상품 서비스에서 그대로 사용
    api.get(`${API_BASE}/sellers/me/products`)
      .catch(() => ({ data: { data: [] } }))
      .then((productsRes) => {
        const raw = productsRes.data.data ?? [];
        const toStatus = (s: string) => {
          if (s === 'PENDING_REVIEW') return 'review'
          if (s === 'ON_SALE') return 'active'
          if (s === 'REJECTED') return 'rejected'
          if (s === 'STOPPED') return 'stopped'
          return 'draft'
        }
        const products = raw.map((p: { productId: string; status: string; rejectionReason?: string; averageRating?: number; [key: string]: unknown }) => ({
          ...p,
          id: p.productId,
          status: toStatus(p.status),
          rejectionReason: p.rejectionReason ?? null,
          rating: p.averageRating,
        }));
        setMyListings(products);
      });
    loadSettlements('all', 0, false);
    loadProductSummary();
    loadSettlementSummary();
  }, []);

  const changeSettlementFilter = (filter: SettlementFilter) => {
    setSettlementFilter(filter);
    loadSettlements(filter, 0, false);
  };

  // 지급 신청 (승인 건 → 지급 신청)
  const requestPayout = async (id: string) => {
    setRequestingId(id);
    try {
      await requestSettlementPayout(id);
      loadSettlements(settlementFilter, 0, false);
      loadSettlementSummary();
    } finally {
      setRequestingId(null);
    }
  };

  const submitForReview = async (id: string) => {
    try {
      await api.patch(`${API_BASE}/sellers/me/products/${id}/submit`)
      setMyListings((prev) => prev.map((p) => p.id === id ? { ...p, status: 'review' as const } : p))
    } catch {
      // 실패 무시
    }
  }

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = async (id: string | number) => {
    try {
      await api.delete(`${API_BASE}/sellers/me/products/${id}`);
    } catch {
      // 실패해도 UI는 동일하게 처리
    } finally {
      setStopped((s) => ({ ...s, [id]: true }));
      setConfirmId(null);
    }
  };

  const activeCount = myListings.filter((p) => !isStopped(p.id) && p.status === 'active').length;
  const reviewCount = myListings.filter((p) => p.status === 'review').length;

  const filteredListings = statusFilter === 'all'
    ? myListings
    : statusFilter === 'stopped'
      ? myListings.filter((p) => p.status === 'stopped' || isStopped(p.id))
      : myListings.filter((p) => p.status === statusFilter && !isStopped(p.id));

  const statusFilterTabs: { id: typeof statusFilter; label: string }[] = [
    { id: 'all',      label: `전체 ${myListings.length}` },
    { id: 'active',   label: `판매중 ${myListings.filter((p) => p.status === 'active' && !isStopped(p.id)).length}` },
    { id: 'review',   label: `검수중 ${myListings.filter((p) => p.status === 'review').length}` },
    { id: 'rejected', label: `반려 ${myListings.filter((p) => p.status === 'rejected').length}` },
    { id: 'draft',    label: `미등록 ${myListings.filter((p) => p.status === 'draft').length}` },
    { id: 'stopped',  label: `판매중단 ${myListings.filter((p) => p.status === 'stopped' || isStopped(p.id)).length}` },
  ];

  // 상품 통계와 정산 금액은 각 서비스의 공개 API에서 독립적으로 조회한다.
  const cards = [
    { label: '등록 상품', value: `${(productSummary?.productCount ?? 0).toLocaleString('ko-KR')}개`, icon: Layers },
    { label: '누적 판매',     value: `${(productSummary?.salesCount ?? 0).toLocaleString('ko-KR')}회`,   icon: ShoppingBag },
    { label: '누적 수익',     value: won(settlementSummary?.totalRevenueAmount ?? 0),                   icon: Wallet },
    { label: '누적 정산 수익', value: won(settlementSummary?.totalSettlementAmount ?? 0),                icon: Banknote },
  ];

  // 정산 목록은 server-side 필터링 → settlements를 그대로 렌더링
  const filteredSettlements = settlements;

  const SETTLEMENT_FILTERS: { value: SettlementFilter; label: string }[] = [
    { value: 'all',              label: '전체' },
    { value: 'WAITING',          label: '대기' },
    { value: 'APPROVAL_ON_HOLD', label: '승인 보류' },
    { value: 'APPROVED',         label: '승인' },
    { value: 'PAYOUT_REQUESTED', label: '지급 신청' },
    { value: 'PAYOUT_ON_HOLD',   label: '지급 보류' },
    { value: 'PAID',             label: '지급 완료' },
    { value: 'CANCELLED',        label: '취소' },
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
          <Plus style={{ width: 17, height: 17 }} /> 새 상품 등록
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
          { id: 'listings', label: '내 상품', icon: Layers },
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

      {/* ── 내 상품 탭 ── */}
      {activeTab === 'listings' && (
        <section style={{ marginTop: 28, paddingBottom: 80 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>내 상품</h2>

          {/* 상태 필터 탭 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {statusFilterTabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setStatusFilter(id)}
                style={{
                  padding: '7px 14px', border: `1.5px solid ${statusFilter === id ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
                  borderRadius: 'var(--ph-radius-full)', background: statusFilter === id ? 'var(--ph-secondary)' : 'var(--ph-surface)',
                  color: statusFilter === id ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ph-font-family)',
                  transition: 'all .15s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'var(--ph-text-muted)', margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
            새로 등록한 상품은 관리자 검수를 거쳐 승인되면 판매가 시작돼요. 판매를 중단하면 다시 등록할 수 없어요.
          </p>

          <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {filteredListings.map((p) => {
              const review = p.status === 'review';
              const off = p.status === 'stopped' || isStopped(p.id);
              const dim = review || off;

              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* 카드 + 오버레이 */}
                  <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? 'grayscale(0.7)' : 'none', pointerEvents: dim ? 'none' : 'auto', transition: 'opacity .15s ease, filter .15s ease' }}>
                    <PromptCard p={p as any} showStatus stopped={off} onClick={() => router.push(`/detail/${p.id}`)} />
                  </div>

                  {/* 카드 아래 액션 */}
                  {p.status === 'draft' ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => router.push(`/edit/${p.id}`)}>
                        <Pencil style={{ width: 15, height: 15 }} /> 수정
                      </Button>
                      <Button variant="solid" size="sm" fullWidth onClick={() => submitForReview(p.id)}>
                        <Send style={{ width: 15, height: 15 }} /> 검수 요청
                      </Button>
                    </div>
                  ) : p.status === 'rejected' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.rejectionReason && (
                        <div style={{ fontSize: 12.5, color: 'var(--ph-error)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} />
                            <span style={{
                              overflow: expandedReason[p.id] ? 'visible' : 'hidden',
                              display: expandedReason[p.id] ? 'block' : '-webkit-box',
                              WebkitLineClamp: expandedReason[p.id] ? undefined : 2,
                              WebkitBoxOrient: 'vertical' as const,
                            }}>{p.rejectionReason}</span>
                          </div>
                          <button
                            onClick={() => setExpandedReason((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-error)', fontSize: 12, fontWeight: 600, padding: 0, textAlign: 'left', textDecoration: 'underline', fontFamily: 'var(--ph-font-family)' }}
                          >
                            {expandedReason[p.id] ? '접기' : '전체보기'}
                          </button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => router.push(`/edit/${p.id}`)}>
                          <Pencil style={{ width: 15, height: 15 }} /> 수정
                        </Button>
                        <Button variant="solid" size="sm" fullWidth onClick={() => submitForReview(p.id)}>
                          <Send style={{ width: 15, height: 15 }} /> 재요청
                        </Button>
                      </div>
                    </div>
                  ) : review ? (
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ph-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <SearchCheck style={{ width: 14, height: 14, color: 'var(--ph-primary)' }} /> 관리자 검수 대기 중이에요
                    </span>
                  ) : off ? (
                    <Button variant="secondary" size="sm" fullWidth disabled>
                      <Lock style={{ width: 15, height: 15 }} /> 재등록 불가
                    </Button>
                  ) : confirmId === p.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ph-error)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle style={{ width: 14, height: 14 }} />
                        중단하면 다시 등록할 수 없어요
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(null)}>취소</Button>
                        <Button variant="solid" size="sm" fullWidth onClick={() => stopSelling(p.id)}>
                          중단
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => router.push(`/edit/${p.id}`)}>
                        <Pencil style={{ width: 15, height: 15 }} /> 수정
                      </Button>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(p.id)}>
                        <CirclePause style={{ width: 15, height: 15 }} />
                        판매 중단
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
                  onClick={() => changeSettlementFilter(value)}
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
                    <Tr key={r.settlementId}>
                      <Td>
                        <span className="whitespace-nowrap text-ph-text-secondary">
                          {fmtPeriod(r.periodStart, r.periodEnd)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {r.salesCount.toLocaleString('ko-KR')}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.grossAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          −{won(r.feeAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.payoutAmount)}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} label={r.statusLabel} />
                      </Td>
                      <Td align="right">
                        {r.canRequestPayout ? (
                          <button
                            onClick={() => requestPayout(r.settlementId)}
                            disabled={requestingId === r.settlementId}
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

              {settlementHasNext && (
                <div style={{ borderTop: '1px solid var(--ph-border)', padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => loadSettlements(settlementFilter, Math.ceil(settlements.length / SETTLEMENT_PAGE_SIZE), true)}
                    disabled={loadingMoreSettlements}
                    className="inline-flex h-[38px] items-center justify-center rounded-ph-sm border border-ph-border bg-ph-white px-[20px] text-[13.5px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {loadingMoreSettlements ? '불러오는 중…' : '더 보기'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
