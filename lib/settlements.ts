// 정산 서비스(settlement-service) API 레이어
// 스펙: settlement-service/docs/settlement-api-for-frontend.md
// 주의: 정산 서비스는 공통 { success, data } 봉투 없이 응답 본문을 직접 내려준다.
//      또 금액(BigDecimal)은 문자열("459000.00")로 오므로 이 레이어에서 Number로 정규화한다.
//
// 로컬 직접 라우팅(NEXT_PUBLIC_LOCAL_PROXY_PATHS/TARGET)일 때의 게이트웨이 우회 + 헤더 주입은
// lib/directRouting.ts + lib/auth.ts에서 공통으로 처리한다. 이 파일은 항상 공용 api를 쓴다.
import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

/* === 상태값 === */

// SettlementDisplayStatus — 프론트가 필터·뱃지·액션 분기에 쓰는 표시 상태
export type SettlementDisplayStatus =
  | 'WAITING'
  | 'APPROVAL_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED'

// 표시 상태 → 한글 라벨 (관리자 목록은 displayStatus가 코드로 오므로 프론트가 매핑)
export const SETTLEMENT_STATUS_LABEL: Record<SettlementDisplayStatus, string> = {
  WAITING: '대기',
  APPROVAL_ON_HOLD: '승인 보류',
  APPROVED: '승인',
  PAYOUT_REQUESTED: '지급 신청',
  PAYOUT_ON_HOLD: '지급 보류',
  PAID: '지급 완료',
  CANCELLED: '취소',
}

/* === 관리자 정산 관리 === */

export interface AdminSettlementItem {
  settlementId: string
  sellerId: string
  sellerName: string | null
  periodStart: string // "2026-06-01"
  periodEnd: string // "2026-06-30"
  productCount: number
  totalAmount: number // 총 거래액
  feeTotalAmount: number // 수수료
  settlementTotalAmount: number // 지급액
  displayStatus: SettlementDisplayStatus
  calculatedAt: string | null // 정산 산출(배치 실행) 시각
}

export interface AdminSettlementList {
  items: AdminSettlementItem[]
  totalElements: number
  page: number
  size: number
}

export interface SettlementSummaryCard {
  status: SettlementDisplayStatus
  totalAmount: number
  count: number
}

function toAdminItem(raw: Record<string, unknown>): AdminSettlementItem {
  return {
    settlementId: String(raw.settlementId),
    sellerId: String(raw.sellerId),
    sellerName: (raw.sellerName as string | null) ?? null,
    periodStart: String(raw.periodStart),
    periodEnd: String(raw.periodEnd),
    productCount: Number(raw.productCount ?? 0),
    totalAmount: Number(raw.totalAmount ?? 0),
    feeTotalAmount: Number(raw.feeTotalAmount ?? 0),
    settlementTotalAmount: Number(raw.settlementTotalAmount ?? 0),
    displayStatus: raw.displayStatus as SettlementDisplayStatus,
    calculatedAt: (raw.calculatedAt as string | null) ?? null,
  }
}

// GET /api/v2/admin/settlements/summary — 상태별 합계·건수
// 응답은 공통 ApiResult 봉투({ success, data, message })이므로 res.data.data가 실제 페이로드
export async function getAdminSettlementSummary(): Promise<SettlementSummaryCard[]> {
  const res = await api.get(`${API_BASE}/admin/settlements/summary`)
  const cards = (res.data?.data?.cards ?? []) as Record<string, unknown>[]
  return cards.map((c) => ({
    status: c.status as SettlementDisplayStatus,
    totalAmount: Number(c.totalAmount ?? 0),
    count: Number(c.count ?? 0),
  }))
}

// GET /api/v2/admin/settlements — 정산 목록 (상태 필터·0-base 페이징)
export async function getAdminSettlements(params: {
  status?: SettlementDisplayStatus
  page?: number
  size?: number
} = {}): Promise<AdminSettlementList> {
  const res = await api.get(`${API_BASE}/admin/settlements`, { params })
  const body = res.data?.data ?? {}
  const items = (body.items ?? []) as Record<string, unknown>[]
  return {
    items: items.map(toAdminItem),
    totalElements: Number(body.totalElements ?? items.length),
    page: Number(body.page ?? 0),
    size: Number(body.size ?? items.length),
  }
}

// 관리자 상태 전이 — 각 action이 개별 PATCH 엔드포인트로 매핑된다 (바디 없음)
export type AdminSettlementAction =
  | 'approve' // 승인 (대기 → 승인)
  | 'hold' // 승인 보류 (대기 → 승인보류)
  | 'release-hold' // 승인 보류 해제 (보류 → 대기)
  | 'payout' // 지급 처리 (준비 → 지급완료)
  | 'payout-hold' // 지급 보류 (준비 → 지급보류)
  | 'payout-hold-release' // 지급 보류 해제 (지급보류 → 준비)
  | 'cancel' // 정산 취소

const ADMIN_ACTION_PATH: Record<AdminSettlementAction, string> = {
  approve: 'approve',
  hold: 'hold',
  'release-hold': 'release-hold',
  payout: 'payout',
  'payout-hold': 'payout-hold',
  'payout-hold-release': 'payout-hold/release',
  cancel: 'cancel',
}

export async function runAdminSettlementAction(
  settlementId: string,
  action: AdminSettlementAction,
): Promise<void> {
  await api.patch(`${API_BASE}/admin/settlements/${settlementId}/${ADMIN_ACTION_PATH[action]}`)
}

