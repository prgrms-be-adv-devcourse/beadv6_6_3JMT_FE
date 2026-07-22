export type SettlementDisplayStatus =
  | 'WAITING'
  | 'APPROVAL_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED'

export type SettlementActionType =
  | 'REQUEST_PAYOUT'
  | 'APPROVE'
  | 'HOLD'
  | 'RELEASE_HOLD'
  | 'PAYOUT'
  | 'PAYOUT_HOLD'
  | 'RELEASE_PAYOUT_HOLD'
  | 'CANCEL'

export interface SettlementStatusCount {
  status: SettlementDisplayStatus
  statusLabel: string
  count: number
}

export interface SettlementAction {
  type: SettlementActionType
  label: string
}

export interface WeeklySettlement {
  settlementId: string
  periodStart: string
  periodEnd: string
  salesCount: number
  grossAmount: number
  feeAmount: number
  refundAmount: number
  payoutAmount: number
  status: SettlementDisplayStatus
  statusLabel: string
  calculatedAt: string | null
  approvedAt: string | null
  payoutRequestedAt: string | null
  paidAt: string | null
  cancelledAt: string | null
  availableActions: SettlementAction[]
}

export interface MonthlySettlement {
  settlementMonth: string
  weeklySettlementCount: number
  aggregatedSettlementCount: number
  salesCount: number
  grossAmount: number
  feeAmount: number
  refundAmount: number
  payoutAmount: number
  statusCounts: SettlementStatusCount[]
}

export type SellerMonthlySettlement = MonthlySettlement

export interface AdminMonthlySettlement extends MonthlySettlement {
  sellerId: string
  sellerName: string | null
}

export interface SellerSettlementDetail extends SellerMonthlySettlement {
  weeklySettlements: WeeklySettlement[]
}

export interface AdminSettlementDetail extends AdminMonthlySettlement {
  weeklySettlements: WeeklySettlement[]
}

export interface SettlementPage<T> {
  items: T[]
  totalElements: number
  page: number
  size: number
}

export interface SettlementListParams {
  status?: SettlementDisplayStatus
  settlementMonth?: string
  page?: number
  size?: number
}

type RawRecord = Record<string, unknown>

function record(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {}
}

function records(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.map(record) : []
}

function nullableString(value: unknown): string | null {
  return value == null || value === '' ? null : String(value)
}

function mapStatusCounts(value: unknown): SettlementStatusCount[] {
  return records(value).map((item) => ({
    status: item.status as SettlementDisplayStatus,
    statusLabel: String(item.statusLabel ?? ''),
    count: Number(item.count ?? 0),
  }))
}

function mapActions(value: unknown): SettlementAction[] {
  return records(value).map((item) => ({
    type: item.type as SettlementActionType,
    label: String(item.label ?? ''),
  }))
}

function mapMonthlySettlement(value: unknown): MonthlySettlement {
  const item = record(value)
  return {
    settlementMonth: String(item.settlementMonth ?? ''),
    weeklySettlementCount: Number(item.weeklySettlementCount ?? 0),
    aggregatedSettlementCount: Number(item.aggregatedSettlementCount ?? 0),
    salesCount: Number(item.salesCount ?? 0),
    grossAmount: Number(item.grossAmount ?? 0),
    feeAmount: Number(item.feeAmount ?? 0),
    refundAmount: Number(item.refundAmount ?? 0),
    payoutAmount: Number(item.payoutAmount ?? 0),
    statusCounts: mapStatusCounts(item.statusCounts),
  }
}

function mapWeeklySettlement(value: unknown): WeeklySettlement {
  const item = record(value)
  return {
    settlementId: String(item.settlementId ?? ''),
    periodStart: String(item.periodStart ?? ''),
    periodEnd: String(item.periodEnd ?? ''),
    salesCount: Number(item.salesCount ?? 0),
    grossAmount: Number(item.grossAmount ?? 0),
    feeAmount: Number(item.feeAmount ?? 0),
    refundAmount: Number(item.refundAmount ?? 0),
    payoutAmount: Number(item.payoutAmount ?? 0),
    status: item.status as SettlementDisplayStatus,
    statusLabel: String(item.statusLabel ?? ''),
    calculatedAt: nullableString(item.calculatedAt),
    approvedAt: nullableString(item.approvedAt),
    payoutRequestedAt: nullableString(item.payoutRequestedAt),
    paidAt: nullableString(item.paidAt),
    cancelledAt: nullableString(item.cancelledAt),
    availableActions: mapActions(item.availableActions),
  }
}

// eslint-disable-next-line no-unused-vars
function mapPage<T>(value: unknown, mapper: (_item: unknown) => T): SettlementPage<T> {
  const body = record(value)
  const items = records(body.items).map(mapper)
  return {
    items,
    totalElements: Number(body.totalElements ?? items.length),
    page: Number(body.page ?? 0),
    size: Number(body.size ?? items.length),
  }
}

export function mapSellerSettlementList(value: unknown): SettlementPage<SellerMonthlySettlement> {
  return mapPage(value, mapMonthlySettlement)
}

export function mapAdminSettlementList(value: unknown): SettlementPage<AdminMonthlySettlement> {
  return mapPage(value, (raw) => {
    const item = record(raw)
    return {
      sellerId: String(item.sellerId ?? ''),
      sellerName: nullableString(item.sellerName),
      ...mapMonthlySettlement(item),
    }
  })
}

export function mapSellerSettlementDetail(value: unknown): SellerSettlementDetail {
  const body = record(value)
  return {
    ...mapMonthlySettlement(body),
    weeklySettlements: records(body.weeklySettlements).map(mapWeeklySettlement),
  }
}

export function mapAdminSettlementDetail(value: unknown): AdminSettlementDetail {
  const body = record(value)
  return {
    sellerId: String(body.sellerId ?? ''),
    sellerName: nullableString(body.sellerName),
    ...mapMonthlySettlement(body),
    weeklySettlements: records(body.weeklySettlements).map(mapWeeklySettlement),
  }
}

export function adminActionPath(action: Exclude<SettlementActionType, 'REQUEST_PAYOUT'>): string {
  const paths: Record<Exclude<SettlementActionType, 'REQUEST_PAYOUT'>, string> = {
    APPROVE: 'approve',
    HOLD: 'hold',
    RELEASE_HOLD: 'release-hold',
    PAYOUT: 'payout',
    PAYOUT_HOLD: 'payout-hold',
    RELEASE_PAYOUT_HOLD: 'payout-hold/release',
    CANCEL: 'cancel',
  }
  return paths[action]
}
