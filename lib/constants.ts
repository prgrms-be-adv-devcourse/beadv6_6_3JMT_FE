import type { SettlementDisplayStatus } from '@/lib/settlementContracts'

export type SettlementFilter = 'all' | SettlementDisplayStatus

export const SETTLEMENT_STATUS_FILTERS: ReadonlyArray<{
  value: SettlementFilter
  label: string
}> = [
  { value: 'all', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'APPROVAL_ON_HOLD', label: '승인 보류' },
  { value: 'APPROVED', label: '승인' },
  { value: 'PAYOUT_REQUESTED', label: '지급 신청' },
  { value: 'PAYOUT_ON_HOLD', label: '지급 보류' },
  { value: 'PAID', label: '지급 완료' },
  { value: 'CANCELLED', label: '취소' },
]
