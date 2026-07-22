'use client'

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Banknote,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Pause,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/Badge'
import { Identity, Table, Td, Th, Tr } from '@/components/admin/DataTable'
import { SectionCard } from '@/components/admin/SectionCard'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { SettlementAmountBreakdown } from '@/components/ui/SettlementAmountBreakdown'
import { SETTLEMENT_STATUS_FILTERS, type SettlementFilter } from '@/lib/constants'
import {
  getAdminSettlementDetail,
  getAdminSettlements,
  getAdminSettlementSummary,
  getSettlementJobStatus,
  runAdminSettlementAction,
  runSettlementBatch,
  type AdminMonthlySettlement,
  type AdminSettlementAction,
  type AdminSettlementDetail,
  type SettlementAction,
  type SettlementDisplayStatus,
  type SettlementSummaryCard,
  type WeeklySettlement,
} from '@/lib/settlements'
import { apiErrorMessage, settlementMonthLabel, settlementPeriodLabel, won } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const PAGE_SIZE = 20

const ACTION_META: Record<
  AdminSettlementAction,
  { tone: 'solid' | 'neutral' | 'danger'; Icon: typeof Check }
> = {
  APPROVE: { tone: 'solid', Icon: Check },
  HOLD: { tone: 'neutral', Icon: Pause },
  RELEASE_HOLD: { tone: 'neutral', Icon: RotateCcw },
  PAYOUT: { tone: 'solid', Icon: Banknote },
  PAYOUT_HOLD: { tone: 'neutral', Icon: Pause },
  RELEASE_PAYOUT_HOLD: { tone: 'neutral', Icon: RotateCcw },
  CANCEL: { tone: 'danger', Icon: X },
}

