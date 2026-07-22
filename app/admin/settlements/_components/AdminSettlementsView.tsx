'use client'

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
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
  type SettlementDisplayStatus,
  type SettlementSummaryCard,
  type WeeklySettlement,
} from '@/lib/settlements'
import { won } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

const PAGE_SIZE = 20
type Filter = 'all' | SettlementDisplayStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'WAITING', label: '대기' },
  { id: 'APPROVAL_ON_HOLD', label: '승인 보류' },
  { id: 'APPROVED', label: '승인' },
  { id: 'PAYOUT_REQUESTED', label: '지급 신청' },
  { id: 'PAYOUT_ON_HOLD', label: '지급 보류' },
  { id: 'PAID', label: '지급 완료' },
  { id: 'CANCELLED', label: '취소' },
]

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
    solid: 'border-transparent bg-ph-primary text-white hover:bg-ph-blue-hover',
    neutral: 'border-ph-border bg-white text-ph-text-secondary hover:bg-ph-gray-50',
    danger: 'border-ph-border bg-white text-ph-error hover:border-ph-error hover:bg-[#fdeceb]',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-ph-sm border px-2.5 text-[12.5px] font-semibold disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

function detailKey(sellerId: string, settlementMonth: string) {
  return `${sellerId}:${settlementMonth}`
}

function monthLabel(month: string) {
  const [year, value] = month.split('-')
  return `${year}년 ${Number(value)}월`
}

