'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, Layers, ShoppingBag, Wallet,
  Info, SearchCheck, Pencil, CirclePause, Lock,
  AlertTriangle, Receipt, Banknote, Send, Trash2,
} from 'lucide-react';
import PromptCard, { type PromptItem } from '@/components/ui/PromptCard';
import { won, maskUuidsInText } from '@/lib/utils';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import {
  getSellerSettlementSummary,
  type SellerSettlementSummary,
} from '@/lib/settlements';
import SellerSettlementsPanel from '@/app/shop/_components/SellerSettlementsPanel';
import SettlementChat from '@/app/shop/_components/settlement-chat/SettlementChat';
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

const SELLER_PRODUCTS_PAGE_SIZE = 20;

function toSellerListingStatus(status: string) {
  if (status === 'PENDING_REVIEW') return 'review';
  if (status === 'ON_SALE') return 'active';
  if (status === 'REJECTED') return 'rejected';
  if (status === 'STOPPED') return 'stopped';
  return 'draft';
}

function toSellerListing(p: { productId: string; status: string; rejectionReason?: string; averageRating?: number; thumbnailUrl?: string | null; [key: string]: unknown }) {
  return {
    ...p,
    id: p.productId,
    status: toSellerListingStatus(p.status),
    rejectionReason: p.rejectionReason ?? null,
    rating: p.averageRating,
    thumbnail_url: p.thumbnailUrl ?? null,
  };
}

/* ── ShopPage ───────────────────────────────────────────────────────── */