/* === 판매자 정산 조회 === */

export interface SellerSettlementSummary {
  registeredPromptCount: number
  totalSalesCount: number
  totalRevenueAmount: number
  totalSettlementAmount: number
}

export interface SellerSettlementItem {
  settlementId: string
  period: string // "2026-06"
  periodStart: string
  periodEnd: string
  salesCount: number
  grossAmount: number // 총 거래액
  feeAmount: number // 판매 수수료
  refundAmount: number // 환불 차감액
  adjustmentAmount: number
  payoutAmount: number // 최종 지급 예정/완료 금액
  status: SettlementDisplayStatus // 코드
  statusLabel: string // 한글 라벨 (백엔드 displayStatus)
  canRequestPayout: boolean // availableActions에 REQUEST_PAYOUT 포함 여부
}

export interface SellerSettlementList {
  items: SellerSettlementItem[]
  totalElements: number
  page: number
  size: number
}

interface RawAvailableAction {
  type: string
  label: string
}

function toSellerItem(raw: Record<string, unknown>): SellerSettlementItem {
  const actions = (raw.availableActions ?? []) as RawAvailableAction[]
  return {
    settlementId: String(raw.settlementId),
    period: String(raw.period),
    periodStart: String(raw.periodStart),
    periodEnd: String(raw.periodEnd),
    salesCount: Number(raw.salesCount ?? 0),
    grossAmount: Number(raw.grossAmount ?? 0),
    feeAmount: Number(raw.feeAmount ?? 0),
    refundAmount: Number(raw.refundAmount ?? 0),
    adjustmentAmount: Number(raw.adjustmentAmount ?? 0),
    payoutAmount: Number(raw.payoutAmount ?? 0),
    status: raw.status as SettlementDisplayStatus,
    statusLabel: String(raw.displayStatus ?? ''),
    canRequestPayout: actions.some((a) => a.type === 'REQUEST_PAYOUT'),
  }
}

// GET /api/v2/sellers/me/settlements/summary — 내 상점 요약 지표
export async function getSellerSettlementSummary(): Promise<SellerSettlementSummary> {
  const res = await api.get(`${API_BASE}/sellers/me/settlements/summary`)
  const d = res.data?.data ?? {}
  return {
    registeredPromptCount: Number(d.registeredPromptCount ?? 0),
    totalSalesCount: Number(d.totalSalesCount ?? 0),
    totalRevenueAmount: Number(d.totalRevenueAmount ?? 0),
    totalSettlementAmount: Number(d.totalSettlementAmount ?? 0),
  }
}

// GET /api/v2/sellers/me/settlements — 본인 정산 내역 (상태·월 필터·0-base 페이징)
export async function getSellerSettlements(params: {
  status?: SettlementDisplayStatus
  period?: string // "yyyy-MM"
  page?: number
  size?: number
} = {}): Promise<SellerSettlementList> {
  const res = await api.get(`${API_BASE}/sellers/me/settlements`, { params })
  const body = res.data?.data ?? {}
  const items = (body.items ?? []) as Record<string, unknown>[]
  return {
    items: items.map(toSellerItem),
    totalElements: Number(body.totalElements ?? items.length),
    page: Number(body.page ?? 0),
    size: Number(body.size ?? items.length),
  }
}

// PATCH /api/v2/sellers/me/settlements/{id}/payout-request — 지급 신청 (승인완료 → 지급신청)
export async function requestSettlementPayout(settlementId: string): Promise<void> {
  await api.patch(`${API_BASE}/sellers/me/settlements/${settlementId}/payout-request`)
}

/* === 정산 배치잡 (수동 정산, 관리자) === */

export interface SettlementJob {
  jobExecutionId: number
  jobName: string
  status: string // 접수 시점 STARTING/STARTED
  startTime: string
}

export interface SettlementJobStatus {
  jobExecutionId: number
  jobName: string
  status: string // STARTING/STARTED/COMPLETED/FAILED/STOPPED
  exitCode: string // COMPLETED/FAILED, 실행 중엔 UNKNOWN
  startTime: string
  endTime: string | null
  failureMessage: string | null
}

// POST /api/v2/admin/settlements/batch — 정산 배치잡 비동기 실행 접수 (202)
export async function runSettlementBatch(period: string): Promise<SettlementJob> {
  const res = await api.post(`${API_BASE}/admin/settlements/batch`, { period })
  const d = res.data?.data ?? {}
  return {
    jobExecutionId: Number(d.jobExecutionId),
    jobName: String(d.jobName ?? ''),
    status: String(d.status ?? ''),
    startTime: String(d.startTime ?? ''),
  }
}

// GET /api/v2/admin/settlements/batch/{jobExecutionId} — 배치잡 상태 조회(폴링용)
export async function getSettlementJobStatus(jobExecutionId: number): Promise<SettlementJobStatus> {
  const res = await api.get(`${API_BASE}/admin/settlements/batch/${jobExecutionId}`)
  const d = res.data?.data ?? {}
  return {
    jobExecutionId: Number(d.jobExecutionId),
    jobName: String(d.jobName ?? ''),
    status: String(d.status ?? ''),
    exitCode: String(d.exitCode ?? ''),
    startTime: String(d.startTime ?? ''),
    endTime: d.endTime ? String(d.endTime) : null,
    failureMessage: d.failureMessage ? String(d.failureMessage) : null,
  }
}
