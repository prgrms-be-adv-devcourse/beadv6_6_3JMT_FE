import { won } from '@/lib/utils'

interface SettlementAmountBreakdownProps {
  grossAmount: number
  feeAmount: number
  refundAmount: number
  payoutAmount: number
  className?: string
}

type SettlementAmountKey = keyof Omit<SettlementAmountBreakdownProps, 'className'>

interface AmountItem {
  key: SettlementAmountKey
  label: string
  deduction?: boolean
  emphasized?: boolean
}

const amountItems: AmountItem[] = [
  { key: 'grossAmount', label: '총 거래액' },
  { key: 'feeAmount', label: '수수료', deduction: true },
  { key: 'refundAmount', label: '환불', deduction: true },
  { key: 'payoutAmount', label: '지급액', emphasized: true },
]

export function SettlementAmountBreakdown({
  grossAmount,
  feeAmount,
  refundAmount,
  payoutAmount,
  className = '',
}: SettlementAmountBreakdownProps) {
  const amounts = { grossAmount, feeAmount, refundAmount, payoutAmount }

  return (
    <dl
      aria-label="주간 정산 금액"
      className={`grid grid-cols-2 gap-x-ph-16 gap-y-ph-12 sm:grid-cols-4 ${className}`}
    >
      {amountItems.map((item) => (
        <div key={item.key} className="min-w-0">
          <dt className="text-xs font-medium text-ph-text-muted">{item.label}</dt>
          <dd
            className={`mt-ph-4 truncate text-ph-body-sm font-semibold tabular-nums ${
              item.emphasized ? 'text-ph-primary' : 'text-ph-text'
            }`}
          >
            {item.deduction ? '−' : ''}
            {won(amounts[item.key])}
          </dd>
        </div>
      ))}
    </dl>
  )
}
