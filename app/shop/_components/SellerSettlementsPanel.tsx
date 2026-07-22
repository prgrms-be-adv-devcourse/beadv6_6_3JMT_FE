'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { Banknote, ChevronDown, RefreshCw } from 'lucide-react'
import { StatusBadge } from '@/components/admin/Badge'
import { Table, Td, Th, Tr } from '@/components/admin/DataTable'
import {
  getSellerSettlementDetail,
  getSellerSettlements,
  requestSettlementPayout,
  type SellerMonthlySettlement,
  type SellerSettlementDetail,
  type SettlementDisplayStatus,
} from '@/lib/settlements'
import { won } from '@/lib/utils'

type SettlementFilter = 'all' | SettlementDisplayStatus

const PAGE_SIZE = 10
const FILTERS: { value: SettlementFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'APPROVAL_ON_HOLD', label: '승인 보류' },
  { value: 'APPROVED', label: '승인' },
  { value: 'PAYOUT_REQUESTED', label: '지급 신청' },
  { value: 'PAYOUT_ON_HOLD', label: '지급 보류' },
  { value: 'PAID', label: '지급 완료' },
  { value: 'CANCELLED', label: '취소' },
]

function monthLabel(month: string) {
  const [year, value] = month.split('-')
  return `${year}년 ${Number(value)}월`
}

function periodLabel(start: string, end: string) {
  return `${start.replaceAll('-', '.')} ~ ${end.slice(5).replaceAll('-', '.')}`
}