function periodLabel(start: string, end: string) {
  return `${start.replaceAll('-', '.')} ~ ${end.slice(5).replaceAll('-', '.')}`
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
  const [filter, setFilter] = useState<Filter>('all')
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

  const loadSummary = async (month: string) => {
    try {
      setSummary(await getAdminSettlementSummary(month || undefined))
    } catch {
      setSummary([])
    }
  }

  const loadList = async (nextFilter: Filter, month: string, page: number, append: boolean) => {
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

  const changeFilters = (nextFilter: Filter, month: string) => {
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
    setLoadingDetail(key)
    setDetailErrors((current) => ({ ...current, [key]: '' }))
    try {
      const detail = await getAdminSettlementDetail(item.sellerId, item.settlementMonth)
      setDetails((current) => ({ ...current, [key]: detail }))
    } catch {
      setDetailErrors((current) => ({ ...current, [key]: '주간 정산을 불러오지 못했어요.' }))
    } finally {
      setLoadingDetail((current) => (current === key ? null : current))
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
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message
      setActionError(message ?? '요청을 처리하지 못했어요. 최신 상태를 다시 확인해 주세요.')
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
  const tabCount = (status: Filter) =>
    status === 'all' ? totalCount : (summary.find((card) => card.status === status)?.count ?? 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ph-text-secondary">
          정산 월
          <input
            type="month"
            value={settlementMonth}
            onChange={(event) => changeFilters(filter, event.target.value)}
            className="h-[38px] rounded-ph-sm border border-ph-border bg-white px-3 text-[14px] outline-none focus:border-ph-primary"
          />
        </label>
        <button
          onClick={() => {
            setBatchOpen((open) => !open)
            setBatchMessage(null)
          }}
          className="inline-flex h-[38px] items-center gap-2 rounded-ph-sm border border-ph-border bg-white px-4 text-[13.5px] font-semibold text-ph-text-secondary hover:bg-ph-gray-50"
        >
          <Play size={15} className="text-ph-primary" /> 수동 정산 실행
        </button>
      </div>

      {batchOpen && (
        <div className="rounded-ph-lg border border-ph-border bg-white px-5 py-[18px]">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ph-text-secondary">
              배치 기준 월
              <input
                type="month"
                value={batchPeriod}
                onChange={(event) => setBatchPeriod(event.target.value)}
                disabled={batchRunning}
                className="h-[38px] rounded-ph-sm border border-ph-border bg-white px-3 text-[14px] outline-none focus:border-ph-primary"
              />
            </label>
            <button
              onClick={startBatch}
              disabled={batchRunning}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-ph-sm bg-ph-primary px-[18px] text-[13.5px] font-semibold text-white disabled:opacity-40"
            >
              <Play size={15} /> {batchRunning ? '실행 중…' : '정산 실행'}
            </button>
            {batchMessage && <span className="text-[13px] text-ph-text-muted">{batchMessage}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.Icon
          return (
            <div
              key={card.label}
              className="rounded-ph-lg border border-ph-border bg-white px-5 py-[18px]"
            >
              <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ph-text-secondary">
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
        bodyStyle={{ padding: 0 }}
      >
        <div className="border-b border-ph-border px-[22px] py-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((tab) => {
              const selected = filter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => changeFilters(tab.id, settlementMonth)}
                  className={`inline-flex h-9 items-center gap-2 rounded-ph-full border px-3.5 text-[13.5px] font-semibold ${selected ? 'border-transparent bg-ph-secondary text-ph-primary' : 'border-ph-border bg-white text-ph-text-secondary hover:bg-ph-gray-50'}`}
                >
                  {tab.label}
                  <span
                    className={`text-[12px] font-bold ${selected ? 'text-ph-primary' : 'text-ph-text-muted'}`}
                  >
                    {tabCount(tab.id)}
                  </span>
                </button>
              )
            })}
            {settlementMonth && (
              <button
                onClick={() => changeFilters(filter, '')}
                className="px-2 text-[12px] font-semibold text-ph-primary"
              >
                월 선택 해제
              </button>
            )}
          </div>
        </div>

        {listError ? (
          <div className="py-14 text-center text-ph-text-muted">
            <p className="mb-3 text-[14px]">{listError}</p>
            <button
              onClick={() => loadList(filter, settlementMonth, 0, false)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ph-primary"
            >
              <RefreshCw size={14} /> 다시 시도
            </button>
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-[14px] text-ph-text-muted">
            정산 목록을 불러오는 중…
          </div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-ph-text-muted">
            <Banknote size={26} className="mx-auto mb-3" />
            <div className="text-[15px] font-bold text-ph-text-secondary">
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
                            onClick={() => toggleDetail(item)}
                            aria-expanded={expanded}
                            className="inline-flex items-center gap-2 whitespace-nowrap font-semibold"
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
                            colSpan={9}
                            className="border-t border-ph-border bg-ph-gray-50 px-5 py-4"
                          >
                            {loadingDetail === key && !detail ? (
                              <div className="py-6 text-center text-[13px] text-ph-text-muted">
                                주간 정산을 불러오는 중…
                              </div>
                            ) : detailErrors[key] ? (
                              <div className="flex items-center justify-between rounded-ph-sm border border-ph-border bg-white px-4 py-3 text-[13px] text-ph-error">
                                <span>{detailErrors[key]}</span>
                                <button
                                  onClick={() => loadDetail(item, true)}
                                  className="font-semibold"
                                >
                                  다시 시도
                                </button>
                              </div>
                            ) : detail ? (
                              <div className="flex flex-col gap-2">
                                {detail.weeklySettlements.map((weekly) => (
                                  <div
                                    key={weekly.settlementId}
                                    className="grid gap-3 rounded-ph-sm border border-ph-border bg-white px-4 py-3 xl:grid-cols-[1.1fr_.5fr_.7fr_.7fr_2fr] xl:items-center"
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
                                    <div className="flex flex-wrap justify-end gap-1.5">
                                      {weekly.availableActions.length === 0 ? (
                                        <span className="text-[12.5px] text-ph-text-muted">
                                          처리할 액션 없음
                                        </span>
                                      ) : (
                                        weekly.availableActions.map((action) => {
                                          if (action.type === 'REQUEST_PAYOUT') return null
                                          const actionType: AdminSettlementAction = action.type
                                          const meta = ACTION_META[actionType]
                                          const Icon = meta.Icon
                                          return (
                                            <RowButton
                                              key={actionType}
                                              tone={meta.tone}
                                              disabled={actingId === weekly.settlementId}
                                              onClick={() => handleAction(item, weekly, actionType)}
                                            >
                                              <Icon size={14} /> {action.label}
                                            </RowButton>
                                          )
                                        })
                                      )}
                                    </div>
                                  </div>
                                ))}
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
      </SectionCard>

      <ConfirmDialog
        open={!!cancelTarget}
        title="정산을 취소하시겠어요?"
        description={
          cancelTarget ? (
            <>
              <b>{cancelTarget.sellerName ?? '판매자'}</b>의{' '}
              {periodLabel(cancelTarget.weekly.periodStart, cancelTarget.weekly.periodEnd)} 주간
              정산을 취소합니다.
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

      {actionError && (
        <div
          onClick={() => setActionError(null)}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-5"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[420px] rounded-ph-xl bg-white p-7"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle size={22} className="text-ph-error" />
            </div>
            <div className="mb-2 text-[18px] font-bold">처리할 수 없는 작업이에요</div>
            <p className="mb-6 text-[15px] leading-6 text-ph-text-secondary">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="h-11 w-full rounded-ph-sm bg-ph-primary text-[15px] font-semibold text-white"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
