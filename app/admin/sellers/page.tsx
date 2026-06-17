'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

interface SellerApply {
  id: string
  userId: string
  userName: string
  email: string
  categories: string[]
  introduction: string
  portfolioLink: string
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: '검토중', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: '승인됨', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '거절됨', cls: 'bg-red-100 text-red-700' },
}

const CATEGORY_LABEL: Record<string, string> = {
  image: '이미지', writing: '글쓰기', coding: '코딩', marketing: '마케팅', chatbot: '챗봇', data: '데이터',
}

export default function AdminSellersPage() {
  const { token } = useAuthStore()
  const [applies, setApplies] = useState<SellerApply[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    fetchApplies()
  }, [token])

  async function fetchApplies() {
    if (!token) return
    try {
      const res = await api.get('/api/v1/admin/sellers/applies', { headers: { Authorization: `Bearer ${token}` } })
      setApplies(res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setActing(id)
    try {
      await api.put(`/api/v1/admin/sellers/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setApplies((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a)))
    } finally {
      setActing(null)
    }
  }

  async function handleReject(id: string) {
    setActing(id)
    try {
      await api.put(`/api/v1/admin/sellers/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setApplies((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)))
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-4">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
              <div className="h-5 w-40 bg-[#f1f5f9] rounded mb-4" />
              <div className="h-4 w-full bg-[#f1f5f9] rounded" />
            </div>
          ))
        : applies.length === 0
          ? <div className="bg-white rounded-2xl shadow-sm py-20 text-center text-[#94a3b8]">판매자 신청이 없습니다.</div>
          : applies.map((apply) => {
              const s = STATUS_LABEL[apply.status]
              return (
                <div key={apply.id} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#0f172a] font-semibold">{apply.userName}</h3>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="text-[#64748b] text-sm mb-3">{apply.email}</p>
                      {apply.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {apply.categories.map((cat) => (
                            <span key={cat} className="px-2 py-0.5 bg-[#e8f3ff] text-[#1B64DA] text-xs rounded-full">
                              {CATEGORY_LABEL[cat] ?? cat}
                            </span>
                          ))}
                        </div>
                      )}
                      {apply.introduction && (
                        <p className="text-[#475569] text-sm mb-2 line-clamp-2">{apply.introduction}</p>
                      )}
                      {apply.portfolioLink && (
                        <a href={apply.portfolioLink} target="_blank" rel="noopener noreferrer"
                          className="text-[#1B64DA] text-xs hover:underline">
                          포트폴리오 보기 →
                        </a>
                      )}
                    </div>
                    {apply.status === 'pending' && (
                      <div className="flex gap-2 ml-6 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(apply.id)}
                          disabled={acting === apply.id}
                          className="px-4 py-2 bg-[#1B64DA] text-white text-sm rounded-xl hover:bg-[#1957bd] disabled:opacity-50 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(apply.id)}
                          disabled={acting === apply.id}
                          className="px-4 py-2 bg-[#f1f5f9] text-[#ef4444] text-sm rounded-xl hover:bg-[#fee2e2] disabled:opacity-50 transition-colors"
                        >
                          거절
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-[#94a3b8] text-xs">
                    신청일: {new Date(apply.appliedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )
            })}
    </div>
  )
}
