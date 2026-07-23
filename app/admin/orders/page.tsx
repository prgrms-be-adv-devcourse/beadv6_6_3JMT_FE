'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'
import { formatAdminOrderSellers } from '@/lib/adminOrderAdapters'

import { AdminOrder } from '@/types/api/orders'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'CREATED', label: '생성' },
  { value: 'COMPLETED', label: '결제 완료' },
  { value: 'FAILED', label: '실패' },
  { value: 'PARTIAL_REFUNDED', label: '부분 환불' },
  { value: 'ALL_REFUNDED', label: '전체 환불' },
]

export default function AdminOrdersPage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [keyword, setKeyword] = useState('')

  const byStatus = filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter)
  const q = keyword.trim().toLowerCase()
  const filtered = !q
    ? byStatus
    : byStatus.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.productTitle.toLowerCase().includes(q) ||
          (o.buyer?.buyerName ?? '').toLowerCase().includes(q) ||
          (o.buyer?.email ?? '').toLowerCase().includes(q) ||
          o.sellers.some((s) => s.sellerNickname.toLowerCase().includes(q)),
      )

  useEffect(() => {
    if (!token) return
    api
      .get(`${API_BASE}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <SectionCard
      title="주문 관리"
      sub={`총 ${orders.length}건`}
      bodyStyle={{ padding: 0 }}
      action={
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-ph-text-muted"
          />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="주문 번호, 판매자, 구매자 검색"
            className="h-[36px] w-[260px] rounded-ph-md border border-ph-border bg-ph-bg pl-[34px] pr-[12px] text-[13.5px] text-ph-text placeholder:text-ph-text-muted focus:border-ph-primary focus:outline-none"
          />
        </div>
      }
    >
      <div className="flex gap-[8px] border-b border-ph-border px-[22px] py-[16px]">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value
          const count = opt.value === 'all' ? orders.length : orders.filter((o) => o.orderStatus === opt.value).length
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`inline-flex items-center gap-[6px] rounded-ph-full px-[14px] py-[7px] text-[13.5px] font-semibold transition-colors ${
                active
                  ? 'bg-ph-secondary text-ph-primary'
                  : 'text-ph-text-secondary hover:bg-ph-gray-50'
              }`}
            >
              {opt.label}
              <span
                className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-ph-full px-[5px] text-[11.5px] font-bold ${
                  active ? 'bg-ph-primary text-ph-on-accent' : 'bg-ph-gray-100 text-ph-text-secondary'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>주문 번호</Th>
              <Th>판매자</Th>
              <Th>구매자</Th>
              <Th>상품명</Th>
              <Th align="right">금액</Th>
              <Th align="center">상태</Th>
              <Th>주문일</Th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Td key={j}>
                        <div className="h-[16px] animate-pulse rounded-ph-sm bg-ph-gray-100" />
                      </Td>
                    ))}
                  </Tr>
                ))
              : filtered.map((order) => (
                  <Tr key={order.orderNumber}>
                    <Td>
                      <span className="text-[12.5px] text-ph-text-muted">{order.orderNumber}</span>
                    </Td>
                    <Td>
                      <Identity
                        name={formatAdminOrderSellers(order)}
                        imageUrl={order.sellers[0]?.profileImageUrl}
                      />
                    </Td>
                    <Td>
                      <span>{order.buyer?.buyerName ?? '탈퇴한 회원'}</span>
                    </Td>
                    <Td>
                      <span className="block max-w-[200px] truncate">{order.productTitle}</span>
                    </Td>
                    <Td align="right" style={{ fontWeight: 600 }}>
                      {order.totalOrderAmount === 0 ? '무료' : `${order.totalOrderAmount.toLocaleString()}원`}
                    </Td>
                    <Td align="center">
                      <StatusBadge status={order.orderStatus} />
                    </Td>
                    <Td>
                      <span className="text-[13px] text-ph-text-secondary">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </Td>
                  </Tr>
                ))}
          </tbody>
        </Table>
        {!loading && filtered.length === 0 && (
          <div className="py-[48px] text-center text-[14px] text-ph-text-muted">
            {q ? '검색 결과가 없습니다.' : filter === 'all' ? '주문이 없습니다.' : '해당 상태의 주문이 없습니다.'}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
