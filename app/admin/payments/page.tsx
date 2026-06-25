'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Clock, CircleCheck, PauseCircle, Banknote, Check, Pause, RotateCcw, X, CheckCheck, XCircle, Play, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { SectionCard } from '@/components/admin/SectionCard'
import { StatusBadge } from '@/components/admin/Badge'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import ConfirmDialog from '@/components/modals/ConfirmDialog'
import {
  getAdminSettlements,
  getAdminSettlementSummary,
  runAdminSettlementAction,
  runSettlementBatch,
  getSettlementJobStatus,
  SETTLEMENT_STATUS_LABEL,
  type AdminSettlementItem,
  type AdminSettlementAction,
  type SettlementDisplayStatus,
  type SettlementSummaryCard,
} from '@/lib/settlements'

const PAGE_SIZE = 20

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`

// 상태별 노출 액션 (정산 표시 상태 → 가능한 관리자 액션)
// 백엔드 Settlement 도메인 전이 가드와 1:1로 맞춘다.
// 주의: APPROVED(지급 준비/READY)에서는 관리자가 지급·지급보류를 할 수 없다.
//      판매자가 먼저 "지급 신청"(→ PAYOUT_REQUESTED)해야 지급/지급보류가 가능하다.
function actionsFor(status: SettlementDisplayStatus): AdminSettlementAction[] {
  switch (status) {
    case 'WAITING':
      return ['approve', 'hold', 'cancel']
    case 'APPROVAL_ON_HOLD':
      return ['release-hold', 'cancel']
    case 'APPROVED':
      return ['cancel'] // 지급/지급보류는 판매자 지급 신청 후(PAYOUT_REQUESTED)에만 가능
    case 'PAYOUT_REQUESTED':
      return ['payout', 'payout-hold', 'cancel']
    case 'PAYOUT_ON_HOLD':
      return ['payout-hold-release', 'cancel']
    default:
      return []
  }
}

const ACTION_META: Record<
  AdminSettlementAction,
  { label: string; tone: 'solid' | 'neutral' | 'danger'; Icon: typeof Check }
> = {
  approve: { label: '승인', tone: 'solid', Icon: Check },
  payout: { label: '지급', tone: 'solid', Icon: Banknote },
  hold: { label: '보류', tone: 'neutral', Icon: Pause },
  'payout-hold': { label: '보류', tone: 'neutral', Icon: Pause },
  'release-hold': { label: '보류 취소', tone: 'neutral', Icon: RotateCcw },
  'payout-hold-release': { label: '보류 취소', tone: 'neutral', Icon: RotateCcw },
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

// 정산 산출 시각: "2026-07-01T02:00:00" → "2026.07.01 02:00"
function fmtDateTime(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const TABS: { id: 'all' | SettlementDisplayStatus; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'WAITING', label: '대기' },
  { id: 'APPROVAL_ON_HOLD', label: '승인 보류' },
  { id: 'APPROVED', label: '승인' },
  { id: 'PAYOUT_REQUESTED', label: '지급 신청' },
  { id: 'PAYOUT_ON_HOLD', label: '지급 보류' },
  { id: 'PAID', label: '지급 완료' },
  { id: 'CANCELLED', label: '취소' },
]

export default function AdminPaymentsPage() {
  const { token } = useAuthStore()
  const [rows, setRows] = useState<AdminSettlementItem[]>([])
  const [summary, setSummary] = useState<SettlementSummaryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | SettlementDisplayStatus>('all')
  const [cancelTarget, setCancelTarget] = useState<AdminSettlementItem | null>(null)
  // 수동 정산(배치잡)
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchPeriod, setBatchPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [batchRunning, setBatchRunning] = useState(false)
  const [batchMsg, setBatchMsg] = useState<string | null>(null)
  // 액션 실패 안내 팝업
  const [actionError, setActionError] = useState<string | null>(null)

  const loadSummary = () => {
    getAdminSettlementSummary()
      .then(setSummary)
      .catch(() => setSummary([]))
  }

  // 상태 필터 + 페이지(0-base). append=true면 "더 보기"로 누적
  const loadList = (f: 'all' | SettlementDisplayStatus, page: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    getAdminSettlements({ status: f === 'all' ? undefined : f, page, size: PAGE_SIZE })
      .then((res) => {
        setRows((prev) => (append ? [...prev, ...res.items] : res.items))
        setHasNext((res.page + 1) * res.size < res.totalElements)
      })
      .catch(() => {
        if (!append) setRows([])
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }

  useEffect(() => {
    // 마운트 시 무조건 1회 발사. 인증은 직접모드=env 헤더, mock/게이트웨이=axios 인터셉터가
    // 요청 시점에 처리하므로 React token 상태를 기다릴 필요 없음.
    // token이 늦게 하이드레이션되면(mock) 그 변화에 맞춰 한 번 더 갱신.
    loadSummary()
    loadList('all', 0, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const changeFilter = (f: 'all' | SettlementDisplayStatus) => {
    setFilter(f)
    loadList(f, 0, false)
  }

  // 정산 배치잡 상태 폴링 (COMPLETED/FAILED까지)
  const pollJob = async (jobExecutionId: number): Promise<{ ok: boolean; msg?: string | null }> => {
    for (let i = 0; i < 40; i++) {
      const st = await getSettlementJobStatus(jobExecutionId)
      if (st.status === 'COMPLETED') return { ok: true }
      if (st.status === 'FAILED' || st.status === 'STOPPED') return { ok: false, msg: st.failureMessage }
      await new Promise((r) => setTimeout(r, 1500))
    }
    return { ok: false, msg: '상태 확인 시간 초과' }
  }

  // 수동 정산 실행: POST로 접수 → 상태 폴링 → 완료 시 목록/요약 갱신
  const runBatch = async () => {
    if (!/^\d{4}-\d{2}$/.test(batchPeriod)) {
      setBatchMsg('기준 월(YYYY-MM)을 선택하세요.')
      return
    }
    setBatchRunning(true)
    setBatchMsg('정산 배치 실행 중…')
    try {
      const job = await runSettlementBatch(batchPeriod)
      const res = await pollJob(job.jobExecutionId)
      if (res.ok) {
        setBatchMsg(`${batchPeriod} 정산 배치가 완료됐어요.`)
        loadSummary()
        loadList(filter, 0, false)
      } else {
        setBatchMsg(`정산 배치 실패: ${res.msg ?? '알 수 없는 오류'}`)
      }
    } catch {
      setBatchMsg('정산 배치 요청에 실패했어요. (권한/연결 확인)')
    } finally {
      setBatchRunning(false)
    }
  }

  const act = async (id: string, action: AdminSettlementAction) => {
    setActingId(id)
    try {
      await runAdminSettlementAction(id, action)
      loadSummary()
      loadList(filter, 0, false)
    } catch (e) {
      // 백엔드 상태 전이 가드 위반(S-013 등) — 사유를 팝업으로 안내
      const data = (e as { response?: { data?: { message?: string } } })?.response?.data
      const base = data?.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
      const hint =
        action === 'payout' || action === 'payout-hold'
          ? ' 지급·지급보류는 판매자가 먼저 "지급 신청"(지급 신청 상태)한 뒤에만 가능합니다.'
          : ''
      setActionError(base + hint)
      // 상태가 어긋났을 수 있으니 최신 목록으로 갱신
      loadSummary()
      loadList(filter, 0, false)
    } finally {
      setActingId(null)
    }
  }

  // 취소는 되돌릴 수 없으므로 확인 다이얼로그를 거친다
  const onActionClick = (row: AdminSettlementItem, action: AdminSettlementAction) => {
    if (action === 'cancel') {
      setCancelTarget(row)
      return
    }
    act(row.settlementId, action)
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    await act(cancelTarget.settlementId, 'cancel')
    setCancelTarget(null)
  }

  // 요약 카드 — /summary 응답을 그룹핑
  const sumBy = (statuses: SettlementDisplayStatus[]) =>
    summary.filter((c) => statuses.includes(c.status)).reduce((acc, c) => acc + c.totalAmount, 0)
  const countBy = (statuses: SettlementDisplayStatus[]) =>
    summary.filter((c) => statuses.includes(c.status)).reduce((acc, c) => acc + c.count, 0)

  const summaryCards = [
    { label: '정산 대기', Icon: Clock, value: sumBy(['WAITING', 'APPROVAL_ON_HOLD']), note: `${countBy(['WAITING', 'APPROVAL_ON_HOLD'])}건` },
    { label: '승인 완료', Icon: CircleCheck, value: sumBy(['APPROVED', 'PAYOUT_REQUESTED']), note: `${countBy(['APPROVED', 'PAYOUT_REQUESTED'])}건` },
    { label: '지급 보류', Icon: PauseCircle, value: sumBy(['PAYOUT_ON_HOLD']), note: `${countBy(['PAYOUT_ON_HOLD'])}건` },
    { label: '지급 완료', Icon: Banknote, value: sumBy(['PAID']), note: `${countBy(['PAID'])}건` },
  ]

  const totalCount = summary.reduce((acc, c) => acc + c.count, 0)
  const tabCount = (id: 'all' | SettlementDisplayStatus) =>
    id === 'all' ? totalCount : summary.find((c) => c.status === id)?.count ?? 0

  return (
    <div className="flex flex-col gap-[20px]">
      {/* 수동 정산(배치) 실행 */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-end">
          <button
            onClick={() => { setBatchOpen((v) => !v); setBatchMsg(null) }}
            className="inline-flex h-[38px] items-center gap-[7px] rounded-ph-sm border border-ph-border bg-ph-white px-[16px] text-[13.5px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50"
          >
            <Play size={15} className="text-ph-primary" />
            수동 정산 실행
          </button>
        </div>
        {batchOpen && (
          <div className="rounded-ph-lg border border-ph-border bg-ph-white px-[20px] py-[18px]">
            <div className="flex flex-wrap items-end gap-[12px]">
              <label className="flex flex-col gap-[6px] text-[13px] font-semibold text-ph-text-secondary">
                기준 월
                <input
                  type="month"
                  value={batchPeriod}
                  onChange={(e) => setBatchPeriod(e.target.value)}
                  disabled={batchRunning}
                  className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-[12px] text-[14px] text-ph-text outline-none focus:border-ph-primary"
                />
              </label>
              <button
                onClick={runBatch}
                disabled={batchRunning}
                className="inline-flex h-[38px] items-center justify-center gap-[6px] rounded-ph-sm border border-transparent bg-ph-primary px-[18px] text-[13.5px] font-semibold text-white transition-colors hover:bg-ph-blue-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play size={15} />
                {batchRunning ? '실행 중…' : '정산 실행'}
              </button>
              {batchMsg && (
                <span className="text-[13px] text-ph-text-muted">{batchMsg}</span>
              )}
            </div>
            <p className="mt-[10px] text-[12.5px] text-ph-text-muted">
              해당 월의 미정산 결제 건을 정산합니다. 실행 후 완료까지 잠시 걸릴 수 있어요.
            </p>
          </div>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((s) => {
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
                  onClick={() => changeFilter(t.id)}
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
        ) : rows.length === 0 ? (
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
                  <Th align="center">정산 기간</Th>
                  <Th align="center">정산 일시</Th>
                  <Th align="center">판매</Th>
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
                {rows.map((r) => {
                  const actions = actionsFor(r.displayStatus)
                  return (
                    <Tr key={r.settlementId}>
                      <Td>
                        <Identity name={r.sellerName ?? '판매자'} />
                      </Td>
                      <Td align="center">
                        <span className="whitespace-nowrap text-ph-text-secondary">
                          {fmtPeriod(r.periodStart, r.periodEnd)}
                        </span>
                      </Td>
                      <Td align="center">
                        <span className="whitespace-nowrap text-ph-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {fmtDateTime(r.calculatedAt)}
                        </span>
                      </Td>
                      <Td align="center">
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
                        <StatusBadge status={r.displayStatus} label={SETTLEMENT_STATUS_LABEL[r.displayStatus]} />
                      </Td>
                      <Td align="right">
                        <div className="inline-flex items-center justify-end gap-[10px]">
                          {/* 승인(지급 준비) 상태: 판매자의 지급 신청을 기다리는 단계임을 안내 */}
                          {r.displayStatus === 'APPROVED' && (
                            <span className="inline-flex items-center gap-[5px] whitespace-nowrap text-[13px] text-ph-text-muted">
                              <Clock size={14} />
                              판매자 지급 신청 대기
                            </span>
                          )}
                          <div className="inline-flex items-center gap-[6px]">
                            {actions.length > 0 ? (
                              actions.map((a) => {
                                const meta = ACTION_META[a]
                                const Icon = meta.Icon
                                return (
                                  <RowBtn key={a} tone={meta.tone} onClick={() => onActionClick(r, a)} disabled={actingId === r.settlementId}>
                                    <Icon size={15} />
                                    {meta.label}
                                  </RowBtn>
                                )
                              })
                            ) : r.displayStatus === 'PAID' ? (
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
                        </div>
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Table>

            {hasNext && (
              <div className="border-t border-ph-border px-[22px] py-[16px] text-center">
                <button
                  onClick={() => loadList(filter, Math.ceil(rows.length / PAGE_SIZE), true)}
                  disabled={loadingMore}
                  className="inline-flex h-[38px] items-center justify-center rounded-ph-sm border border-ph-border bg-ph-white px-[20px] text-[13.5px] font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          <>
            <b>{cancelTarget?.sellerName ?? '판매자'}</b>의 {cancelTarget && fmtPeriod(cancelTarget.periodStart, cancelTarget.periodEnd)}{' '}
            정산 건을 취소합니다. 취소 후에는 <b>되돌릴 수 없습니다.</b>
          </>
        }
        confirmLabel="정산 취소"
        cancelLabel="닫기"
        confirmVariant="danger"
        loading={!!cancelTarget && actingId === cancelTarget.settlementId}
        onConfirm={confirmCancel}
        onCancel={() => setCancelTarget(null)}
      />

      {/* 액션 실패 안내 팝업 */}
      {actionError && (
        <div
          onClick={() => setActionError(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            className="w-full bg-ph-white p-[28px]"
            style={{ maxWidth: 420, borderRadius: 'var(--ph-radius-xl)' }}
          >
            <div className="mb-[16px] flex h-[44px] w-[44px] items-center justify-center rounded-ph-full" style={{ background: 'rgba(217,45,32,0.10)' }}>
              <AlertTriangle size={22} className="text-ph-error" />
            </div>
            <div className="mb-[8px] text-[18px] font-bold text-ph-text">처리할 수 없는 작업이에요</div>
            <p className="mb-[24px] text-[15px] leading-[1.6] text-ph-text-secondary">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="inline-flex h-[44px] w-full items-center justify-center rounded-ph-sm border border-transparent bg-ph-primary text-[15px] font-semibold text-white transition-colors hover:bg-ph-blue-hover"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
