'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, RefreshCw, RotateCcw, Search } from 'lucide-react'

import { StatusBadge } from '@/components/admin/Badge'
import { DataPagination, Table, Td, Th, Tr } from '@/components/admin/DataTable'
import { SectionCard } from '@/components/admin/SectionCard'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { notifyAdminSettlementDeliveriesChanged } from '@/lib/adminSettlementDeliveryEvents'
import {
  canRetrySettlementDelivery,
  type SettlementDeliveryFilter,
} from '@/lib/settlementDeliveryContracts'
import {
  getAdminSettlementDeliveries,
  getAdminSettlementDeliverySummary,
  retryAdminSettlementDelivery,
  type AdminSettlementDelivery,
  type AdminSettlementDeliverySummary,
} from '@/lib/settlementDeliveries'
import { apiErrorMessage } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const PAGE_SIZE = 20

const EMPTY_SUMMARY: AdminSettlementDeliverySummary = {
  calculatedCount: 0,
  reconciledCount: 0,
  deliveryFailedCount: 0,
  mismatchCount: 0,
  retryInProgressCount: 0,
}

const FILTERS: Array<{
  value: SettlementDeliveryFilter
  label: string
  count?: keyof AdminSettlementDeliverySummary
}> = [
  { value: 'problem', label: '문제 건' },
  { value: 'all', label: '전체' },
  { value: 'CALCULATED', label: '전달 대기', count: 'calculatedCount' },
  { value: 'RECONCILED', label: '정상 대사', count: 'reconciledCount' },
  { value: 'DELIVERY_FAILED', label: '전달 실패', count: 'deliveryFailedCount' },
  { value: 'MISMATCH', label: '데이터 불일치', count: 'mismatchCount' },
]

function dateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function shortId(value: string) {
  if (!value) return '-'
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
}

