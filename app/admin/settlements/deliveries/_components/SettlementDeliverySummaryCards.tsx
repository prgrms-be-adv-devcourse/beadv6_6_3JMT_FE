import { CircleCheck, CircleX, Clock3, TriangleAlert, type LucideIcon } from 'lucide-react'

import type {
  AdminSettlementDeliverySummary,
  SettlementDeliveryStatus,
} from '@/lib/settlementDeliveryContracts'

import {
  formatSettlementDeliveryCount,
  SETTLEMENT_DELIVERY_SUMMARY_CARDS,
} from './settlementDeliveryPresentation'

const STATUS_STYLE: Record<
  SettlementDeliveryStatus,
  { Icon: LucideIcon; iconClassName: string; iconWrapClassName: string }
> = {
  CALCULATED: {
    Icon: Clock3,
    iconClassName: 'text-ph-text-secondary',
    iconWrapClassName: 'bg-ph-gray-100',
  },
  RECONCILED: {
    Icon: CircleCheck,
    iconClassName: 'text-ph-primary',
    iconWrapClassName: 'bg-ph-secondary',
  },
  DELIVERY_FAILED: {
    Icon: CircleX,
    iconClassName: 'text-ph-error',
    iconWrapClassName: 'bg-[#fdeceb]',
  },
  MISMATCH: {
    Icon: TriangleAlert,
    iconClassName: 'text-ph-error',
    iconWrapClassName: 'bg-[#fdeceb]',
  },
}

interface SettlementDeliverySummaryCardsProps {
  summary: AdminSettlementDeliverySummary | null
  error: boolean
}

export default function SettlementDeliverySummaryCards({
  summary,
  error,
}: SettlementDeliverySummaryCardsProps) {
  return (
    <div className="flex flex-col gap-ph-8">
      <div className="grid grid-cols-2 gap-ph-12 xl:grid-cols-4">
        {SETTLEMENT_DELIVERY_SUMMARY_CARDS.map((card) => {
          const { Icon, iconClassName, iconWrapClassName } = STATUS_STYLE[card.status]
          const count = summary ? summary[card.countKey] : null

          return (
            <div
              key={card.status}
              className="rounded-ph-lg border border-ph-border bg-ph-white px-ph-16 py-ph-16 sm:px-5 sm:py-[18px]"
            >
              <div className="flex items-center gap-ph-8 text-ph-caption font-semibold text-ph-text-secondary">
                <span
                  className={`inline-flex size-8 items-center justify-center rounded-ph-md ${iconWrapClassName}`}
                >
                  <Icon size={17} className={iconClassName} />
                </span>
                {card.label}
              </div>
              <div
                className="mt-ph-12 text-[24px] font-bold tracking-[-0.02em] text-ph-text"
                aria-live="polite"
              >
                {formatSettlementDeliveryCount(count)}
              </div>
              <p className="mt-ph-4 text-[12.5px] text-ph-text-muted">{card.description}</p>
            </div>
          )
        })}
      </div>
      {error && (
        <p className="text-right text-ph-caption text-ph-error">
          요약 정보를 불러오지 못했어요. 새로고침해 주세요.
        </p>
      )}
    </div>
  )
}
