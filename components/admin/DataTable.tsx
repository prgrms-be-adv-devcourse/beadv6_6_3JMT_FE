'use client'

// 원본 shared-admin-ui.js Table 프리미티브 이식
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return (
    <table className="w-full border-collapse font-ph" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
      style={{ cursor: onClick ? 'pointer' : 'default', background: bg, transition: 'background-color .12s ease' }}
    >
      {children}
    </tr>
  )
}

// 원형 아바타 (design-system.js Avatar 이식 — 이니셜 fallback)
export function Avatar({ name = '', size = 40 }: { name?: string; size?: number }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
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
export function Identity({ name, sub, size = 36 }: { name: string; sub?: ReactNode; size?: number }) {
  return (
    <div className="flex items-center gap-[11px]">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-ph-text">{name}</div>
        {sub && <div className="truncate text-[12.5px] text-ph-text-muted">{sub}</div>}
      </div>
    </div>
  )
}
