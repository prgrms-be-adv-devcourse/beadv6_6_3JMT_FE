import type {
  AdminSettlementDeliverySummary,
  SettlementDeliveryStatus,
} from '@/lib/settlementDeliveryContracts'

export interface SettlementDeliverySummaryCard {
  status: SettlementDeliveryStatus
  label: string
  description: string
  countKey: 'calculatedCount' | 'reconciledCount' | 'deliveryFailedCount' | 'mismatchCount'
}

export const SETTLEMENT_DELIVERY_SUMMARY_CARDS: SettlementDeliverySummaryCard[] = [
  {
    status: 'CALCULATED',
    label: '전달 대기',
    description: '전달 작업을 기다리는 건',
    countKey: 'calculatedCount',
  },
  {
    status: 'RECONCILED',
    label: '정상 대사',
    description: 'User Service와 일치',
    countKey: 'reconciledCount',
  },
  {
    status: 'DELIVERY_FAILED',
    label: '전달 실패',
    description: '재전송 확인이 필요한 건',
    countKey: 'deliveryFailedCount',
  },
  {
    status: 'MISMATCH',
    label: '데이터 불일치',
    description: '수동 확인이 필요한 건',
    countKey: 'mismatchCount',
  },
]

export function settlementDeliveryProblemCount(
  summary: AdminSettlementDeliverySummary | null,
): number | null {
  if (!summary) return null
  return summary.deliveryFailedCount + summary.mismatchCount
}

export function settlementDeliveryTotalCount(
  summary: AdminSettlementDeliverySummary | null,
): number | null {
  if (!summary) return null
  return (
    summary.calculatedCount +
    summary.reconciledCount +
    summary.deliveryFailedCount +
    summary.mismatchCount
  )
}

export function formatSettlementDeliveryCount(count: number | null): string {
  return count === null ? '-' : `${count.toLocaleString('ko-KR')}건`
}

export function formatSettlementDeliveryDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

export function shortenSettlementDeliveryId(value: string): string {
  if (!value) return '-'
  return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value
}
