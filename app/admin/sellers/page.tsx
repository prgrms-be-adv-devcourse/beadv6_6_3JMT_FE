'use client'

import { useEffect, useState } from 'react'
import { Check, X, Store } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { Badge, StatusBadge } from '@/components/admin/Badge'

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

const CATEGORY_LABEL: Record<string, string> = {
  image: '이미지',
  writing: '글쓰기',
  coding: '코딩',
  marketing: '마케팅',
  chatbot: '챗봇',
  data: '데이터',
}

type FilterId = 'pending' | 'approved' | 'rejected' | 'all'

export default function AdminSellersPage() {
  const { token } = useAuthStore()
  const [applies, setApplies] = useState<SellerApply[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterId>('pending')

  useEffect(() => {
    fetchApplies()
  }, [token])

  async function fetchApplies() {
    if (!token) return
    try {
      const res = await api.get('/api/v1/admin/sellers/applies', {
        headers: { Authorization: `Bearer ${token}` },
      })
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

  const counts = {
    all: applies.length,
    pending: applies.filter((a) => a.status === 'pending').length,
    approved: applies.filter((a) => a.status === 'approved').length,
    rejected: applies.filter((a) => a.status === 'rejected').length,
  }

  const tabs: { id: FilterId; label: string; count: number }[] = [
    { id: 'pending', label: '대기', count: counts.pending },
    { id: 'approved', label: '승인', count: counts.approved },
    { id: 'rejected', label: '반려', count: counts.rejected },
    { id: 'all', label: '전체', count: counts.all },
  ]

  const filtered = filter === 'all' ? applies : applies.filter((a) => a.status === filter)

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionCard
        title="판매자 신청"
        sub={`${counts.pending}건 승인 대기 중`}
        bodyStyle={{ padding: 0 }}
      >
        {/* 필터 탭 */}
        <div className="flex gap-[8px] border-b border-ph-border px-[22px] py-[16px]">
          {tabs.map((t) => {
            const active = filter === t.id
            return (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`inline-flex items-center gap-[6px] rounded-ph-full px-[14px] py-[7px] text-[13.5px] font-semibold transition-colors ${
                  active
                    ? 'bg-ph-secondary text-ph-primary'
                    : 'text-ph-text-secondary hover:bg-ph-gray-50'
                }`}
              >
                {t.label}
                <span
                  className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-ph-full px-[5px] text-[11.5px] font-bold ${
                    active ? 'bg-ph-primary text-ph-on-accent' : 'bg-ph-gray-100 text-ph-text-secondary'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="px-[22px] py-[60px] text-center text-[13.5px] text-ph-text-muted">
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-[10px] px-[22px] py-[60px] text-center">
            <span className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-ph-full bg-ph-gray-50 text-ph-text-muted">
              <Store size={22} />
            </span>
            <div className="text-[14.5px] font-bold text-ph-text">해당하는 신청이 없어요</div>
            <div className="text-[13px] text-ph-text-muted">다른 상태 탭을 확인해 보세요.</div>
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th width="22%">신청자</Th>
                <Th>판매 소개</Th>
                <Th>카테고리</Th>
                <Th align="right">샘플</Th>
                <Th>신청일</Th>
                <Th>상태</Th>
                <Th align="right" width={170}>처리</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <Identity name={a.userName} sub={a.email} />
                  </Td>
                  <Td style={{ maxWidth: 360 }}>
                    <span
                      className="text-[13.5px] text-ph-text-secondary"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                      }}
                    >
                      {a.introduction || '—'}
                    </span>
                  </Td>
                  <Td>
                    {a.categories.length > 0 ? (
                      <div className="flex flex-wrap gap-[6px]">
                        {a.categories.map((cat) => (
                          <Badge key={cat} tone="blue">
                            {CATEGORY_LABEL[cat] ?? cat}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[13.5px] text-ph-text-muted">—</span>
                    )}
                  </Td>
                  <Td align="right">
                    {a.portfolioLink ? (
                      <a
                        href={a.portfolioLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[13.5px] font-semibold text-ph-primary hover:underline"
                      >
                        보기
                      </a>
                    ) : (
                      <span className="text-[13.5px] text-ph-text-muted">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-ph-text-secondary">
                      {new Date(a.appliedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td align="right">
                    {a.status === 'pending' ? (
                      <div className="inline-flex justify-end gap-[6px]">
                        <button
                          onClick={() => handleApprove(a.id)}
                          disabled={acting === a.id}
                          className="inline-flex items-center gap-[5px] rounded-ph-md bg-ph-secondary px-[12px] py-[7px] text-[13px] font-semibold text-ph-primary transition-colors hover:bg-ph-blue-hover hover:text-ph-on-accent disabled:opacity-50"
                        >
                          <Check size={15} />
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(a.id)}
                          disabled={acting === a.id}
                          className="inline-flex items-center gap-[5px] rounded-ph-md px-[12px] py-[7px] text-[13px] font-semibold text-ph-error transition-colors hover:bg-[#fdeceb] disabled:opacity-50"
                          style={{ backgroundColor: '#fdeceb' }}
                        >
                          <X size={15} />
                          반려
                        </button>
                      </div>
                    ) : (
                      <span className="text-[13px] text-ph-text-muted">처리 완료</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </SectionCard>
    </div>
  )
}
