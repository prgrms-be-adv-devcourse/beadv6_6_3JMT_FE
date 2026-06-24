'use client'

import { useEffect, useState } from 'react'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'
import { CircleCheck, CirclePause, CircleX } from 'lucide-react'
import { type AdminUser, getAdminUsers, updateAdminUser } from '@/lib/adminUsers'

type UserStatus = AdminUser['status']

const ROLE_LABEL: Record<string, string> = {
  buyer: '구매자',
  seller: '판매자',
}

const STATUS_OPTS: { id: UserStatus; label: string; icon: typeof CircleCheck; danger?: boolean }[] = [
  { id: 'active', label: '활성', icon: CircleCheck },
  { id: 'suspended', label: '정지', icon: CirclePause },
  { id: 'withdrawn', label: '탈퇴', icon: CircleX, danger: true },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const { data } = await getAdminUsers()
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: 'buyer' | 'seller') {
    setChanging(userId)
    try {
      await updateAdminUser(userId, { role: newRole })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } finally {
      setChanging(null)
    }
  }

  async function handleStatusChange(userId: string, newStatus: UserStatus) {
    setChanging(userId)
    try {
      await updateAdminUser(userId, { status: newStatus })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)))
    } finally {
      setChanging(null)
    }
  }

  const buyerCount = users.filter((u) => u.role === 'buyer').length
  const sellerCount = users.filter((u) => u.role === 'seller').length

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionCard
        title="사용자 목록"
        sub={`총 ${users.length.toLocaleString('ko-KR')}명 · 구매자 ${buyerCount}명 · 판매자 ${sellerCount}명`}
        bodyStyle={{ padding: 0 }}
      >
        {loading ? (
          <div className="px-[22px] py-[40px] text-center text-[14px] text-ph-text-muted">불러오는 중…</div>
        ) : users.length === 0 ? (
          <div className="px-[22px] py-[40px] text-center text-[14px] text-ph-text-muted">사용자가 없습니다.</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>사용자</Th>
                <Th>회원 ID</Th>
                <Th>유형</Th>
                <Th>상태</Th>
                <Th align="right">유형 변경</Th>
                <Th align="right">상태 변경</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const status = u.status
                return (
                  <Tr key={u.id}>
                    <Td>
                      <Identity name={u.name} sub={u.email} />
                    </Td>
                    <Td>
                      <span className="text-[13px] text-ph-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {u.id}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-[13.5px] font-semibold text-ph-text-secondary">
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                    <Td align="right">
                      <select
                        value={u.role}
                        disabled={changing === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as 'buyer' | 'seller')}
                        className="cursor-pointer rounded-ph-sm border border-ph-border px-[8px] py-[6px] text-[13px] text-ph-text disabled:opacity-50"
                      >
                        <option value="buyer">구매자</option>
                        <option value="seller">판매자</option>
                      </select>
                    </Td>
                    <Td align="right">
                      <div className="inline-flex justify-end gap-[6px]">
                        {STATUS_OPTS.map((o) => {
                          const Icon = o.icon
                          const isActive = status === o.id
                          return (
                            <button
                              key={o.id}
                              type="button"
                              disabled={changing === u.id || isActive}
                              onClick={() => handleStatusChange(u.id, o.id)}
                              title={`${o.label}으로 변경`}
                              className="inline-flex items-center gap-[5px] rounded-ph-sm border px-[9px] py-[6px] text-[12.5px] font-semibold disabled:cursor-default disabled:opacity-50"
                              style={
                                isActive
                                  ? { borderColor: 'var(--ph-primary)', color: 'var(--ph-primary)', background: 'var(--ph-secondary)' }
                                  : o.danger
                                    ? { borderColor: 'var(--ph-border)', color: 'var(--ph-error)', background: 'transparent' }
                                    : { borderColor: 'var(--ph-border)', color: 'var(--ph-text-secondary)', background: 'transparent' }
                              }
                            >
                              <Icon size={14} />
                              {o.label}
                            </button>
                          )
                        })}
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </SectionCard>
    </div>
  )
}
