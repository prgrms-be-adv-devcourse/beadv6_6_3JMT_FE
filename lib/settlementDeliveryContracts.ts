export type SettlementDeliveryStatus = 'CALCULATED' | 'RECONCILED' | 'DELIVERY_FAILED' | 'MISMATCH'

export type SettlementDeliveryAction = 'RETRY'

export type SettlementDeliveryFilter = 'all' | 'problem' | SettlementDeliveryStatus

export interface AdminSettlementDelivery {
  settlementDeliveryId: string
  settlementId: string
  deliveryRequestId: string
  status: SettlementDeliveryStatus
  attemptCount: number
  statusReason: string | null
  firstAttemptAt: string | null
  lastAttemptAt: string | null
  reconciledAt: string | null
  retryInProgress: boolean
  availableActions: SettlementDeliveryAction[]
}

export interface AdminSettlementDeliveryPage {
  items: AdminSettlementDelivery[]
  totalElements: number
  page: number
  size: number
}

export interface AdminSettlementDeliverySummary {
  calculatedCount: number
  reconciledCount: number
  deliveryFailedCount: number
  mismatchCount: number
  retryInProgressCount: number
}

type QueryValue = string | number | boolean

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : []
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '')
}

function asNullableString(value: unknown): string | null {
  return value === null || value === undefined || value === '' ? null : asString(value)
}

function asNumber(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 'true'
}

function asStatus(value: unknown): SettlementDeliveryStatus {
  switch (value) {
    case 'RECONCILED':
    case 'DELIVERY_FAILED':
    case 'MISMATCH':
      return value
    default:
      return 'CALCULATED'
  }
}

function mapAdminSettlementDelivery(value: unknown): AdminSettlementDelivery {
  const delivery = asRecord(value)
  const availableActions = Array.isArray(delivery.availableActions)
    ? delivery.availableActions.filter(
        (action): action is SettlementDeliveryAction => action === 'RETRY',
      )
    : []

  return {
    settlementDeliveryId: asString(delivery.settlementDeliveryId),
    settlementId: asString(delivery.settlementId),
    deliveryRequestId: asString(delivery.deliveryRequestId),
    status: asStatus(delivery.status),
    attemptCount: asNumber(delivery.attemptCount),
    statusReason: asNullableString(delivery.statusReason),
    firstAttemptAt: asNullableString(delivery.firstAttemptAt),
    lastAttemptAt: asNullableString(delivery.lastAttemptAt),
    reconciledAt: asNullableString(delivery.reconciledAt),
    retryInProgress: asBoolean(delivery.retryInProgress),
    availableActions,
  }
}

export function mapAdminSettlementDeliveryPage(value: unknown): AdminSettlementDeliveryPage {
  const page = asRecord(value)
  const items = asRecords(page.items).map(mapAdminSettlementDelivery)

  return {
    items,
    totalElements:
      page.totalElements === undefined ? items.length : asNumber(page.totalElements),
    page: asNumber(page.page),
    size: asNumber(page.size || 20),
  }
}

export function mapAdminSettlementDeliverySummary(value: unknown): AdminSettlementDeliverySummary {
  const summary = asRecord(value)

  return {
    calculatedCount: asNumber(summary.calculatedCount),
    reconciledCount: asNumber(summary.reconciledCount),
    deliveryFailedCount: asNumber(summary.deliveryFailedCount),
    mismatchCount: asNumber(summary.mismatchCount),
    retryInProgressCount: asNumber(summary.retryInProgressCount),
  }
}

export function buildAdminSettlementDeliveryQuery(
  filter: SettlementDeliveryFilter,
  identifier: string,
  page: number,
  size: number,
): Record<string, QueryValue> {
  const query: Record<string, QueryValue> = { page, size }
  const normalizedIdentifier = identifier.trim()

  if (filter === 'problem') {
    query.problemOnly = true
  } else if (filter !== 'all') {
    query.status = filter
  }

  if (normalizedIdentifier) {
    query.identifier = normalizedIdentifier
  }

  return query
}

export function canRetrySettlementDelivery(delivery: AdminSettlementDelivery): boolean {
  return !delivery.retryInProgress && delivery.availableActions.includes('RETRY')
}
