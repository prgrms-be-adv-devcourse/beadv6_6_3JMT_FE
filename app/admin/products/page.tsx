'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, FileSearch, Box, Check, X, RotateCcw, Info, Search } from 'lucide-react'
import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import { useAuthStore } from '@/store/useAuthStore'
import { SectionCard } from '@/components/admin/SectionCard'
import { DataPagination } from '@/components/admin/DataTable'
import { Badge, StatusBadge } from '@/components/admin/Badge'
import { PRODUCT_TYPE_LABEL, PRODUCT_TYPE_ICON } from '@/lib/productTypes'

interface AdminProduct {
  id: string
  title: string
  productType: string
  model?: string
  seller: string
  amount: number
  desc?: string
  content?: string
  status?: string
  createdAt: string
}

// 상품 status → StatusBadge 키 매핑
const STATUS_KEY: Record<string, string> = {
  review: 'review',
  active: 'active_product',
  rejected: 'rejected',
}

type FilterId = 'review' | 'active' | 'rejected' | 'all'
const PAGE_SIZE = 20

function toLocalStatus(status: string): string {
  if (status === 'PENDING_REVIEW') return 'review'
  if (status === 'ON_SALE') return 'active'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'STOPPED') return 'stopped'
  return status
}

function ProductTypeIcon({ product, size }: { product: AdminProduct; size: number }) {
  const Icon = PRODUCT_TYPE_ICON[product.productType] ?? Box
  return <Icon size={size} />
}

function won(amount: number) {
  return `${amount.toLocaleString()}원`
}

