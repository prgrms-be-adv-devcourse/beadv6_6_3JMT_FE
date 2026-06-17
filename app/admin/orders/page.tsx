'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  paid: { label: '결제완료', cls: 'bg-emerald-100 text-emerald-700' },
  refunded: { label: '환불됨', cls: 'bg-red-100 text-red-700' },
  pending: { label: '대기중', cls: 'bg-amber-100 text-amber-700' },
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    api.get('/api/v1/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setOrders(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRefund(id: string) {
    if (!confirm('해당 주문을 환불 처리하시겠습니까?')) return
    setRefunding(id)
    try {
      await api.put(`/api/v1/admin/orders/${id}/refund`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'refunded' } : o)))
    } finally {
      setRefunding(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
        <h2 className="text-[#0f172a] font-semibold">주문 관리</h2>
        <span className="text-[#64748b] text-sm">총 {orders.length}건</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">주문 ID</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">구매자</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">상품명</th>
              <th className="px-6 py-3 text-right text-[#64748b] font-medium">금액</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">상태</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">주문일</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f8fafc]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : orders.map((order) => {
                  const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={order.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                      <td className="px-6 py-4 text-[#64748b] font-mono text-xs">{order.id}</td>
                      <td className="px-6 py-4 text-[#0f172a]">{order.userName}</td>
                      <td className="px-6 py-4 text-[#0f172a] max-w-[180px] truncate">{order.productTitle}</td>
                      <td className="px-6 py-4 text-right text-[#0f172a] font-medium">
                        {order.amount === 0 ? '무료' : `${order.amount.toLocaleString()}원`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#64748b] text-xs">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleRefund(order.id)}
                          disabled={refunding === order.id || order.status === 'refunded' || order.amount === 0}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {refunding === order.id ? '처리중...' : '환불'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
        {!loading && orders.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">주문이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
