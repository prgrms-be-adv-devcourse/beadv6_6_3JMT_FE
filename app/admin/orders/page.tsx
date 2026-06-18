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
  productId: number
  productTitle: string
  amount: number
  status: string
  createdAt: string
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api
      .get('/api/v1/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRefund(id: string) {
    if (!confirm('해당 주문을 환불 처리하시겠습니까?')) return
    setRefunding(id)
    try {
      await api.put(
        `/api/v1/admin/orders/${id}/refund`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'refunded' } : o)))
    } finally {
      setRefunding(null)
    }
  }

  return (
    <SectionCard title="주문 관리" sub={`총 ${orders.length}건`}>
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
              <Th align="center">관리</Th>
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
              : orders.map((order) => (
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
                    <Td align="center">
                      {order.status === 'paid' && order.amount > 0 ? (
                        <button
                          onClick={() => handleRefund(order.id)}
                          disabled={refunding === order.id}
                          className="inline-flex items-center justify-center rounded-ph-sm px-[12px] py-[6px] text-[13px] font-semibold text-ph-error transition-colors hover:bg-[#fdeceb] disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ border: '1px solid var(--ph-error)' }}
                        >
                          {refunding === order.id ? '처리중...' : '환불'}
                        </button>
                      ) : (
                        <span className="text-[13px] text-ph-text-muted">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
          </tbody>
        </Table>
        {!loading && orders.length === 0 && (
          <div className="py-[48px] text-center text-[14px] text-ph-text-muted">
            주문이 없습니다.
          </div>
        )}
      </div>
    </SectionCard>
  )
}
