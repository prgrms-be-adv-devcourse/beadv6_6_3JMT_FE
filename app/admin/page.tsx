'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

interface Order {
  id: string
  userId: string
  userName: string
  productId: number
  productTitle: string
  amount: number
  status: string
  createdAt: string
}

const KPI_CARDS = [
  { key: 'totalUsers', label: '전체 유저', icon: '👥', color: 'bg-blue-500', unit: '명' },
  { key: 'totalProducts', label: '등록 상품', icon: '📦', color: 'bg-violet-500', unit: '개' },
  { key: 'totalOrders', label: '전체 주문', icon: '🛒', color: 'bg-emerald-500', unit: '건' },
  { key: 'totalRevenue', label: '총 매출', icon: '💰', color: 'bg-amber-500', unit: '원', currency: true },
]

export default function AdminDashboardPage() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          api.get('/api/v1/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        setStats(statsRes.data.data)
        setRecentOrders((ordersRes.data.data ?? []).slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchData()
  }, [token])

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    paid: { label: '결제완료', cls: 'bg-emerald-100 text-emerald-700' },
    refunded: { label: '환불됨', cls: 'bg-red-100 text-red-700' },
    pending: { label: '대기중', cls: 'bg-amber-100 text-amber-700' },
  }

  return (
    <div className="space-y-8">
      {/* KPI 카드 */}
      <div className="grid grid-cols-4 gap-5">
        {KPI_CARDS.map(({ key, label, icon, color, unit, currency }) => (
          <div key={key} className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#64748b] text-sm font-medium">{label}</span>
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-xl`}>
                {icon}
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-24 bg-[#f1f5f9] rounded animate-pulse" />
            ) : (
              <p className="text-[#0f172a] text-2xl font-bold">
                {currency
                  ? `${(stats?.[key as keyof Stats] ?? 0).toLocaleString()}${unit}`
                  : `${stats?.[key as keyof Stats] ?? 0}${unit}`}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-[#f1f5f9]">
          <h2 className="text-[#0f172a] font-semibold">최근 주문</h2>
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
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f8fafc]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : recentOrders.map((order) => {
                    const s = STATUS_LABEL[order.status] ?? { label: order.status, cls: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={order.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                        <td className="px-6 py-4 text-[#64748b] font-mono text-xs">{order.id}</td>
                        <td className="px-6 py-4 text-[#0f172a]">{order.userName}</td>
                        <td className="px-6 py-4 text-[#0f172a]">{order.productTitle}</td>
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
                      </tr>
                    )
                  })}
            </tbody>
          </table>
          {!loading && recentOrders.length === 0 && (
            <div className="text-center py-12 text-[#94a3b8]">주문 내역이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}
