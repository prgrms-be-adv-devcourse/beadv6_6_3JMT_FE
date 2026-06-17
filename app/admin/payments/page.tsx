'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

interface SettlementPayment {
  id: string
  sellerId: string
  sellerName: string
  amount: number
  commission: number
  netAmount: number
  month: string
  status: string
  settledAt: string | null
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  settled: { label: '정산완료', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '정산대기', cls: 'bg-amber-100 text-amber-700' },
}

export default function AdminPaymentsPage() {
  const { token } = useAuthStore()
  const [payments, setPayments] = useState<SettlementPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get('/api/v1/admin/payments', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPayments(res.data.data ?? []))
      .finally(() => setLoading(false))
  }, [token])

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalCommission = payments.reduce((sum, p) => sum + p.commission, 0)
  const totalNet = payments.reduce((sum, p) => sum + p.netAmount, 0)

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: '총 거래금액', value: totalRevenue, color: 'text-[#1B64DA]' },
          { label: '총 수수료 (10%)', value: totalCommission, color: 'text-amber-600' },
          { label: '판매자 정산액', value: totalNet, color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-[#64748b] text-sm mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}원</p>
          </div>
        ))}
      </div>

      {/* 정산 내역 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-[#f1f5f9]">
          <h2 className="text-[#0f172a] font-semibold">정산 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                <th className="px-6 py-3 text-left text-[#64748b] font-medium">정산 ID</th>
                <th className="px-6 py-3 text-left text-[#64748b] font-medium">판매자</th>
                <th className="px-6 py-3 text-left text-[#64748b] font-medium">정산월</th>
                <th className="px-6 py-3 text-right text-[#64748b] font-medium">거래금액</th>
                <th className="px-6 py-3 text-right text-[#64748b] font-medium">수수료</th>
                <th className="px-6 py-3 text-right text-[#64748b] font-medium">정산액</th>
                <th className="px-6 py-3 text-center text-[#64748b] font-medium">상태</th>
                <th className="px-6 py-3 text-left text-[#64748b] font-medium">정산일</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f8fafc]">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : payments.map((payment) => {
                    const s = STATUS_LABEL[payment.status] ?? { label: payment.status, cls: 'bg-gray-100 text-gray-700' }
                    return (
                      <tr key={payment.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                        <td className="px-6 py-4 text-[#64748b] font-mono text-xs">{payment.id}</td>
                        <td className="px-6 py-4 text-[#0f172a] font-medium">{payment.sellerName}</td>
                        <td className="px-6 py-4 text-[#64748b]">{payment.month}</td>
                        <td className="px-6 py-4 text-right text-[#0f172a]">{payment.amount.toLocaleString()}원</td>
                        <td className="px-6 py-4 text-right text-amber-600">{payment.commission.toLocaleString()}원</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-semibold">{payment.netAmount.toLocaleString()}원</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#64748b] text-xs">
                          {payment.settledAt ? new Date(payment.settledAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
          {!loading && payments.length === 0 && (
            <div className="text-center py-12 text-[#94a3b8]">정산 내역이 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}
