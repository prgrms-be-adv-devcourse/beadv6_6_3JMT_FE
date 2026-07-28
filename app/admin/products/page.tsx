'use client'

import { useEffect, useState } from 'react'
import { ClipboardCheck, FileSearch, Box, X, RotateCcw, Info, Search } from 'lucide-react'
import {
  getAdminProducts,
  revertAdminProduct,
  type AdminProductStatusParam,
} from '@/lib/adminProducts'
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
  rejectionReason?: string | null
}

// 상품 status → StatusBadge 키 매핑
const STATUS_KEY: Record<string, string> = {
  review: 'review',
  active: 'active_product',
  rejected: 'rejected',
}

type FilterId = 'review' | 'active' | 'rejected' | 'all'
const PAGE_SIZE = 20

// 탭 → API status 쿼리스트링 매핑
const STATUS_PARAM: Record<FilterId, AdminProductStatusParam> = {
  review: 'pending_review',
  active: 'on_sale',
  rejected: 'rejected',
  all: 'ALL',
}

// "2026-07-24T01:02:03..." → "2026-07-24 01:02:03"
function formatDateTime(iso: string): string {
  return iso.slice(0, 19).replace('T', ' ')
}

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
  const [keyword, setKeyword] = useState('')
  const [selId, setSelId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [counts, setCounts] = useState<Record<FilterId, number>>({
    review: 0,
    active: 0,
    rejected: 0,
    all: 0,
  })

  // 검색어 300ms debounce — 확정 시 첫 페이지부터 다시 조회
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchProducts(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, filter, keyword])

  useEffect(() => {
    fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // 탭별 건수 — size:1로 목록 없이 meta.total만 취득
  async function fetchCounts() {
    if (!token) return
    const ids: FilterId[] = ['review', 'active', 'rejected', 'all']
    const results = await Promise.all(
      ids.map((id) => getAdminProducts({ status: STATUS_PARAM[id], page: 0, size: 1 })),
    )
    setCounts(
      Object.fromEntries(ids.map((id, i) => [id, results[i].meta.total])) as Record<FilterId, number>,
    )
  }

  async function fetchProducts(nextPage: number) {
    if (!token) return
    setLoading(true)
    try {
      // page는 0-base (DataPagination·API 동일 계약), size는 20 고정
      const { data, meta } = await getAdminProducts({
        status: STATUS_PARAM[filter],
        keyword: keyword || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      })
      setTotal(meta.total)
      setHasNext(meta.hasNext)
      setProducts(
        data.map((p) => ({
          id: p.productId,
          title: p.title,
          productType: p.productType,
          seller: p.sellerNickname ?? '탈퇴한 판매자',
          model: p.model,
          amount: p.amount,
          status: toLocalStatus(p.status),
          createdAt: p.createdAt,
          rejectionReason: p.rejectionReason ?? null,
        })),
      )
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: FilterId; label: string }[] = [
    { id: 'review', label: '검수 대기' },
    { id: 'active', label: '게시중' },
    { id: 'rejected', label: '반려' },
    { id: 'all', label: '전체' },
  ]

  // 현재 목록 내에서 유효한 선택 유지
  useEffect(() => {
    if (!products.length) {
      setSelId(null)
      return
    }
    setSelId((prev) => (prev && products.some((p) => p.id === prev) ? prev : products[0].id))
  }, [products])

  const sel = products.find((p) => p.id === selId)

  async function revert() {
    if (!sel || acting) return
    setActing(true)
    try {
      await revertAdminProduct(sel.id)
      await Promise.all([fetchProducts(page), fetchCounts()])
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="grid items-start gap-[20px] [grid-template-columns:minmax(360px,420px)_1fr]">
      {/* ── 목록 ─────────────────────────────────────── */}
      <SectionCard
        title="상품 목록"
        sub={`${total}건`}
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
                  <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-ph-full bg-ph-secondary px-[5px] text-[11px] font-bold text-ph-primary">
                    {counts[t.id]}
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
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-[10px] px-[18px] py-[48px] text-center">
            <ClipboardCheck size={28} className="text-ph-text-muted" />
            <div className="text-[15px] font-bold text-ph-text">표시할 상품이 없어요</div>
            <div className="text-[13px] text-ph-text-muted">조건에 맞는 상품이 없습니다.</div>
          </div>
        ) : (
          <div className="max-h-[620px] overflow-y-auto">
            {products.map((p, i) => {
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
                      {p.seller} · {formatDateTime(p.createdAt)}
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
              <Meta label="등록일" value={formatDateTime(sel.createdAt)} />
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

          {/* action bar — 처리된 상품만 되돌리기 노출 */}
          {(sel.status ?? 'active') !== 'review' && (
            <div className="rounded-b-ph-lg border-t border-ph-border bg-ph-gray-50 px-[26px] py-[16px]">
              <div className="flex items-center gap-[10px]">
                {sel.status === 'rejected' && sel.rejectionReason && (
                  <span className="flex-1 text-[13.5px] font-medium text-ph-error">
                    {sel.rejectionReason}
                  </span>
                )}
                <button
                  onClick={revert}
                  disabled={acting}
                  className="ml-auto inline-flex h-[40px] items-center gap-[6px] rounded-ph-md border border-ph-border bg-ph-white px-[16px] text-[14px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={15} /> 검수 대기로 되돌리기
                </button>
              </div>
            </div>
          )}
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
