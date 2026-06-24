'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Clock, CircleCheck, PauseCircle, Banknote, Check, Pause, RotateCcw, X, CheckCheck, XCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/auth'
import { SectionCard } from '@/components/admin/SectionCard'
import { StatusBadge } from '@/components/admin/Badge'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/modals/ConfirmDialog'

type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'SETTLEMENT_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED'

interface Settlement {
  id: string
  sellerId: string
  sellerName: string
  shop: string
  periodStart: string
  periodEnd: string
  productCount: number
  totalAmount: number
  feeTotalAmount: number
  refundAmount: number
  settlementTotalAmount: number
  status: SettlementStatus
  calculatedAt: string
  confirmedAt: string | null
  paidAt: string | null
}

type Action = 'approve' | 'hold' | 'unhold' | 'cancel' | 'pay'

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`

// 상태별 노출 액션 (정산 상태머신)
function actionsFor(status: SettlementStatus): Action[] {
  switch (status) {
    case 'PENDING_APPROVAL':
      return ['approve', 'hold']
    case 'SETTLEMENT_ON_HOLD':
      return ['approve', 'unhold', 'cancel']
    case 'APPROVED':
      return ['pay', 'hold', 'cancel']
    case 'PAYOUT_REQUESTED':
      return ['pay', 'hold', 'cancel']
    case 'PAYOUT_ON_HOLD':
      return ['pay', 'unhold', 'cancel']
    default:
      return []
  }
}

const ACTION_META: Record<
  Action,
  { label: string; tone: 'solid' | 'neutral' | 'danger'; Icon: typeof Check }
> = {
  approve: { label: '승인', tone: 'solid', Icon: Check },
  pay: { label: '지급', tone: 'solid', Icon: Banknote },
  hold: { label: '보류', tone: 'neutral', Icon: Pause },
  unhold: { label: '보류 취소', tone: 'neutral', Icon: RotateCcw },
  cancel: { label: '취소', tone: 'danger', Icon: X },
}

function RowBtn({
  children,
  tone,
  onClick,
  disabled,
}: {
  children: ReactNode
  tone: 'solid' | 'neutral' | 'danger'
  onClick?: () => void
  disabled?: boolean
}) {
  const tones: Record<string, string> = {
    solid: 'border-transparent bg-ph-primary text-white hover:bg-ph-blue-hover',
    neutral: 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50',
    danger: 'border-ph-border bg-ph-white text-ph-error hover:border-ph-error hover:bg-[#fdeceb]',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-[34px] items-center justify-center gap-[5px] whitespace-nowrap rounded-ph-sm border px-[12px] text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

function fmtPeriod(start: string, end: string) {
  const s = start.replace(/-/g, '.')
  const e = end.slice(5).replace(/-/g, '.')
  return `${s} ~ ${e}`
}

const TABS: { id: 'all' | SettlementStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'PENDING_APPROVAL', label: '대기' },
  { id: 'SETTLEMENT_ON_HOLD', label: '승인 보류' },
  { id: 'APPROVED', label: '승인' },
  { id: 'PAYOUT_REQUESTED', label: '지급 신청' },
  { id: 'PAYOUT_ON_HOLD', label: '지급 보류' },
  { id: 'PAID', label: '지급 완료' },
  { id: 'CANCELLED', label: '취소' },
]

export default function AdminPaymentsPage() {
  const { token } = useAuthStore()
  const [rows, setRows] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | SettlementStatus>('all')
  const [cancelTarget, setCancelTarget] = useState<Settlement | null>(null)

  const load = () => {
    if (!token) return
    api
      .get('/api/v1/admin/payments', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRows(res.data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const act = async (id: string, action: Action) => {
    if (!token) return
    setActingId(id)
    try {
      await api.put(
        `/api/v1/admin/payments/${id}/transition`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      load()
    } finally {
      setActingId(null)
    }
  }

  // 취소는 되돌릴 수 없으므로 확인 다이얼로그를 거친다
  const onActionClick = (row: Settlement, action: Action) => {
    if (action === 'cancel') {
      setCancelTarget(row)
      return
    }
    act(row.id, action)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    await act(cancelTarget.id, 'cancel')
    setCancelTarget(null)
  }

  const sumBy = (statuses: SettlementStatus[]) =>
    rows.filter((r) => statuses.includes(r.status)).reduce((acc, r) => acc + r.settlementTotalAmount, 0)
  const countBy = (statuses: SettlementStatus[]) => rows.filter((r) => statuses.includes(r.status)).length

  const summary = [
    { label: '정산 대기', Icon: Clock, value: sumBy(['PENDING_APPROVAL', 'SETTLEMENT_ON_HOLD']), note: `${countBy(['PENDING_APPROVAL', 'SETTLEMENT_ON_HOLD'])}건` },
    { label: '승인 완료', Icon: CircleCheck, value: sumBy(['APPROVED', 'PAYOUT_REQUESTED']), note: `${countBy(['APPROVED', 'PAYOUT_REQUESTED'])}건` },
    { label: '지급 보류', Icon: PauseCircle, value: sumBy(['PAYOUT_ON_HOLD']), note: `${countBy(['PAYOUT_ON_HOLD'])}건` },
    { label: '지급 완료', Icon: Banknote, value: sumBy(['PAID']), note: `${countBy(['PAID'])}건` },
  ]

  const tabCount = (id: 'all' | SettlementStatus) =>
    id === 'all' ? rows.length : rows.filter((r) => r.status === id).length
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter)

  return (
    <div className="flex flex-col gap-[20px]">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => {
          const Icon = s.Icon
          return (
            <div key={s.label} className="rounded-ph-lg border border-ph-border bg-ph-white px-[20px] py-[18px]">
              <div className="flex items-center gap-[8px] text-[13.5px] font-semibold text-ph-text-secondary">
                <Icon size={17} className="text-ph-primary" />
                {s.label}
              </div>
              <div className="mt-[12px] text-[24px] font-bold tracking-[-0.02em] text-ph-text">{won(s.value)}</div>
              <div className="mt-[4px] text-[12.5px] text-ph-text-muted">{s.note}</div>
            </div>
          )
        })}
      </div>

      {/* 정산 예정 목록 */}
      <SectionCard title="정산 예정 목록" sub="판매 수수료 15% 차감 후 지급액 기준" bodyStyle={{ padding: 0 }}>
        {/* 필터 탭 */}
        <div className="border-b border-ph-border px-[22px] py-[16px]">
          <div className="flex flex-wrap gap-[6px]">
            {TABS.map((t) => {
              const on = filter === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`inline-flex h-[36px] items-center gap-[7px] whitespace-nowrap rounded-ph-full border px-[14px] text-[13.5px] font-semibold transition-colors ${
                    on
                      ? 'border-transparent bg-ph-secondary text-ph-primary'
                      : 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50'
                  }`}
                >
                  {t.label}
                  <span className={`text-[12px] font-bold ${on ? 'text-ph-primary' : 'text-ph-text-muted'}`}>
                    {tabCount(t.id)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-[48px] text-center text-[14px] text-ph-text-muted">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="px-[20px] py-[56px] text-center text-ph-text-muted">
            <div className="mx-auto mb-[16px] flex h-[56px] w-[56px] items-center justify-center rounded-ph-full border border-ph-border bg-ph-gray-50">
              <Banknote size={26} className="text-ph-text-muted" />
            </div>
            <div className="text-[15px] font-bold text-ph-text-secondary">해당하는 정산 건이 없어요</div>
            <div className="mt-[5px] text-[13.5px]">다른 상태 탭을 확인해 보세요.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>판매자</Th>
                  <Th>정산 기간</Th>
                  <Th align="right">판매</Th>
                  <Th align="right">총 거래액</Th>
                  <Th align="right">수수료</Th>
                  <Th align="right">지급액</Th>
                  <Th>상태</Th>
                  <Th align="right" width={260}>
                    액션
                  </Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const actions = actionsFor(r.status)
                  return (
                    <Tr key={r.id}>
                      <Td>
                        <Identity name={r.sellerName} sub={r.shop} />
                      </Td>
                      <Td>
                        <span className="whitespace-nowrap text-ph-text-secondary">
                          {fmtPeriod(r.periodStart, r.periodEnd)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {r.productCount.toLocaleString('ko-KR')}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.totalAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="text-ph-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          −{won(r.feeTotalAmount)}
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {won(r.settlementTotalAmount)}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                      <Td align="right">
                        <div className="inline-flex justify-end gap-[6px]">
                          {actions.length > 0 ? (
                            actions.map((a) => {
                              const meta = ACTION_META[a]
                              const Icon = meta.Icon
                              return (
                                <RowBtn key={a} tone={meta.tone} onClick={() => onActionClick(r, a)} disabled={actingId === r.id}>
                                  <Icon size={15} />
                                  {meta.label}
                                </RowBtn>
                              )
                            })
                          ) : r.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-[5px] text-[13px] text-ph-text-muted">
                              <CheckCheck size={15} className="text-ph-primary" />
                              지급 완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-[5px] text-[13px] text-ph-text-muted">
                              <XCircle size={15} />
                              취소됨
                            </span>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!cancelTarget}
        title="정산을 취소하시겠어요?"
        description={
          <>
            <b>{cancelTarget?.sellerName}</b>의 {cancelTarget && fmtPeriod(cancelTarget.periodStart, cancelTarget.periodEnd)}{' '}
            정산 건을 취소합니다. 취소 후에는 <b>되돌릴 수 없습니다.</b>
          </>
        }
        confirmLabel="정산 취소"
        cancelLabel="닫기"
        confirmVariant="danger"
        loading={!!cancelTarget && actingId === cancelTarget.id}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