export default function AdminSettlementDeliveriesView() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<AdminSettlementDelivery[]>([])
  const [summary, setSummary] = useState(EMPTY_SUMMARY)
  const [filter, setFilter] = useState<SettlementDeliveryFilter>('problem')
  const [identifierInput, setIdentifierInput] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [retryTarget, setRetryTarget] = useState<AdminSettlementDelivery | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await getAdminSettlementDeliverySummary())
    } catch {
      setSummary(EMPTY_SUMMARY)
    }
  }, [])

  const loadList = useCallback(
    async (
      nextFilter: SettlementDeliveryFilter,
      nextIdentifier: string,
      nextPage: number,
      silent = false,
    ) => {
      const requestId = ++requestIdRef.current
      if (!silent) setLoading(true)
      setError(null)
      try {
        const result = await getAdminSettlementDeliveries(
          nextFilter,
          nextIdentifier,
          nextPage,
          PAGE_SIZE,
        )
        if (requestId !== requestIdRef.current) return
        setItems(result.items)
        setPage(result.page)
        setTotal(result.totalElements)
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return
        setItems([])
        setError(apiErrorMessage(loadError, '정산 전달 목록을 불러오지 못했어요.'))
      } finally {
        if (requestId === requestIdRef.current && !silent) setLoading(false)
      }
    },
    [],
  )

  const refresh = useCallback(
    async (silent = false) => {
      await Promise.all([loadList(filter, identifier, page, silent), loadSummary()])
    },
    [filter, identifier, loadList, loadSummary, page],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadList('problem', '', 0)
      void loadSummary()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadList, loadSummary, token])

  const hasRetryInProgress = items.some((item) => item.retryInProgress)

  useEffect(() => {
    if (!hasRetryInProgress) return
    const interval = window.setInterval(() => void refresh(true), 3000)
    return () => window.clearInterval(interval)
  }, [hasRetryInProgress, refresh])

  const changeFilter = (nextFilter: SettlementDeliveryFilter) => {
    setFilter(nextFilter)
    setPage(0)
    setExpandedId(null)
    void loadList(nextFilter, identifier, 0)
  }

  const search = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextIdentifier = identifierInput.trim()
    setIdentifier(nextIdentifier)
    setPage(0)
    setExpandedId(null)
    void loadList(filter, nextIdentifier, 0)
  }

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    setExpandedId(null)
    void loadList(filter, identifier, nextPage)
  }

  const retryDelivery = async () => {
    if (!retryTarget || !canRetrySettlementDelivery(retryTarget)) return
    const targetId = retryTarget.settlementDeliveryId
    setRetryingId(targetId)
    try {
      await retryAdminSettlementDelivery(targetId)
      setRetryTarget(null)
      notifyAdminSettlementDeliveriesChanged()
      await Promise.all([loadList(filter, identifier, page), loadSummary()])
    } catch (retryError) {
      setRetryTarget(null)
      setActionError(
        apiErrorMessage(retryError, '정산 전달 재시도를 요청하지 못했어요.'),
      )
      await Promise.all([loadList(filter, identifier, page), loadSummary()])
    } finally {
      setRetryingId(null)
    }
  }

  const problemCount = summary.deliveryFailedCount + summary.mismatchCount

  return (
    <div className="flex flex-col gap-ph-16">
      <div className="grid gap-ph-12 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['문제 건', problemCount, 'text-ph-error'],
          ['전달 대기', summary.calculatedCount, 'text-ph-text'],
          ['정상 대사', summary.reconciledCount, 'text-ph-primary'],
          ['전달 실패', summary.deliveryFailedCount, 'text-ph-error'],
          ['데이터 불일치', summary.mismatchCount, 'text-ph-error'],
        ].map(([label, count, color]) => (
          <div
            key={label}
            className="rounded-ph-lg border border-ph-border bg-ph-white px-ph-16 py-ph-16"
          >
            <div className="text-ph-caption font-semibold text-ph-text-muted">{label}</div>
            <div className={`mt-ph-8 text-ph-headline-md font-bold ${color}`}>
              {Number(count).toLocaleString('ko-KR')}건
            </div>
          </div>
        ))}
      </div>

      <SectionCard
        title="정산 전달 현황"
        sub="Settlement Service가 User Service로 전달한 결과와 대사 상태를 확인합니다."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-ph-8 rounded-ph-sm border border-ph-border bg-ph-white px-ph-12 text-ph-caption font-semibold text-ph-text-secondary hover:bg-ph-gray-50 disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
        }
        headerExtra={
          <div className="flex flex-col gap-ph-12 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-ph-4">
              {FILTERS.map((option) => {
                const count =
                  option.value === 'problem'
                    ? problemCount
                    : option.count
                      ? summary[option.count]
                      : undefined
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeFilter(option.value)}
                    className={`rounded-ph-full px-ph-12 py-ph-8 text-ph-caption font-semibold transition-colors ${
                      filter === option.value
                        ? 'bg-ph-primary text-ph-on-accent'
                        : 'bg-ph-gray-100 text-ph-text-secondary hover:text-ph-text'
                    }`}
                  >
                    {option.label}
                    {count !== undefined ? ` ${count.toLocaleString('ko-KR')}` : ''}
                  </button>
                )
              })}
            </div>
            <form onSubmit={search} className="flex min-w-0 gap-ph-8 sm:min-w-[380px]">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">정산 또는 전달 요청 ID</span>
                <Search
                  size={16}
                  className="absolute left-ph-12 top-1/2 -translate-y-1/2 text-ph-text-muted"
                />
                <input
                  value={identifierInput}
                  onChange={(event) => setIdentifierInput(event.target.value)}
                  placeholder="정산 ID 또는 전달 요청 ID"
                  className="h-9 w-full rounded-ph-sm border border-ph-border bg-ph-white pl-[36px] pr-ph-12 text-ph-caption outline-none transition-colors placeholder:text-ph-text-muted focus:border-ph-primary"
                />
              </label>
              <button
                type="submit"
                className="h-9 rounded-ph-sm bg-ph-primary px-ph-16 text-ph-caption font-semibold text-ph-on-accent hover:bg-ph-blue-hover"
              >
                검색
              </button>
            </form>
          </div>
        }
      >
        {loading ? (
          <div className="py-ph-40 text-center text-ph-caption text-ph-text-muted">
            정산 전달 목록을 불러오는 중…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-ph-12 py-ph-40 text-center">
            <p className="text-ph-body-sm text-ph-error">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-ph-caption font-semibold text-ph-primary"
            >
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-ph-40 text-center text-ph-caption text-ph-text-muted">
            조건에 맞는 정산 전달 내역이 없어요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1180px]">
              <Table>
                <thead>
                  <tr>
                    <Th>상태</Th>
                    <Th>정산 ID</Th>
                    <Th>전달 요청 ID</Th>
                    <Th align="right">시도 횟수</Th>
                    <Th>최초 시도</Th>
                    <Th>최근 시도</Th>
                    <Th>사유</Th>
                    <Th align="right">관리</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const expanded = expandedId === item.settlementDeliveryId
                    return (
                      <Fragment key={item.settlementDeliveryId}>
                        <Tr>
                          <Td>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : item.settlementDeliveryId)
                              }
                              aria-expanded={expanded}
                              className="inline-flex items-center gap-ph-8"
                            >
                              <ChevronDown
                                size={16}
                                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                              />
                              <StatusBadge status={item.status} />
                            </button>
                          </Td>
                          <Td>
                            <span className="font-mono text-[12.5px]" title={item.settlementId}>
                              {shortId(item.settlementId)}
                            </span>
                          </Td>
                          <Td>
                            <span
                              className="font-mono text-[12.5px]"
                              title={item.deliveryRequestId}
                            >
                              {shortId(item.deliveryRequestId)}
                            </span>
                          </Td>
                          <Td align="right">
                            {item.attemptCount.toLocaleString('ko-KR')}회
                            {item.retryInProgress && (
                              <span className="ml-ph-8 text-ph-caption text-ph-primary">
                                처리 중
                              </span>
                            )}
                          </Td>
                          <Td>{dateTime(item.firstAttemptAt)}</Td>
                          <Td>{dateTime(item.lastAttemptAt)}</Td>
                          <Td>
                            <span
                              className="block max-w-[260px] truncate text-ph-caption text-ph-text-secondary"
                              title={item.statusReason ?? undefined}
                            >
                              {item.statusReason ?? '-'}
                            </span>
                          </Td>
                          <Td align="right">
                            {canRetrySettlementDelivery(item) ? (
                              <button
                                type="button"
                                disabled={retryingId === item.settlementDeliveryId}
                                onClick={() => setRetryTarget(item)}
                                className="inline-flex h-8 items-center gap-ph-4 rounded-ph-sm border border-ph-border bg-ph-white px-ph-12 text-[12.5px] font-semibold text-ph-primary hover:bg-ph-gray-50 disabled:opacity-40"
                              >
                                <RotateCcw size={14} /> 재시도
                              </button>
                            ) : (
                              <span className="text-[12.5px] text-ph-text-muted">-</span>
                            )}
                          </Td>
                        </Tr>
                        {expanded && (
                          <tr>
                            <td
                              colSpan={8}
                              className="border-b border-ph-border bg-ph-gray-50 px-ph-24 py-ph-16"
                            >
                              <dl className="grid gap-ph-12 text-ph-caption md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                  <dt className="font-semibold text-ph-text-muted">
                                    전달 레코드 ID
                                  </dt>
                                  <dd className="mt-ph-4 break-all font-mono">
                                    {item.settlementDeliveryId}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-ph-text-muted">정산 ID</dt>
                                  <dd className="mt-ph-4 break-all font-mono">
                                    {item.settlementId}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-ph-text-muted">전달 요청 ID</dt>
                                  <dd className="mt-ph-4 break-all font-mono">
                                    {item.deliveryRequestId}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-ph-text-muted">
                                    대사 완료 시각
                                  </dt>
                                  <dd className="mt-ph-4">{dateTime(item.reconciledAt)}</dd>
                                </div>
                                <div className="md:col-span-2">
                                  <dt className="font-semibold text-ph-text-muted">상태 사유</dt>
                                  <dd className="mt-ph-4 whitespace-pre-wrap break-words">
                                    {item.statusReason ?? '-'}
                                  </dd>
                                </div>
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </Table>
              <DataPagination
                page={page}
                size={PAGE_SIZE}
                total={total}
                onPageChange={changePage}
              />
            </div>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!retryTarget}
        title="정산 전달을 재시도하시겠어요?"
        description={
          retryTarget ? (
            <>
              정산 ID <b>{retryTarget.settlementId}</b>의 User Service 전달을 다시 요청합니다.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="재시도"
        loading={!!retryTarget && retryingId === retryTarget.settlementDeliveryId}
        onConfirm={retryDelivery}
        onCancel={() => setRetryTarget(null)}
      />

      <ConfirmDialog
        open={!!actionError}
        title="재시도를 처리하지 못했어요"
        description={actionError ?? ''}
        confirmLabel="확인"
        showCancel={false}
        onConfirm={() => setActionError(null)}
        onCancel={() => setActionError(null)}
      />
    </div>
  )
}
