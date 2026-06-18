// 원본 shared-admin-ui.js SectionCard + LinkAction 이식
import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

interface SectionCardProps {
  title?: ReactNode
  sub?: ReactNode
  action?: ReactNode
  children?: ReactNode
  bodyStyle?: CSSProperties
  className?: string
}

export function SectionCard({ title, sub, action, children, bodyStyle, className }: SectionCardProps) {
  return (
    <section
      className={`flex flex-col rounded-ph-lg border border-ph-border bg-ph-white ${className ?? ''}`}
    >
      {(title || action) && (
        <div className="flex items-center gap-[14px] border-b border-ph-border px-[22px] py-[18px]">
          <div className="min-w-0 flex-1">
            {title && <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.01em]">{title}</h2>}
            {sub && <p className="mt-[4px] text-[13px] text-ph-text-muted">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div style={bodyStyle}>{children}</div>
    </section>
  )
}

// 카드 헤더의 "전체 보기 →" 텍스트 링크
export function LinkAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-[4px] p-[4px] text-[13.5px] font-semibold text-ph-primary"
    >
      {children} <ArrowRight size={15} />
    </button>
  )
}
