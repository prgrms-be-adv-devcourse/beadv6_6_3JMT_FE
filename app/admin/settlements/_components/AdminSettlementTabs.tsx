'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/settlements', label: '정산 내역' },
  { href: '/admin/settlements/deliveries', label: '전달 관리' },
] as const

export default function AdminSettlementTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="정산 관리 메뉴"
      className="flex w-fit gap-ph-4 rounded-ph-md border border-ph-border bg-ph-white p-ph-4"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`rounded-ph-sm px-ph-16 py-ph-8 text-ph-body-sm font-semibold transition-colors ${
              active
                ? 'bg-ph-primary text-ph-on-accent'
                : 'text-ph-text-secondary hover:bg-ph-gray-50 hover:text-ph-text'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
