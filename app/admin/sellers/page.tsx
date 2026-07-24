'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, X, Store, Search } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import {
  type SellerRegister,
  getSellerRegisters,
  approveSellerRegister,
  rejectSellerRegister,
} from '@/lib/adminSellers'
import { notifyAdminSellerRegistersChanged } from '@/lib/adminSellerEvents'
import { SectionCard } from '@/components/admin/SectionCard'
import { DataPagination, Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { Badge, StatusBadge } from '@/components/admin/Badge'

type SellerApply = SellerRegister
const PAGE_SIZE = 20

const CATEGORY_LABEL: Record<string, string> = {
  image: '이미지',
  writing: '글쓰기',
  coding: '코딩',
  marketing: '마케팅',
  chatbot: '챗봇',
  data: '데이터',
}

type FilterId = 'pending' | 'approved' | 'rejected' | 'all'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function dedupeRejectedIfApproved(list: SellerApply[]): SellerApply[] {
  const approvedUserIds = new Set(list.filter((a) => a.status === 'approved').map((a) => a.userId))
  return list.filter((a) => !(a.status === 'rejected' && approvedUserIds.has(a.userId)))
}

export default function AdminSellersPage() {
  const { token } = useAuthStore()
  const [applies, setApplies] = useState<SellerApply[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterId>('pending')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)

  const [rejectModal, setRejectModal] = useState<{ registerId: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchApplies(page)
  }, [token, page])

  useEffect(() => {
    if (rejectModal) {
      setRejectReason('')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [rejectModal])

  async function fetchApplies(nextPage: number) {
    if (!token) return
    setLoading(true)
    try {
      const res = await getSellerRegisters({ page: nextPage, size: PAGE_SIZE })
      setApplies(res.data ?? [])
      setTotal(res.meta?.total ?? res.data?.length ?? 0)
      setHasNext(!!res.meta?.hasNext)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(registerId: string) {
    setActing(registerId)
    try {
      await approveSellerRegister(registerId)
      setApplies((prev) =>
        prev.map((a) => (a.registerId === registerId ? { ...a, status: 'approved' } : a)),
      )
      notifyAdminSellerRegistersChanged()
    } finally {
      setActing(null)
    }
  }

  function openRejectModal(registerId: string, name: string) {
    setRejectModal({ registerId, name })
  }

  async function handleRejectConfirm() {
    if (!rejectModal || !rejectReason.trim()) return
    const { registerId } = rejectModal
    setActing(registerId)
    setRejectModal(null)
    try {
      await rejectSellerRegister(registerId, rejectReason.trim())
      setApplies((prev) =>
        prev.map((a) => (a.registerId === registerId ? { ...a, status: 'rejected' } : a)),
      )
      notifyAdminSellerRegistersChanged()
    } finally {
      setActing(null)
    }
  }

  const visibleApplies = dedupeRejectedIfApproved(applies)

  const counts = {
    all: visibleApplies.length,
    pending: visibleApplies.filter((a) => a.status === 'pending').length,
    approved: visibleApplies.filter((a) => a.status === 'approved').length,
    rejected: visibleApplies.filter((a) => a.status === 'rejected').length,
  }

  const tabs: { id: FilterId; label: string; count: number }[] = [
    { id: 'pending', label: '대기', count: counts.pending },
    { id: 'approved', label: '승인', count: counts.approved },
    { id: 'rejected', label: '반려', count: counts.rejected },
    { id: 'all', label: '전체', count: counts.all },
  ]

  const byStatus =
    filter === 'all' ? visibleApplies : visibleApplies.filter((a) => a.status === filter)
  const q = keyword.trim().toLowerCase()
  const filtered = !q
    ? byStatus
    : byStatus.filter(
        (a) =>
          (a.name ?? '').toLowerCase().includes(q) ||
          (a.email ?? '').toLowerCase().includes(q) ||
          (a.userId ?? '').toLowerCase().includes(q),
      )

  return (
    <>
      <div className="flex flex-col gap-[20px]">
        <SectionCard
          title="판매자 신청"
          sub={`${counts.pending}건 승인 대기 중`}
          bodyStyle={{ padding: 0 }}
          action={
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-ph-text-muted"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="닉네임, 이메일, 회원 ID 검색"
                className="h-[36px] w-[260px] rounded-ph-md border border-ph-border bg-ph-bg pl-[34px] pr-[12px] text-[13.5px] text-ph-text placeholder:text-ph-text-muted focus:border-ph-primary focus:outline-none"
              />
            </div>
          }
        >
          {/* 필터 탭 */}
          <div className="flex gap-[8px] border-b border-ph-border px-[22px] py-[16px]">
            {tabs.map((t) => {
              const active = filter === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setFilter(t.id)
                    setPage(0)
                  }}
                  className={`inline-flex items-center gap-[6px] rounded-ph-full px-[14px] py-[7px] text-[13.5px] font-semibold transition-colors ${
                    active
                      ? 'bg-ph-secondary text-ph-primary'
                      : 'text-ph-text-secondary hover:bg-ph-gray-50'
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-ph-full px-[5px] text-[11.5px] font-bold ${
                      active
                        ? 'bg-ph-primary text-ph-on-accent'
                        : 'bg-ph-gray-100 text-ph-text-secondary'
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="px-[22px] py-[60px] text-center text-[13.5px] text-ph-text-muted">
              불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-[10px] px-[22px] py-[60px] text-center">
              <span className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-ph-full bg-ph-gray-50 text-ph-text-muted">
                <Store size={22} />
              </span>
              <div className="text-[14.5px] font-bold text-ph-text">해당하는 신청이 없어요</div>
              <div className="text-[13px] text-ph-text-muted">다른 상태 탭을 확인해 보세요.</div>
            </div>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th width="22%">신청자</Th>
                    <Th>판매 소개</Th>
                    <Th>카테고리</Th>
                    <Th align="right">샘플</Th>
                    <Th>신청일</Th>
                    <Th>상태</Th>
                    <Th align="right" width={170}>
                      처리
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <Tr key={a.registerId}>
                      <Td>
                        <Identity name={a.name} sub={a.email} />
                      </Td>
                      <Td style={{ maxWidth: 360 }}>
                        <span
                          className="text-[13.5px] text-ph-text-secondary"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {a.introduction || '—'}
                        </span>
                      </Td>
                      <Td>
                        {a.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-[6px]">
                            {a.categories.map((cat) => (
                              <Badge key={cat} tone="blue">
                                {CATEGORY_LABEL[cat] ?? cat}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[13.5px] text-ph-text-muted">—</span>
                        )}
                      </Td>
                      <Td align="right">
                        {a.portfolioUrl ? (
                          <a
                            href={a.portfolioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[13.5px] font-semibold text-ph-primary hover:underline"
                          >
                            보기
                          </a>
                        ) : (
                          <span className="text-[13.5px] text-ph-text-muted">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="text-ph-text-secondary">
                          {formatDateTime(a.submittedAt)}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={a.status} />
                      </Td>
                      <Td align="right">
                        {a.status === 'pending' ? (
                          <div className="inline-flex justify-end gap-[6px]">
                            <button
                              onClick={() => handleApprove(a.registerId)}
                              disabled={acting === a.registerId}
                              className="inline-flex items-center gap-[5px] rounded-ph-md bg-ph-secondary px-[12px] py-[7px] text-[13px] font-semibold text-ph-primary transition-colors hover:bg-ph-blue-hover hover:text-ph-on-accent disabled:opacity-50"
                            >
                              <Check size={15} />
                              승인
                            </button>
                            <button
                              onClick={() => openRejectModal(a.registerId, a.name)}
                              disabled={acting === a.registerId}
                              className="inline-flex items-center gap-[5px] rounded-ph-md px-[12px] py-[7px] text-[13px] font-semibold text-ph-error transition-colors hover:bg-[#fdeceb] disabled:opacity-50"
                              style={{ backgroundColor: '#fdeceb' }}
                            >
                              <X size={15} />
                              반려
                            </button>
                          </div>
                        ) : (
                          <span className="text-[13px] text-ph-text-muted">처리 완료</span>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <DataPagination
                page={page}
                size={PAGE_SIZE}
                total={total}
                hasNext={hasNext}
                onPageChange={setPage}
              />
            </>
          )}
        </SectionCard>
      </div>

      {/* 반려 사유 입력 모달 */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-ph-xl bg-ph-surface p-[28px] shadow-ph-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[20px]">
              <h3 className="text-[16px] font-bold text-ph-text">반려 사유 입력</h3>
              <p className="mt-[4px] text-[13.5px] text-ph-text-secondary">
                <span className="font-semibold text-ph-text">{rejectModal.name}</span> 님의 신청을
                반려합니다.
              </p>
            </div>

            <textarea
              ref={textareaRef}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요. 신청자에게 전달됩니다."
              rows={4}
              className="w-full resize-none rounded-ph-md border border-ph-border bg-ph-bg px-[14px] py-[11px] text-[13.5px] text-ph-text placeholder:text-ph-text-muted focus:border-ph-primary focus:outline-none"
            />

            <div className="mt-[16px] flex justify-end gap-[8px]">
              <button
                onClick={() => setRejectModal(null)}
                className="rounded-ph-md px-[16px] py-[9px] text-[13.5px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                className="inline-flex items-center gap-[5px] rounded-ph-md px-[16px] py-[9px] text-[13.5px] font-semibold text-ph-error transition-colors hover:bg-[#fdeceb] disabled:opacity-40"
                style={{ backgroundColor: '#fdeceb' }}
              >
                <X size={14} />
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
