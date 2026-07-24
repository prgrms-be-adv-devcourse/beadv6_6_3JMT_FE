'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  size: number
  total: number
  hasNext: boolean
  onPageChange: (newPage: number) => void
  onSizeChange: (newSize: number) => void
}

export function Pagination({
  page,
  size,
  total,
  hasNext,
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  const canPrev = page > 1
  const canNext = hasNext

  // Calculate page numbers to show (e.g. up to 5 surrounding pages)
  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-ph-border px-6 py-4 sm:flex-row">
      <div className="flex items-center gap-2 text-[13px] text-ph-text-muted">
        <span>페이지 당 항목:</span>
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="rounded-ph-sm border border-ph-border bg-ph-bg px-2 py-1 text-[13px] font-medium text-ph-text focus:border-ph-primary focus:outline-none"
        >
          <option value={20}>20개씩</option>
          <option value={50}>50개씩</option>
          <option value={100}>100개씩</option>
        </select>
        <span className="ml-2">
          총 <strong className="font-semibold text-ph-text">{total.toLocaleString()}</strong>건 중{' '}
          {Math.min((page - 1) * size + 1, total)}-{Math.min(page * size, total)}건
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-ph-sm border border-ph-border px-2.5 text-[13px] font-medium text-ph-text hover:bg-ph-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={15} /> 이전
        </button>

        {getPageNumbers().map((p) => {
          const isActive = p === page
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-[32px] rounded-ph-sm px-2 text-[13px] font-semibold transition-colors ${
                isActive
                  ? 'bg-ph-primary text-ph-on-accent'
                  : 'text-ph-text-secondary hover:bg-ph-gray-100'
              }`}
            >
              {p}
            </button>
          )
        })}

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-ph-sm border border-ph-border px-2.5 text-[13px] font-medium text-ph-text hover:bg-ph-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
        >
          다음 <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
