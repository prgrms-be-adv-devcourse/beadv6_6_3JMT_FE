import type { Dispatch, FormEventHandler } from 'react'
import { LoaderCircle, RefreshCw, Search } from 'lucide-react'

import type {
  AdminSettlementDeliverySummary,
  SettlementDeliveryFilter,
} from '@/lib/settlementDeliveryContracts'

import {
  settlementDeliveryProblemCount,
  settlementDeliveryTotalCount,
} from './settlementDeliveryPresentation'

const FILTERS: Array<{
  value: SettlementDeliveryFilter
  label: string
  countKey?: keyof AdminSettlementDeliverySummary
}> = [
  { value: 'problem', label: '조치 필요' },
  { value: 'all', label: '전체' },
  { value: 'CALCULATED', label: '전달 대기', countKey: 'calculatedCount' },
  { value: 'RECONCILED', label: '정상 대사', countKey: 'reconciledCount' },
  {
    value: 'DELIVERY_FAILED',
    label: '전달 실패',
    countKey: 'deliveryFailedCount',
  },
  { value: 'MISMATCH', label: '데이터 불일치', countKey: 'mismatchCount' },
]

interface SettlementDeliveryToolbarProps {
  filter: SettlementDeliveryFilter
  summary: AdminSettlementDeliverySummary | null
  identifierInput: string
  onFilterChange: Dispatch<SettlementDeliveryFilter>
  onIdentifierChange: Dispatch<string>
  onSearch: FormEventHandler<HTMLFormElement>
}

export function SettlementDeliveryToolbar({
  filter,
  summary,
  identifierInput,
  onFilterChange,
  onIdentifierChange,
  onSearch,
}: SettlementDeliveryToolbarProps) {
  const countFor = (option: (typeof FILTERS)[number]): number | null => {
    if (option.value === 'problem') return settlementDeliveryProblemCount(summary)
    if (option.value === 'all') return settlementDeliveryTotalCount(summary)
    return summary && option.countKey ? summary[option.countKey] : null
  }

  return (
    <div className="flex flex-col gap-ph-12 xl:flex-row xl:items-center xl:justify-between">
      <div role="group" className="flex flex-wrap gap-ph-2xs" aria-label="전달 상태 필터">
        {FILTERS.map((option) => {
          const selected = filter === option.value
          const count = countFor(option)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              aria-pressed={selected}
              className={`inline-flex h-9 items-center gap-ph-8 rounded-ph-full border px-3.5 text-[13.5px] font-semibold transition-colors ${
                selected
                  ? 'border-transparent bg-ph-secondary text-ph-primary'
                  : 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50 hover:text-ph-text'
              }`}
            >
              {option.label}
              <span
                className={`text-xs font-bold ${
                  selected ? 'text-ph-primary' : 'text-ph-text-muted'
                }`}
              >
                {count === null ? '-' : count.toLocaleString('ko-KR')}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={onSearch} className="flex min-w-0 gap-ph-8 sm:min-w-[400px]">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">정산 ID 또는 전달 요청 ID</span>
          <Search
            size={16}
            className="absolute left-ph-12 top-1/2 -translate-y-1/2 text-ph-text-muted"
          />
          <input
            value={identifierInput}
            onChange={(event) => onIdentifierChange(event.target.value)}
            placeholder="정산 ID 또는 전달 요청 ID"
            autoComplete="off"
            spellCheck={false}
            className="h-9 w-full rounded-ph-sm border border-ph-border bg-ph-white pl-[36px] pr-ph-12 text-ph-caption outline-none transition-colors placeholder:text-ph-text-muted focus:border-ph-primary"
          />
        </label>
        <button
          type="submit"
          className="h-9 flex-shrink-0 rounded-ph-md bg-ph-primary px-ph-16 text-ph-caption font-semibold text-ph-on-accent transition-colors hover:bg-ph-blue-hover"
        >
          검색
        </button>
      </form>
    </div>
  )
}

interface SettlementDeliveryRefreshActionProps {
  loading: boolean
  retryInProgressCount: number
  onRefresh: () => void
}

export function SettlementDeliveryRefreshAction({
  loading,
  retryInProgressCount,
  onRefresh,
}: SettlementDeliveryRefreshActionProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-ph-8">
      {retryInProgressCount > 0 && (
        <span className="hidden items-center gap-ph-2xs rounded-ph-full bg-ph-secondary px-ph-12 py-ph-8 text-ph-caption font-semibold text-ph-primary sm:inline-flex">
          <LoaderCircle size={14} className="animate-spin" />
          재전송 {retryInProgressCount.toLocaleString('ko-KR')}건 진행 중
        </span>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-9 items-center gap-ph-8 rounded-ph-sm border border-ph-border bg-ph-white px-ph-12 text-ph-caption font-semibold text-ph-text-secondary transition-colors hover:bg-ph-gray-50 disabled:cursor-wait disabled:opacity-50"
      >
        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">새로고침</span>
      </button>
    </div>
  )
}
