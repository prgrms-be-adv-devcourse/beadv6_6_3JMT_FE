'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'

interface AdminOrder {
  id: string
  userId: string
  userName: string
  productId: string
  productTitle: string
  amount: number
  status: string
  createdAt: string
}

const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'PAID', label: '완료' },
  { value: 'FAILED', label: '실패' },
  { value: 'CANCELED', label: '취소' },
  { value: 'REFUNDED', label: '환불' },
]

export default function AdminOrdersPage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  useEffect(() => {
    if (!token) return
    api
      .get('/api/v1/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [token])

  const filterBar = (
    <div className="flex flex-wrap gap-[8px]">
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          className="rounded-ph-full px-[14px] py-[7px] text-[13px] font-semibold transition-colors"
          style={
            filter === opt.value
              ? { backgroundColor: 'var(--ph-primary)', color: 'var(--ph-on-accent)' }
              : { backgroundColor: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <SectionCard title="주문 관리" sub={`총 ${filtered.length}건`} headerExtra={filterBar}>
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>주문 ID</Th>
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
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Td key={j}>
                        <div className="h-[16px] animate-pulse rounded-ph-sm bg-ph-gray-100" />
                      </Td>
                    ))}
                  </Tr>
                ))
              : filtered.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <span className="text-[12.5px] text-ph-text-muted">{order.id}</span>
                    </Td>
                    <Td>
                      <Identity name={order.userName} />
                    </Td>
                    <Td>
                      <span className="block max-w-[200px] truncate">{order.productTitle}</span>
                    </Td>
                    <Td align="right" style={{ fontWeight: 600 }}>
                      {order.amount === 0 ? '무료' : `${order.amount.toLocaleString()}원`}
                    </Td>
                    <Td align="center">
                      <StatusBadge status={order.status} />
                    </Td>
                    <Td>
                      <span className="text-[13px] text-ph-text-secondary">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </Td>
                  </Tr>
                ))}
          </tbody>
        </Table>
        {!loading && filtered.length === 0 && (
          <div className="py-[48px] text-center text-[14px] text-ph-text-muted">
            {filter === 'all' ? '주문이 없습니다.' : '해당 상태의 주문이 없습니다.'}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
