'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

interface AdminProduct {
  id: number
  title: string
  category: string
  seller: string
  amount: number
  status?: string
  createdAt: string
}

type StatusFilter = 'all' | 'active' | 'review'

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: '판매중', cls: 'bg-emerald-100 text-emerald-700' },
  review: { label: '검수중', cls: 'bg-amber-100 text-amber-700' },
}

const CATEGORY_LABEL: Record<string, string> = {
  image: '이미지',
  writing: '글쓰기',
  coding: '코딩',
  marketing: '마케팅',
  chatbot: '챗봇',
  data: '데이터',
}

export default function AdminProductsPage() {
  const { token } = useAuthStore()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [token, filter])

  async function fetchProducts() {
    if (!token) return
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const res = await api.get('/api/v1/admin/products', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      setProducts(res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: number) {
    setActing(id)
    try {
      await api.put(`/api/v1/admin/products/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'active' } : p)))
    } finally {
      setActing(null)
    }
  }

  async function handleReject(id: number) {
    setActing(id)
    try {
      await api.put(`/api/v1/admin/products/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'review' } : p)))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
        <h2 className="text-[#0f172a] font-semibold">상품 관리</h2>
        <div className="flex gap-2">
          {(['all', 'active', 'review'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === s ? 'bg-[#1B64DA] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
              }`}
            >
              {s === 'all' ? '전체' : s === 'active' ? '판매중' : '검수중'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">ID</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">상품명</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">카테고리</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">판매자</th>
              <th className="px-6 py-3 text-right text-[#64748b] font-medium">가격</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">상태</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f8fafc]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : products.map((product) => {
                  const s = STATUS_LABEL[product.status ?? 'active'] ?? { label: product.status, cls: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={product.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                      <td className="px-6 py-4 text-[#64748b] text-xs">{product.id}</td>
                      <td className="px-6 py-4 text-[#0f172a] font-medium max-w-[200px] truncate">{product.title}</td>
                      <td className="px-6 py-4 text-[#64748b]">{CATEGORY_LABEL[product.category] ?? product.category}</td>
                      <td className="px-6 py-4 text-[#64748b]">{product.seller}</td>
                      <td className="px-6 py-4 text-right text-[#0f172a] font-medium">
                        {product.amount === 0 ? '무료' : `${product.amount.toLocaleString()}원`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            disabled={acting === product.id || product.status === 'active'}
                            className="px-2.5 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(product.id)}
                            disabled={acting === product.id || product.status === 'review'}
                            className="px-2.5 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-40 transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">상품이 없습니다.</div>
        )}
      </div>
    </div>
  )
}