function RowButton({
  children,
  tone,
  disabled,
  onClick,
}: {
  children: ReactNode
  tone: 'solid' | 'neutral' | 'danger'
  disabled?: boolean
  onClick: () => void
}) {
  const tones = {
    solid: 'border-transparent bg-ph-primary text-ph-on-accent hover:bg-ph-blue-hover',
    neutral: 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50',
    danger: 'border-ph-border bg-ph-white text-ph-error hover:border-ph-error hover:bg-[#fdeceb]',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center justify-center gap-ph-2xs whitespace-nowrap rounded-ph-sm border px-2.5 text-[12.5px] font-semibold disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

function detailKey(sellerId: string, settlementMonth: string) {
  return `${sellerId}:${settlementMonth}`
}

function isAdminSettlementAction(
  action: SettlementAction,
): action is SettlementAction & { type: AdminSettlementAction } {
  return action.type !== 'REQUEST_PAYOUT'
}

interface CancelTarget {
  weekly: WeeklySettlement
  sellerName: string | null
  key: string
}

export default function AdminSettlementsView() {
  const { token } = useAuthStore()
  const [items, setItems] = useState<AdminMonthlySettlement[]>([])
  const [summary, setSummary] = useState<SettlementSummaryCard[]>([])
  const [details, setDetails] = useState<Record<string, AdminSettlementDetail>>({})
  const [filter, setFilter] = useState<SettlementFilter>('all')
  const [settlementMonth, setSettlementMonth] = useState('')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchPeriod, setBatchPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchMessage, setBatchMessage] = useState<string | null>(null)
  const listRequestRef = useRef(0)
  const detailRequestRef = useRef<Record<string, number>>({})

  const loadSummary = async (month: string) => {
    try {
      setSummary(await getAdminSettlementSummary(month || undefined))
    } catch {
      setSummary([])
    }
  }

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
      const result = await getAdminSettlements({
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
      setListError('정산 목록을 불러오지 못했어요.')
    } finally {
      if (requestId === listRequestRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary('')
      void loadList('all', '', 0, false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [token])

  const changeFilters = (nextFilter: SettlementFilter, month: string) => {
    setFilter(nextFilter)
    setSettlementMonth(month)
    setExpandedKey(null)
    setDetailErrors({})
    void loadSummary(month)
    void loadList(nextFilter, month, 0, false)
  }

  const loadDetail = async (item: AdminMonthlySettlement, force = false) => {
    const key = detailKey(item.sellerId, item.settlementMonth)
    if (!force && details[key]) return
    const requestId = (detailRequestRef.current[key] ?? 0) + 1
    detailRequestRef.current[key] = requestId
    setLoadingDetail(key)
    setDetailErrors((current) => ({ ...current, [key]: '' }))
    try {
      const detail = await getAdminSettlementDetail(item.sellerId, item.settlementMonth)
      if (detailRequestRef.current[key] !== requestId) return
      setDetails((current) => ({ ...current, [key]: detail }))
    } catch {
      if (detailRequestRef.current[key] !== requestId) return
      setDetailErrors((current) => ({ ...current, [key]: '주간 정산을 불러오지 못했어요.' }))
    } finally {
      if (detailRequestRef.current[key] === requestId) {
        setLoadingDetail((current) => (current === key ? null : current))
      }
    }
  }

  const toggleDetail = (item: AdminMonthlySettlement) => {
    const key = detailKey(item.sellerId, item.settlementMonth)
    if (expandedKey === key) {
      setExpandedKey(null)
      return
    }
    setExpandedKey(key)
    void loadDetail(item)
  }

  const refreshAfterAction = async (item: AdminMonthlySettlement) => {
    await Promise.all([
      loadDetail(item, true),
      loadList(filter, settlementMonth, 0, false),
      loadSummary(settlementMonth),
    ])
  }

  const runAction = async (
    item: AdminMonthlySettlement,
    weekly: WeeklySettlement,
    action: AdminSettlementAction,
  ) => {
    setActingId(weekly.settlementId)
    try {
      await runAdminSettlementAction(weekly.settlementId, action)
      await refreshAfterAction(item)
    } catch (error) {
      setActionError(
        apiErrorMessage(error, '요청을 처리하지 못했어요. 최신 상태를 다시 확인해 주세요.'),
      )
      await refreshAfterAction(item)
    } finally {
      setActingId(null)
    }
  }

  const handleAction = (
    item: AdminMonthlySettlement,
    weekly: WeeklySettlement,
    action: AdminSettlementAction,
  ) => {
    if (action === 'CANCEL') {
      setCancelTarget({
        weekly,
        sellerName: item.sellerName,
        key: detailKey(item.sellerId, item.settlementMonth),
      })
      return
    }
    void runAction(item, weekly, action)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    const item = items.find(
      (row) => detailKey(row.sellerId, row.settlementMonth) === cancelTarget.key,
    )
    if (item) await runAction(item, cancelTarget.weekly, 'CANCEL')
    setCancelTarget(null)
  }

  const pollJob = async (jobExecutionId: number) => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const status = await getSettlementJobStatus(jobExecutionId)
      if (status.status === 'COMPLETED') return { ok: true, message: null }
      if (status.status === 'FAILED' || status.status === 'STOPPED')
        return { ok: false, message: status.failureMessage }
      await new Promise((resolve) => window.setTimeout(resolve, 1500))
    }
    return { ok: false, message: '상태 확인 시간이 초과됐어요.' }
  }

  const startBatch = async () => {
    if (!/^\d{4}-\d{2}$/.test(batchPeriod)) {
      setBatchMessage('기준 월을 선택해 주세요.')
      return
    }
    setBatchRunning(true)
    setBatchMessage('정산 배치를 실행하고 있어요…')
    try {
      const job = await runSettlementBatch(batchPeriod)
      const result = await pollJob(job.jobExecutionId)
      setBatchMessage(
        result.ok
          ? `${batchPeriod} 정산 배치가 완료됐어요.`
          : `정산 배치 실패: ${result.message ?? '알 수 없는 오류'}`,
      )
      if (result.ok)
        await Promise.all([
          loadSummary(settlementMonth),
          loadList(filter, settlementMonth, 0, false),
        ])
    } catch {
      setBatchMessage('정산 배치 요청에 실패했어요. 권한과 연결 상태를 확인해 주세요.')
    } finally {
      setBatchRunning(false)
    }
  }

  const sumBy = (statuses: SettlementDisplayStatus[]) =>
    summary
      .filter((card) => statuses.includes(card.status))
      .reduce((sum, card) => sum + card.totalAmount, 0)
  const countBy = (statuses: SettlementDisplayStatus[]) =>
    summary
      .filter((card) => statuses.includes(card.status))
      .reduce((sum, card) => sum + card.count, 0)
  const summaryCards = [
    {
      label: '정산 대기',
      Icon: Clock,
      value: sumBy(['WAITING', 'APPROVAL_ON_HOLD']),
      count: countBy(['WAITING', 'APPROVAL_ON_HOLD']),
    },
    {
      label: '승인 완료',
      Icon: CircleCheck,
      value: sumBy(['APPROVED', 'PAYOUT_REQUESTED']),
      count: countBy(['APPROVED', 'PAYOUT_REQUESTED']),
    },
    {
      label: '지급 보류',
      Icon: PauseCircle,
      value: sumBy(['PAYOUT_ON_HOLD']),
      count: countBy(['PAYOUT_ON_HOLD']),
    },
    { label: '지급 완료', Icon: Banknote, value: sumBy(['PAID']), count: countBy(['PAID']) },
  ]
  const totalCount = summary.reduce((sum, card) => sum + card.count, 0)
  const tabCount = (status: SettlementFilter) =>
    status === 'all' ? totalCount : (summary.find((card) => card.status === status)?.count ?? 0)

  const filterBar = (
    <div className="flex flex-wrap gap-ph-2xs">
      {SETTLEMENT_STATUS_FILTERS.map((tab) => {
        const selected = filter === tab.value
        return (
          <button
            type="button"
            key={tab.value}
            onClick={() => changeFilters(tab.value, settlementMonth)}
            className={`inline-flex h-9 items-center gap-ph-8 rounded-ph-full border px-3.5 text-[13.5px] font-semibold ${selected ? 'border-transparent bg-ph-secondary text-ph-primary' : 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50'}`}
          >
            {tab.label}
            <span
              className={`text-xs font-bold ${selected ? 'text-ph-primary' : 'text-ph-text-muted'}`}
            >
              {tabCount(tab.value)}
            </span>
          </button>
        )
      })}
      {settlementMonth && (
        <button
          type="button"
          onClick={() => changeFilters(filter, '')}
          className="px-2 text-xs font-semibold text-ph-primary"
        >
          월 선택 해제
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-ph-12">
        <label className="flex flex-col gap-ph-2xs text-ph-caption font-semibold text-ph-text-secondary">
          정산 월
          <input
            type="month"
            value={settlementMonth}
            onChange={(event) => changeFilters(filter, event.target.value)}
            className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-3 text-ph-body-sm outline-none focus:border-ph-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setBatchOpen((open) => !open)
            setBatchMessage(null)
          }}
          className="inline-flex h-[38px] items-center gap-ph-8 rounded-ph-sm border border-ph-border bg-ph-white px-ph-16 text-[13.5px] font-semibold text-ph-text-secondary hover:bg-ph-gray-50"
        >
          <Play size={15} className="text-ph-primary" /> 수동 정산 실행
        </button>
      </div>

      {batchOpen && (
        <div className="rounded-ph-lg border border-ph-border bg-ph-white px-5 py-[18px]">
          <div className="flex flex-wrap items-end gap-ph-12">
            <label className="flex flex-col gap-ph-2xs text-ph-caption font-semibold text-ph-text-secondary">
              배치 기준 월
              <input
                type="month"
                value={batchPeriod}
                onChange={(event) => setBatchPeriod(event.target.value)}
                disabled={batchRunning}
                className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-3 text-ph-body-sm outline-none focus:border-ph-primary"
              />
            </label>
            <button
              type="button"
              onClick={startBatch}
              disabled={batchRunning}
              className="inline-flex h-[38px] items-center gap-ph-2xs rounded-ph-sm bg-ph-primary px-[18px] text-[13.5px] font-semibold text-ph-on-accent disabled:opacity-40"
            >
              <Play size={15} /> {batchRunning ? '실행 중…' : '정산 실행'}
            </button>
            {batchMessage && (
              <span className="text-ph-caption text-ph-text-muted">{batchMessage}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-ph-16 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.Icon
          return (
            <div
              key={card.label}
              className="rounded-ph-lg border border-ph-border bg-ph-white px-5 py-[18px]"
            >
              <div className="flex items-center gap-ph-8 text-[13.5px] font-semibold text-ph-text-secondary">
                <Icon size={17} className="text-ph-primary" /> {card.label}
              </div>
              <div className="mt-3 text-[24px] font-bold tracking-[-0.02em]">{won(card.value)}</div>
              <div className="mt-1 text-[12.5px] text-ph-text-muted">주간 정산 {card.count}건</div>
            </div>
          )
        })}
      </div>

      <SectionCard
        title="월별 정산 목록"
        sub="월별 합계를 펼쳐 판매자별 주간 정산을 처리합니다."
        headerExtra={filterBar}
      >
        {listError ? (
          <div className="py-14 text-center text-ph-text-muted">
            <p className="mb-3 text-ph-body-sm">{listError}</p>
            <button
              type="button"
              onClick={() => loadList(filter, settlementMonth, 0, false)}
              className="inline-flex items-center gap-ph-2xs text-ph-caption font-semibold text-ph-primary"
            >
              <RefreshCw size={14} /> 다시 시도
            </button>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-ph-body-sm text-ph-text-muted">
            정산 목록을 불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-ph-text-muted">
            <Banknote size={26} className="mx-auto mb-3" />
            <div className="text-ph-body-md font-bold text-ph-text-secondary">
              조건에 맞는 정산이 없어요
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>판매자</Th>
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
                  const key = detailKey(item.sellerId, item.settlementMonth)
                  const expanded = expandedKey === key
                  const detail = details[key]
                  return (
                    <Fragment key={key}>
                      <Tr>
                        <Td>
                          <Identity name={item.sellerName ?? '판매자'} />
                        </Td>
                        <Td>
                          <button
                            type="button"
                            onClick={() => toggleDetail(item)}
                            aria-expanded={expanded}
                            aria-controls={`admin-settlement-${key}`}
                            className="inline-flex items-center gap-ph-8 whitespace-nowrap font-semibold"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                            {settlementMonthLabel(item.settlementMonth)}
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
                          <div className="flex min-w-[180px] flex-wrap gap-ph-2xs">
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
                            id={`admin-settlement-${key}`}
                            colSpan={9}
                            className="border-t border-ph-border bg-ph-gray-50 px-5 py-4"
                          >
                            {loadingDetail === key && !detail ? (
                              <div className="py-6 text-center text-ph-caption text-ph-text-muted">
                                주간 정산을 불러오는 중…
                              </div>
                            ) : detailErrors[key] ? (
                              <div className="flex items-center justify-between gap-ph-12 rounded-ph-sm border border-ph-border bg-ph-white px-ph-16 py-3 text-ph-caption text-ph-error">
                                <span>{detailErrors[key]}</span>
                                <button
                                  type="button"
                                  onClick={() => loadDetail(item, true)}
                                  className="font-semibold"
                                >
                                  다시 시도
                                </button>
                              </div>
                            ) : detail?.weeklySettlements.length ? (
                              <div className="flex flex-col gap-ph-8">
                                {detail.weeklySettlements.map((weekly) => {
                                  const adminActions =
                                    weekly.availableActions.filter(isAdminSettlementAction)
                                  return (
                                    <div
                                      key={weekly.settlementId}
                                      className="rounded-ph-sm border border-ph-border bg-ph-white px-ph-16 py-3"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-ph-12">
                                        <div className="flex flex-wrap items-center gap-x-ph-16 gap-y-ph-8">
                                          <span className="text-ph-caption font-semibold text-ph-text-secondary">
                                            {settlementPeriodLabel(
                                              weekly.periodStart,
                                              weekly.periodEnd,
                                            )}
                                          </span>
                                          <span className="text-ph-caption text-ph-text-muted">
                                            판매 {weekly.salesCount.toLocaleString('ko-KR')}건
                                          </span>
                                          <StatusBadge
                                            status={weekly.status}
                                            label={weekly.statusLabel}
                                          />
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-ph-2xs">
                                          {adminActions.length === 0 ? (
                                            <span className="text-[12.5px] text-ph-text-muted">
                                              처리할 액션 없음
                                            </span>
                                          ) : (
                                            adminActions.map((action) => {
                                              const actionType: AdminSettlementAction = action.type
                                              const meta = ACTION_META[actionType]
                                              const Icon = meta.Icon
                                              return (
                                                <RowButton
                                                  key={actionType}
                                                  tone={meta.tone}
                                                  disabled={actingId === weekly.settlementId}
                                                  onClick={() =>
                                                    handleAction(item, weekly, actionType)
                                                  }
                                                >
                                                  <Icon size={14} /> {action.label}
                                                </RowButton>
                                              )
                                            })
                                          )}
                                        </div>
                                      </div>
                                      <SettlementAmountBreakdown
                                        grossAmount={weekly.grossAmount}
                                        feeAmount={weekly.feeAmount}
                                        refundAmount={weekly.refundAmount}
                                        payoutAmount={weekly.payoutAmount}
                                        className="mt-ph-12 border-t border-ph-border pt-ph-12"
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            ) : detail ? (
                              <div className="py-6 text-center text-ph-caption text-ph-text-muted">
                                이 달의 주간 정산이 없어요.
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
                  type="button"
                  onClick={() =>
                    loadList(filter, settlementMonth, Math.ceil(items.length / PAGE_SIZE), true)
                  }
                  disabled={loadingMore}
                  className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-5 text-[13.5px] font-semibold text-ph-text-secondary disabled:opacity-40"
                >
                  {loadingMore ? '불러오는 중…' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!cancelTarget}
        title="정산을 취소하시겠어요?"
        description={
          cancelTarget ? (
            <>
              <b>{cancelTarget.sellerName ?? '판매자'}</b>의{' '}
              {settlementPeriodLabel(
                cancelTarget.weekly.periodStart,
                cancelTarget.weekly.periodEnd,
              )}{' '}
              주간 정산을 취소합니다.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="정산 취소"
        cancelLabel="닫기"
        confirmVariant="danger"
        loading={!!cancelTarget && actingId === cancelTarget.weekly.settlementId}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!actionError}
        title="처리할 수 없는 작업이에요"
        description={actionError ?? ''}
        confirmLabel="확인"
        showCancel={false}
        onConfirm={() => setActionError(null)}
        onCancel={() => setActionError(null)}
      />
    </div>
  )
}