export default function ShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'review' | 'rejected' | 'draft' | 'stopped'>('all');
  const [stopped, setStopped] = useState<Record<string, boolean>>({});
  const [expandedReason, setExpandedReason] = useState<Record<string, boolean>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [myListings, setMyListings] = useState<Prompt[]>([]);
  // 상태 필터 탭 카운트는 지금까지 불러온(myListings) 항목 기준이다 — "더보기"로 마저
  // 불러오기 전까지는 실제 등록 수보다 적게 보일 수 있다(page 1개 분량만 로드된 상태).
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [productSummary, setProductSummary] = useState<SellerProductSummary | null>(null);
  const [settlementSummary, setSettlementSummary] = useState<SellerSettlementSummary | null>(null);

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

  const loadMoreListings = () => {
    if (loadingMore || !hasNext) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    api.get(`${API_BASE}/products/sellers/me`, { params: { page: nextPage, size: SELLER_PRODUCTS_PAGE_SIZE } })
      .then((res) => {
        setMyListings((prev) => [...prev, ...(res.data.data ?? []).map(toSellerListing)]);
        setPage(nextPage);
        setHasNext(Boolean(res.data.meta?.hasNext));
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    // 프롬프트 목록(그리드)은 상품 서비스에서 그대로 사용
    api.get(`${API_BASE}/products/sellers/me`, { params: { page: 0, size: SELLER_PRODUCTS_PAGE_SIZE } })
      .catch(() => ({ data: { data: [] } }))
      .then((productsRes) => {
        setMyListings((productsRes.data.data ?? []).map(toSellerListing));
        setHasNext(Boolean(productsRes.data.meta?.hasNext));
      });
    loadProductSummary();
    loadSettlementSummary();
  }, []);

  const submitForReview = async (id: string) => {
    try {
      await api.patch(`${API_BASE}/products/${id}/inspection`)
      setMyListings((prev) => prev.map((p) => p.id === id ? { ...p, status: 'review' as const } : p))
    } catch {
      // 실패 무시
    }
  }

  const isStopped = (id: string | number) => !!stopped[id];
  const stopSelling = async (id: string | number) => {
    try {
      await api.delete(`${API_BASE}/products/${id}`);
    } catch {
      // 실패해도 UI는 동일하게 처리
    } finally {
      setStopped((s) => ({ ...s, [id]: true }));
      setConfirmId(null);
    }
  };

  // DRAFT·REJECTED 전용 — 백엔드가 소프트 삭제해서 목록에서 실제로 사라진다(ON_SALE의
  // "판매 중단"과 달리 되돌릴 수 없음). 같은 DELETE 엔드포인트를 쓰지만 성공 시 목록에서
  // 바로 제거한다는 점이 stopSelling과 다르다.
  const deleteListing = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`${API_BASE}/products/${deleteTarget}`);
      setMyListings((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch {
      // 실패 무시 — stopSelling과 동일한 처리 방식
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

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

  // DRAFT·REJECTED 줄의 "수정"/"검수요청·재요청" 버튼 옆에 붙는 삭제 아이콘 버튼 —
  // fullWidth 버튼 두 개 폭을 뺏지 않도록 고정 크기로 둔다.
  const deleteIconButtonStyle: React.CSSProperties = {
    flexShrink: 0, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-sm)', background: 'transparent',
    color: 'var(--ph-text-muted)', cursor: 'pointer', transition: 'all .15s ease',
  };

  // 상품 통계와 정산 금액은 각 서비스의 공개 API에서 독립적으로 조회한다.
  const cards = [
    { label: '등록 상품', value: `${(productSummary?.productCount ?? 0).toLocaleString('ko-KR')}개`, icon: Layers },
    { label: '누적 판매',     value: `${(productSummary?.salesCount ?? 0).toLocaleString('ko-KR')}회`,   icon: ShoppingBag },
    { label: '누적 수익',     value: won(settlementSummary?.totalRevenueAmount ?? 0),                   icon: Wallet },
    { label: '누적 정산 수익', value: won(settlementSummary?.totalSettlementAmount ?? 0),                icon: Banknote },
  ];

  return (
    <div className="!px-4 md:!px-8" style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>

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
      <div className="!grid-cols-2 md:!grid-cols-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '28px 0 8px' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '1px solid var(--ph-border)', marginTop: 36 }}>
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
        <SettlementChat />
      </div>

      {/* ── 내 상품 탭 ── */}
      {activeTab === 'listings' && (
        <section style={{ marginTop: 28, paddingBottom: 80 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>내 상품</h2>

          {/* 상태 필터 탭 */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {statusFilterTabs.map(({ id, label }) => (
              <button
                className="min-h-11 md:min-h-0"
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
                    <PromptCard p={p as unknown as PromptItem} showStatus stopped={off} onClick={() => router.push(`/detail/${p.id}`)} />
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
                      <button
                        aria-label="상품 삭제"
                        onClick={() => setDeleteTarget(p.id)}
                        className="hover:border-ph-error hover:bg-[#fdeceb] hover:text-ph-error"
                        style={deleteIconButtonStyle}
                      >
                        <Trash2 style={{ width: 15, height: 15 }} />
                      </button>
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
                            }}>{maskUuidsInText(p.rejectionReason)}</span>
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
                        <button
                          aria-label="상품 삭제"
                          onClick={() => setDeleteTarget(p.id)}
                          className="hover:border-ph-error hover:bg-[#fdeceb] hover:text-ph-error"
                          style={deleteIconButtonStyle}
                        >
                          <Trash2 style={{ width: 15, height: 15 }} />
                        </button>
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

          {hasNext && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '36px 0' }}>
              <button
                onClick={loadMoreListings}
                disabled={loadingMore}
                style={{
                  padding: '12px 36px',
                  borderRadius: 'var(--ph-radius-full)',
                  border: '1px solid var(--ph-border)',
                  background: 'var(--ph-surface)',
                  color: 'var(--ph-text)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingMore ? 'default' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  fontFamily: 'var(--ph-font-family)',
                }}
              >
                {loadingMore ? '불러오는 중...' : '더보기'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── 정산 내역 탭 ── */}
      {activeTab === 'settlements' && (
        <SellerSettlementsPanel onSettlementChange={loadSettlementSummary} />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="상품을 삭제할까요?"
        description="삭제한 상품은 목록에서 완전히 사라지고 되돌릴 수 없어요."
        confirmLabel="삭제"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={deleteListing}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