export default function SellerSettlementsPanel({
  onSettlementChange,
}: {
  onSettlementChange: () => void
}) {
  const [items, setItems] = useState<SellerMonthlySettlement[]>([])
  const [filter, setFilter] = useState<SettlementFilter>('all')
  const [settlementMonth, setSettlementMonth] = useState('')
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, SellerSettlementDetail>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<Record<string, string>>({})
  const listRequestRef = useRef(0)

  const loadList = async (
    nextFilter: SettlementFilter,
    month: string,
    page: number,
    append: boolean,
  ) => {
    const requestId = ++listRequestRef.current
    if (append) setLoadingMore(true)
    else setLoading(true)
    setListError(null)
    try {
      const result = await getSellerSettlements({
        status: nextFilter === 'all' ? undefined : nextFilter,
        settlementMonth: month || undefined,
        page,
        size: PAGE_SIZE,
      })
      if (requestId !== listRequestRef.current) return
      setItems((current) => (append ? [...current, ...result.items] : result.items))
      setHasNext((result.page + 1) * result.size < result.totalElements)
    } catch {
      if (requestId !== listRequestRef.current) return
      if (!append) setItems([])
      setListError('정산 내역을 불러오지 못했어요.')
    } finally {
      if (requestId === listRequestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadList('all', '', 0, false), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const changeFilters = (nextFilter: SettlementFilter, month: string) => {
    setFilter(nextFilter)
    setSettlementMonth(month)
    setExpandedMonth(null)
    setDetailError({})
    void loadList(nextFilter, month, 0, false)
  }

  const loadDetail = async (month: string, force = false) => {
    if (!force && details[month]) return
    setLoadingDetail(month)
    setDetailError((current) => ({ ...current, [month]: '' }))
    try {
      const detail = await getSellerSettlementDetail(month)
      setDetails((current) => ({ ...current, [month]: detail }))
    } catch {
      setDetailError((current) => ({ ...current, [month]: '주간 정산을 불러오지 못했어요.' }))
    } finally {
      setLoadingDetail((current) => (current === month ? null : current))
    }
  }

  const toggleMonth = (month: string) => {
    if (expandedMonth === month) {
      setExpandedMonth(null)
      return
    }
    setExpandedMonth(month)
    void loadDetail(month)
  }

  const requestPayout = async (settlementId: string, month: string) => {
    setRequestingId(settlementId)
    setActionError(null)
    try {
      await requestSettlementPayout(settlementId)
      await Promise.all([loadDetail(month, true), loadList(filter, settlementMonth, 0, false)])
      onSettlementChange()
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      setActionError(message ?? '지급 신청을 처리하지 못했어요.')
      await loadDetail(month, true)
    } finally {
      setRequestingId(null)
    }
  }

  return (
    <section style={{ marginTop: 28, paddingBottom: 80 }}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="m-0 text-[22px] font-bold">정산 내역</h2>
          <p className="mt-1.5 text-[13px] text-ph-text-muted">
            월별 합계를 펼쳐 주간 정산을 확인하고 지급을 신청할 수 있어요.
          </p>
        </div>
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-ph-text-secondary">
          정산 월
          <input
            type="month"
            value={settlementMonth}
            onChange={(event) => changeFilters(filter, event.target.value)}
            className="h-9 rounded-ph-sm border border-ph-border bg-ph-white px-3 text-[13px] outline-none focus:border-ph-primary"
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => changeFilters(value, settlementMonth)}
            className={`rounded-ph-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              filter === value
                ? 'border-ph-primary bg-ph-primary text-white'
                : 'border-ph-border text-ph-text-secondary hover:bg-ph-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        {settlementMonth && (
          <button
            onClick={() => changeFilters(filter, '')}
            className="px-2 text-[12px] font-semibold text-ph-primary"
          >
            월 선택 해제
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-ph-sm border border-ph-error/30 bg-red-50 px-4 py-3 text-[13px] text-ph-error">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="font-semibold">
            닫기
          </button>
        </div>
      )}

      {listError ? (
        <div className="rounded-ph-lg border border-ph-border py-14 text-center text-ph-text-muted">
          <p className="mb-3 text-[14px]">{listError}</p>
          <button
            onClick={() => loadList(filter, settlementMonth, 0, false)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ph-primary"
          >
            <RefreshCw size={14} /> 다시 시도
          </button>
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-[14px] text-ph-text-muted">
          정산 내역을 불러오는 중…
        </div>
      ) : items.length === 0 ? (
        <div className="py-[72px] text-center text-ph-text-muted">
          <Banknote className="mx-auto size-10" />
          <p className="mt-3.5 text-[15px]">조건에 맞는 정산 내역이 없어요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-ph-lg border border-ph-border">
          <Table>
            <thead>
              <tr>
                <Th>정산 월</Th>
                <Th align="right">주간 정산</Th>
                <Th align="right">판매</Th>
                <Th align="right">총 거래액</Th>
                <Th align="right">수수료</Th>
                <Th align="right">환불</Th>
                <Th align="right">지급액</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const expanded = expandedMonth === item.settlementMonth
                const detail = details[item.settlementMonth]
                return (
                  <Fragment key={item.settlementMonth}>
                    <Tr>
                      <Td>
                        <button
                          onClick={() => toggleMonth(item.settlementMonth)}
                          aria-expanded={expanded}
                          className="inline-flex items-center gap-2 whitespace-nowrap font-semibold text-ph-text"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                          {monthLabel(item.settlementMonth)}
                        </button>
                      </Td>
                      <Td align="right">
                        {item.aggregatedSettlementCount}/{item.weeklySettlementCount}건
                      </Td>
                      <Td align="right">{item.salesCount.toLocaleString('ko-KR')}</Td>
                      <Td align="right">{won(item.grossAmount)}</Td>
                      <Td align="right">
                        <span className="text-ph-text-muted">−{won(item.feeAmount)}</span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-muted">−{won(item.refundAmount)}</span>
                      </Td>
                      <Td align="right">
                        <strong>{won(item.payoutAmount)}</strong>
                      </Td>
                      <Td>
                        <div className="flex min-w-[180px] flex-wrap gap-1.5">
                          {item.statusCounts.map((count) => (
                            <StatusBadge
                              key={count.status}
                              status={count.status}
                              label={`${count.statusLabel} ${count.count}`}
                            />
                          ))}
                        </div>
                      </Td>
                    </Tr>
                    {expanded && (
                      <tr>
                        <td
                          colSpan={8}
                          className="border-t border-ph-border bg-ph-gray-50 px-5 py-4"
                        >
                          {loadingDetail === item.settlementMonth && !detail ? (
                            <div className="py-6 text-center text-[13px] text-ph-text-muted">
                              주간 정산을 불러오는 중…
                            </div>
                          ) : detailError[item.settlementMonth] ? (
                            <div className="flex items-center justify-between gap-3 rounded-ph-sm border border-ph-border bg-white px-4 py-3 text-[13px] text-ph-error">
                              <span>{detailError[item.settlementMonth]}</span>
                              <button
                                onClick={() => loadDetail(item.settlementMonth, true)}
                                className="font-semibold"
                              >
                                다시 시도
                              </button>
                            </div>
                          ) : detail ? (
                            <div className="flex flex-col gap-2">
                              {detail.weeklySettlements.map((weekly) => {
                                const payoutAction = weekly.availableActions.find(
                                  (action) => action.type === 'REQUEST_PAYOUT',
                                )
                                return (
                                  <div
                                    key={weekly.settlementId}
                                    className="grid gap-3 rounded-ph-sm border border-ph-border bg-white px-4 py-3 md:grid-cols-[1.3fr_.7fr_.8fr_1fr_auto] md:items-center"
                                  >
                                    <span className="text-[13px] text-ph-text-secondary">
                                      {periodLabel(weekly.periodStart, weekly.periodEnd)}
                                    </span>
                                    <span className="text-[13px] text-ph-text-secondary">
                                      판매 {weekly.salesCount.toLocaleString('ko-KR')}건
                                    </span>
                                    <strong className="text-[13px]">
                                      {won(weekly.payoutAmount)}
                                    </strong>
                                    <StatusBadge
                                      status={weekly.status}
                                      label={weekly.statusLabel}
                                    />
                                    {payoutAction ? (
                                      <button
                                        onClick={() =>
                                          requestPayout(weekly.settlementId, item.settlementMonth)
                                        }
                                        disabled={requestingId === weekly.settlementId}
                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-ph-sm bg-ph-primary px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
                                      >
                                        <Banknote size={14} />
                                        {requestingId === weekly.settlementId
                                          ? '처리 중…'
                                          : payoutAction.label}
                                      </button>
                                    ) : (
                                      <span />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </Table>
          {hasNext && (
            <div className="border-t border-ph-border p-4 text-center">
              <button
                onClick={() =>
                  loadList(filter, settlementMonth, Math.ceil(items.length / PAGE_SIZE), true)
                }
                disabled={loadingMore}
                className="h-[38px] rounded-ph-sm border border-ph-border bg-white px-5 text-[13.5px] font-semibold text-ph-text-secondary disabled:opacity-40"
              >
                {loadingMore ? '불러오는 중…' : '더 보기'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
