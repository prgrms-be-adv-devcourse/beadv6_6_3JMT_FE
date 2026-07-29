import type { ReactNode } from 'react'

import AdminSettlementTabs from '@/app/admin/settlements/_components/AdminSettlementTabs'

export default function AdminSettlementsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-ph-16">
      <AdminSettlementTabs />
      {children}
    </div>
  )
}
