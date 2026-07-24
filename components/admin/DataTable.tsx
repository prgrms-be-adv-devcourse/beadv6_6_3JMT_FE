'use client'

// 원본 shared-admin-ui.js Table 프리미티브 이식
import { useState } from 'react'
import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <table
      className="w-full border-collapse font-ph"
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {children}
    </table>
  )
}

export function Th({
  children,
  align = 'left',
  width,
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  width?: number | string
}) {
  return (
    <th
      className="border-b border-ph-border px-[16px] py-[12px] text-[12.5px] font-semibold text-ph-text-muted"
      style={{ textAlign: align, whiteSpace: 'nowrap', width }}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  style,
}: {
  children?: ReactNode
  align?: 'left' | 'right' | 'center'
  style?: CSSProperties
}) {
  return (
    <td
      className="border-b border-ph-border px-[16px] py-[14px] align-middle text-[14px] text-ph-text"
      style={{ textAlign: align, ...style }}
    >
      {children}
    </td>
  )
}

export function Tr({
  children,
  onClick,
  active,
}: {
  children: ReactNode
  onClick?: () => void
  active?: boolean
}) {
  const [hover, setHover] = useState(false)
  const bg = active ? 'var(--ph-secondary)' : hover && onClick ? 'var(--ph-gray-50)' : 'transparent'
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        background: bg,
        transition: 'background-color .12s ease',
      }}
    >
      {children}
    </tr>
  )
}

// 원형 아바타 (design-system.js Avatar 이식 — imageUrl 있으면 실제 프로필 이미지, 없으면 이니셜 fallback)
export function Avatar({
  name = '',
  size = 40,
  imageUrl,
}: {
  name?: string
  size?: number
  imageUrl?: string | null
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full bg-ph-secondary font-bold text-ph-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials}
    </span>
  )
}

// 아바타 + 이름 + 부가정보 셀 (shared-admin-ui.js Identity)
export function Identity({
  name,
  sub,
  size = 36,
  imageUrl,
}: {
  name: string
  sub?: ReactNode
  size?: number
  imageUrl?: string | null
}) {
  return (
    <div className="flex items-center gap-[11px]">
      <Avatar name={name} size={size} imageUrl={imageUrl} />
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-ph-text">{name}</div>
        {sub && <div className="truncate text-[12.5px] text-ph-text-muted">{sub}</div>}
      </div>
    </div>
  )
}

export function DataPagination({
  page,
  size,
  total,
  hasNext,
  onPageChange,
}: {
  page: number
  size: number
  total?: number
  hasNext?: boolean
  onPageChange: (page: number) => void
}) {
  const totalPages = total === undefined ? undefined : Math.max(1, Math.ceil(total / size))
  const canPrevious = page > 0
  const canNext = totalPages === undefined ? !!hasNext : page + 1 < totalPages
  const pages =
    totalPages === undefined
      ? [page]
      : Array.from({ length: totalPages }, (_, index) => index).filter(
          (pageNumber) =>
            pageNumber === 0 || pageNumber === totalPages - 1 || Math.abs(pageNumber - page) <= 1,
        )

  return (
    <nav className="flex items-center justify-center gap-[8px] border-t border-ph-border px-[18px] py-[14px]">
      <button
        type="button"
        disabled={!canPrevious}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-[32px] items-center gap-[4px] rounded-ph-sm px-[8px] text-[13px] font-semibold text-ph-primary transition-colors hover:bg-ph-gray-50 disabled:cursor-default disabled:text-ph-text-muted disabled:opacity-50"
      >
        <ChevronLeft size={15} />
        Previous
      </button>
      {pages.map((pageNumber, index) => {
        const previousPage = pages[index - 1]
        const showGap = previousPage !== undefined && pageNumber - previousPage > 1
        const active = pageNumber === page
        return (
          <span key={pageNumber} className="inline-flex items-center gap-[8px]">
            {showGap && <span className="text-[13px] text-ph-text-muted">...</span>}
            <button
              type="button"
              onClick={() => onPageChange(pageNumber)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex h-[32px] min-w-[32px] items-center justify-center rounded-ph-md px-[10px] text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-ph-primary text-ph-on-accent'
                  : 'text-ph-text-secondary hover:bg-ph-gray-50 hover:text-ph-text'
              }`}
            >
              {pageNumber + 1}
            </button>
          </span>
        )
      })}
      <button
        type="button"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-[32px] items-center gap-[4px] rounded-ph-sm px-[8px] text-[13px] font-semibold text-ph-primary transition-colors hover:bg-ph-gray-50 disabled:cursor-default disabled:text-ph-text-muted disabled:opacity-50"
      >
        Next
        <ChevronRight size={15} />
      </button>
    </nav>
  )
}
