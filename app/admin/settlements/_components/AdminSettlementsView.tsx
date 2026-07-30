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
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react'
import { StatusBadge } from '@/components/admin/Badge'
import { DataPagination, Identity, Table, Td, Th, Tr } from '@/components/admin/DataTable'
import { SectionCard } from '@/components/admin/SectionCard'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import { SETTLEMENT_STATUS_FILTERS, type SettlementFilter } from '@/lib/constants'
import {
  getAdminSettlementDetail,
  getAdminSettlements,
  getAdminSettlementSummary,
  runAdminSettlementAction,
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
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})
  const [actingId, setActingId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
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
    setLoading(true)
    setListError(null)
    try {
      const result = await getAdminSettlements({
        status: nextFilter === 'all' ? undefined : nextFilter,
        settlementMonth: month || undefined,
        page,
        size: PAGE_SIZE,
      })
      if (requestId !== listRequestRef.current) return
      setItems(result.items)
      setPage(result.page)
      setTotal(result.totalElements)
      setHasNext((result.page + 1) * result.size < result.totalElements)
    } catch (err: unknown) {
      if (requestId !== listRequestRef.current) return
      if (!append) setItems([])
      setListError(apiErrorMessage(err, '정산 목록을 불러오지 못했어요.'))
    } finally {
      if (requestId === listRequestRef.current) {
        setLoading(false)
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
    } catch (err: unknown) {
      if (detailRequestRef.current[key] !== requestId) return
      setDetailErrors((current) => ({ ...current, [key]: apiErrorMessage(err, '주간 정산을 불러오지 못했어요.') }))
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
      <div>
        <label className="flex flex-col gap-ph-2xs text-ph-caption font-semibold text-ph-text-secondary">
          정산 월
          <input
            type="month"
            value={settlementMonth}
            onChange={(event) => changeFilters(filter, event.target.value)}
            className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-3 text-ph-body-sm outline-none focus:border-ph-primary"
          />
        </label>
      </div>

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
                            className="border-t border-ph-border bg-ph-gray-50 p-ph-16"
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
                              <div className="overflow-x-auto rounded-ph-lg border border-ph-border bg-ph-white [&_tbody_tr:last-child_td]:border-b-0">
                                <div className="min-w-[1120px]">
                                  <Table>
                                    <thead>
                                      <tr>
                                        <Th>정산 기간</Th>
                                        <Th align="right">판매</Th>
                                        <Th align="right">총 거래액</Th>
                                        <Th align="right">수수료</Th>
                                        <Th align="right">환불</Th>
                                        <Th align="right">지급액</Th>
                                        <Th>상태</Th>
                                        <Th align="right">관리</Th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detail.weeklySettlements.map((weekly) => {
                                        const adminActions =
                                          weekly.availableActions.filter(isAdminSettlementAction)
                                        return (
                                          <Tr key={weekly.settlementId}>
                                            <Td>
                                              <span className="whitespace-nowrap font-semibold text-ph-text-secondary">
                                                {settlementPeriodLabel(
                                                  weekly.periodStart,
                                                  weekly.periodEnd,
                                                )}
                                              </span>
                                            </Td>
                                            <Td align="right">
                                              {weekly.salesCount.toLocaleString('ko-KR')}건
                                            </Td>
                                            <Td align="right">{won(weekly.grossAmount)}</Td>
                                            <Td align="right">
                                              <span className="text-ph-text-muted">
                                                −{won(weekly.feeAmount)}
                                              </span>
                                            </Td>
                                            <Td align="right">
                                              <span className="text-ph-text-muted">
                                                −{won(weekly.refundAmount)}
                                              </span>
                                            </Td>
                                            <Td align="right">
                                              <strong>{won(weekly.payoutAmount)}</strong>
                                            </Td>
                                            <Td>
                                              <StatusBadge
                                                status={weekly.status}
                                                label={weekly.statusLabel}
                                              />
                                            </Td>
                                            <Td align="right">
                                              <div className="flex flex-wrap justify-end gap-ph-2xs">
                                                {adminActions.length === 0 ? (
                                                  <span className="text-[12.5px] text-ph-text-muted">
                                                    처리할 액션 없음
                                                  </span>
                                                ) : (
                                                  adminActions.map((action) => {
                                                    const actionType: AdminSettlementAction =
                                                      action.type
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
                                            </Td>
                                          </Tr>
                                        )
                                      })}
                                    </tbody>
                                  </Table>
                                </div>
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
            <DataPagination
              page={page}
              size={PAGE_SIZE}
              total={total}
              hasNext={hasNext}
              onPageChange={(nextPage) => loadList(filter, settlementMonth, nextPage, false)}
            />
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