export default function AdminProductsPage() {
  const { token } = useAuthStore()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [filter, setFilter] = useState<FilterId>('review')
  const [search, setSearch] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    fetchProducts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page])

  async function fetchProducts(nextPage: number) {
    if (!token) return
    setLoading(true)
    try {
      const res = await api.get(`${API_BASE}/admin/products`, {
        params: { page: nextPage, size: PAGE_SIZE },
      })
      const raw: {
        productId: string
        title: string
        productType: string
        sellerNickname: string | null
        model?: string
        amount: number
        status: string
        createdAt: string
      }[] = res.data.data ?? []
      setTotal(res.data.meta?.total ?? raw.length)
      setHasNext(!!res.data.meta?.hasNext)
      setProducts(
        raw.map((p) => ({
          id: p.productId,
          title: p.title,
          productType: p.productType,
          seller: p.sellerNickname ?? '탈퇴한 판매자',
          model: p.model,
          amount: p.amount,
          status: toLocalStatus(p.status),
          createdAt: p.createdAt,
        })),
      )
    } finally {
      setLoading(false)
    }
  }

  const counts = useMemo(
    () => ({
      review: products.filter((p) => (p.status ?? 'active') === 'review').length,
      active: products.filter((p) => (p.status ?? 'active') === 'active').length,
      rejected: products.filter((p) => (p.status ?? 'active') === 'rejected').length,
      all: products.length,
    }),
    [products],
  )

  const tabs: { id: FilterId; label: string; count: number }[] = [
    { id: 'review', label: '검수 대기', count: counts.review },
    { id: 'active', label: '게시중', count: counts.active },
    { id: 'rejected', label: '반려', count: counts.rejected },
    { id: 'all', label: '전체', count: counts.all },
  ]

  const list = useMemo(() => {
    const byStatus =
      filter === 'all' ? products : products.filter((p) => (p.status ?? 'active') === filter)
    if (!search.trim()) return byStatus
    const q = search.trim().toLowerCase()
    return byStatus.filter(
      (p) => p.title.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q),
    )
  }, [products, filter, search])

  // 현재 목록 내에서 유효한 선택 유지
  useEffect(() => {
    if (!list.length) {
      setSelId(null)
      return
    }
    setSelId((prev) => (prev && list.some((p) => p.id === prev) ? prev : list[0].id))
  }, [list])

  // 선택 변경 시 반려 모드 초기화
  useEffect(() => {
    setRejectMode(false)
    setRejectReason('')
  }, [selId])

  const sel = products.find((p) => p.id === selId)

  async function approve() {
    if (!sel || acting) return
    setActing(true)
    try {
      await api.patch(`${API_BASE}/admin/products/${sel.id}/approve`, {})
      setProducts((prev) => prev.map((p) => (p.id === sel.id ? { ...p, status: 'active' } : p)))
    } finally {
      setActing(false)
    }
  }

  async function revert() {
    if (!sel || acting) return
    setActing(true)
    try {
      await api.patch(`${API_BASE}/admin/products/${sel.id}/revert`, {})
      setProducts((prev) => prev.map((p) => (p.id === sel.id ? { ...p, status: 'review' } : p)))
    } finally {
      setActing(false)
    }
  }

  async function reject() {
    if (!sel || acting || !rejectReason.trim()) return
    setActing(true)
    try {
      await api.patch(`${API_BASE}/admin/products/${sel.id}/reject`, { reason: rejectReason })
      setProducts((prev) => prev.map((p) => (p.id === sel.id ? { ...p, status: 'rejected' } : p)))
      setRejectMode(false)
      setRejectReason('')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="grid items-start gap-[20px] [grid-template-columns:minmax(360px,420px)_1fr]">
      {/* ── 목록 ─────────────────────────────────────── */}
      <SectionCard
        title="검수 대기 상품"
        sub={`${counts.review}건 대기`}
        bodyStyle={{ padding: 0 }}
      >
        <div className="border-b border-ph-border px-[18px] py-[14px]">
          <div className="mb-[12px] flex items-center gap-[8px] rounded-ph-md border border-ph-border bg-ph-white px-[12px] py-[8px]">
            <Search size={14} className="flex-shrink-0 text-ph-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="상품명 또는 판매자 검색"
              className="flex-1 bg-transparent text-[13.5px] text-ph-text outline-none placeholder:text-ph-text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="flex-shrink-0 text-ph-text-muted hover:text-ph-text"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="inline-flex gap-[6px] rounded-ph-md bg-ph-gray-50 p-[4px]">
            {tabs.map((t) => {
              const on = t.id === filter
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setFilter(t.id)
                    setPage(0)
                  }}
                  className={`inline-flex items-center gap-[6px] rounded-ph-sm px-[12px] py-[6px] text-[13px] font-semibold transition-colors ${
                    on
                      ? 'bg-ph-white text-ph-primary shadow-sm'
                      : 'text-ph-text-secondary hover:text-ph-text'
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-ph-full px-[5px] text-[11px] font-bold ${
                      on ? 'bg-ph-secondary text-ph-primary' : 'bg-ph-gray-100 text-ph-text-muted'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="px-[18px] py-[40px] text-center text-[13.5px] text-ph-text-muted">
            불러오는 중...
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-[10px] px-[18px] py-[48px] text-center">
            <ClipboardCheck size={28} className="text-ph-text-muted" />
            <div className="text-[15px] font-bold text-ph-text">검수할 상품이 없어요</div>
            <div className="text-[13px] text-ph-text-muted">모든 상품을 처리했습니다.</div>
          </div>
        ) : (
          <div className="max-h-[620px] overflow-y-auto">
            {list.map((p, i) => {
              const on = p.id === selId
              const status = p.status ?? 'active'
              return (
                <button
                  key={p.id}
                  onClick={() => setSelId(p.id)}
                  className="flex w-full items-center gap-[12px] px-[18px] py-[14px] text-left transition-colors"
                  style={{
                    borderTop: i ? '1px solid var(--ph-border)' : 'none',
                    borderLeft: `3px solid ${on ? 'var(--ph-primary)' : 'transparent'}`,
                    background: on ? 'var(--ph-secondary)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!on) e.currentTarget.style.background = 'var(--ph-gray-50)'
                  }}
                  onMouseLeave={(e) => {
                    if (!on) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span
                    className="inline-flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-ph-md text-ph-primary"
                    style={{ background: on ? '#fff' : 'var(--ph-secondary)' }}
                  >
                    <ProductTypeIcon product={p} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ph-text">
                      {p.title}
                    </span>
                    <span className="mt-[2px] block text-[12.5px] text-ph-text-muted">
                      {p.seller} · {p.createdAt.slice(5, 10)}
                    </span>
                  </span>
                  {status !== 'review' && <StatusBadge status={STATUS_KEY[status] ?? status} />}
                </button>
              )
            })}
          </div>
        )}
        {!loading && products.length > 0 && (
          <DataPagination
            page={page}
            size={PAGE_SIZE}
            total={total}
            hasNext={hasNext}
            onPageChange={setPage}
          />
        )}
      </SectionCard>

      {/* ── 미리보기 ─────────────────────────────────── */}
      {!sel ? (
        <SectionCard bodyStyle={{ padding: 0 }}>
          <div className="flex flex-col items-center gap-[10px] px-[18px] py-[80px] text-center">
            <FileSearch size={28} className="text-ph-text-muted" />
            <div className="text-[15px] font-bold text-ph-text">상품을 선택하세요</div>
            <div className="text-[13px] text-ph-text-muted">
              왼쪽 목록에서 검수할 상품을 골라 주세요.
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="상품 내용 미리보기"
          action={
            <StatusBadge status={STATUS_KEY[sel.status ?? 'active'] ?? sel.status ?? 'active'} />
          }
          bodyStyle={{ padding: 0 }}
        >
          <div className="px-[26px] py-[22px]">
            {/* head */}
            <div className="flex items-start gap-[16px]">
              <span className="inline-flex h-[64px] w-[64px] flex-shrink-0 items-center justify-center rounded-ph-lg bg-ph-secondary text-ph-primary">
                <ProductTypeIcon product={sel} size={30} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-[8px] flex gap-[8px]">
                  <Badge tone="neutral">
                    {PRODUCT_TYPE_LABEL[sel.productType] ?? sel.productType}
                  </Badge>
                  {sel.model && (
                    <Badge tone="neutral" soft={false}>
                      {sel.model}
                    </Badge>
                  )}
                </div>
                <h3 className="m-0 text-[20px] font-bold leading-[1.3] tracking-[-0.01em]">
                  {sel.title}
                </h3>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[22px] font-bold text-ph-text">
                  {sel.amount === 0 ? '무료' : won(sel.amount)}
                </div>
              </div>
            </div>

            {/* meta */}
            <div className="mt-[20px] flex gap-[28px] border-y border-ph-border py-[14px]">
              <Meta label="판매자" value={sel.seller} />
              <Meta label="등록일" value={sel.createdAt.slice(0, 10)} />
              {sel.model && <Meta label="모델" value={sel.model} />}
              <Meta label="가격" value={sel.amount === 0 ? '무료' : won(sel.amount)} />
            </div>

            {/* description */}
            <Field label="상품 설명">
              <p className="m-0 text-[14.5px] leading-[1.65] text-ph-text-secondary">
                {sel.desc ?? '등록된 설명이 없습니다.'}
              </p>
            </Field>

            {/* prompt body */}
            {sel.content && (
              <Field label="프롬프트 본문">
                <div className="relative rounded-ph-md border border-ph-border bg-ph-gray-50 px-[18px] py-[16px]">
                  <pre className="m-0 whitespace-pre-wrap break-words font-ph text-[14px] leading-[1.7] text-ph-text">
                    {sel.content}
                  </pre>
                </div>
                <div className="mt-[8px] flex items-center gap-[6px] text-[12.5px] text-ph-text-muted">
                  <Info size={14} />
                  {'{ } 안의 항목은 구매자가 입력하는 변수입니다.'}
                </div>
              </Field>
            )}
          </div>

          {/* action bar */}
          <div className="rounded-b-ph-lg border-t border-ph-border bg-ph-gray-50 px-[26px] py-[16px]">
            {(sel.status ?? 'active') === 'review' ? (
              rejectMode ? (
                <div className="flex flex-col gap-[10px]">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="반려 사유를 입력하세요"
                    rows={2}
                    className="w-full resize-none rounded-ph-md border border-ph-border bg-ph-white px-[12px] py-[8px] text-[13.5px] text-ph-text outline-none focus:border-ph-primary"
                  />
                  <div className="flex justify-end gap-[8px]">
                    <button
                      onClick={() => {
                        setRejectMode(false)
                        setRejectReason('')
                      }}
                      className="inline-flex h-[36px] items-center rounded-ph-md border border-ph-border bg-ph-white px-[14px] text-[13.5px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={reject}
                      disabled={acting || !rejectReason.trim()}
                      className="inline-flex h-[36px] items-center gap-[6px] rounded-ph-md border-none bg-ph-error px-[16px] text-[13.5px] font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      <X size={15} /> 반려 확정
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-[10px]">
                  <span className="flex-1 text-[13.5px] text-ph-text-muted">
                    가이드라인을 확인한 뒤 승인 또는 반려하세요.
                  </span>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={acting}
                    className="inline-flex h-[40px] items-center gap-[6px] rounded-ph-md border border-ph-border bg-ph-white px-[16px] text-[15px] font-semibold text-ph-error transition-colors hover:bg-[#fdeceb] disabled:opacity-50"
                  >
                    <X size={17} /> 반려
                  </button>
                  <button
                    onClick={approve}
                    disabled={acting}
                    className="inline-flex h-[40px] items-center gap-[6px] rounded-ph-md border-none bg-ph-primary px-[20px] text-[15px] font-semibold text-white transition-colors hover:bg-ph-blue-hover disabled:opacity-50"
                  >
                    <Check size={17} /> 승인하기
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-[10px]">
                <span className="flex flex-1 items-center gap-[8px] text-[13.5px] text-ph-text-secondary">
                  <StatusBadge
                    status={STATUS_KEY[sel.status ?? 'active'] ?? sel.status ?? 'active'}
                  />{' '}
                  처리된 상품입니다.
                </span>
                <button
                  onClick={revert}
                  disabled={acting}
                  className="inline-flex h-[40px] items-center gap-[6px] rounded-ph-md border border-ph-border bg-ph-white px-[16px] text-[14px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={15} /> 검수 대기로 되돌리기
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-[4px] text-[12.5px] text-ph-text-muted">{label}</div>
      <div className="text-[14.5px] font-semibold text-ph-text">{value}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-[20px]">
      <div className="mb-[10px] text-[13px] font-bold text-ph-text-secondary">{label}</div>
      {children}
    </div>
  )
}
