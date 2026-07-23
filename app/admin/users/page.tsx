'use client'

import { useEffect, useState } from 'react'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'
import { CircleCheck, CirclePause, CircleX } from 'lucide-react'
import {
  type AdminUser,
  type GetAdminUsersParams,
  getAdminUsers,
  getAdminUserCount,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '@/lib/adminUsers'

type UserStatus = AdminUser['status']
type RoleFilter = NonNullable<GetAdminUsersParams['role']>

const PAGE_SIZE = 20

const ROLE_LABEL: Record<string, string> = {
  admin: '관리자',
  buyer: '구매자',
  seller: '판매자',
}

const ROLE_TABS: { id: RoleFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'admin', label: '관리자' },
  { id: 'buyer', label: '구매자' },
  { id: 'seller', label: '판매자' },
]

const STATUS_OPTS: { id: UserStatus; label: string; icon: typeof CircleCheck; danger?: boolean }[] = [
  { id: 'active', label: '활성', icon: CircleCheck },
  { id: 'suspended', label: '정지', icon: CirclePause },
  { id: 'withdrawn', label: '탈퇴', icon: CircleX, danger: true },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [meta, setMeta] = useState({ page: 1, size: PAGE_SIZE, total: 0, hasNext: false })
  const [counts, setCounts] = useState({ ALL: 0, admin: 0, buyer: 0, seller: 0 })
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchUsers(1).finally(() => setLoading(false))
  }, [roleFilter])

  useEffect(() => {
    fetchCounts()
  }, [])

  async function fetchUsers(page: number) {
    const res = await getAdminUsers({ role: roleFilter, page, size: PAGE_SIZE })
    setUsers((prev) => (page === 1 ? res.data : [...prev, ...res.data]))
    setMeta(res.meta)
  }

  async function fetchCounts() {
    const [ALL, admin, buyer, seller] = await Promise.all([
      getAdminUserCount('ALL').catch(() => 0),
      getAdminUserCount('admin').catch(() => 0),
      getAdminUserCount('buyer').catch(() => 0),
      getAdminUserCount('seller').catch(() => 0),
    ])
    setCounts({ ALL, admin, buyer, seller })
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      await fetchUsers(meta.page + 1)
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: 'buyer' | 'seller') {
    setChanging(userId)
    try {
      await updateAdminUserRole(userId, newRole)
      await Promise.all([fetchUsers(1), fetchCounts()])
    } finally {
      setChanging(null)
    }
  }

  async function handleStatusChange(userId: string, newStatus: UserStatus) {
    setChanging(userId)
    try {
      await updateAdminUserStatus(userId, newStatus)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)))
    } finally {
      setChanging(null)
    }
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionCard
        title="사용자 목록"
        sub={`총 ${counts.ALL.toLocaleString('ko-KR')}명 · 관리자 ${counts.admin}명 · 구매자 ${counts.buyer}명 · 판매자 ${counts.seller}명`}
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex gap-[8px] border-b border-ph-border px-[22px] py-[16px]">
          {ROLE_TABS.map((t) => {
            const active = roleFilter === t.id
            return (
              <button
                key={t.id}
                onClick={() => setRoleFilter(t.id)}
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
                  {counts[t.id]}
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="px-[22px] py-[40px] text-center text-[14px] text-ph-text-muted">불러오는 중…</div>
        ) : users.length === 0 ? (
          <div className="px-[22px] py-[40px] text-center text-[14px] text-ph-text-muted">사용자가 없습니다.</div>
        ) : (
          <>
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
                        {u.role === 'admin' ? (
                          <span className="text-[13px] text-ph-text-muted">—</span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={changing === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as 'buyer' | 'seller')}
                            className="cursor-pointer rounded-ph-sm border border-ph-border px-[8px] py-[6px] text-[13px] text-ph-text disabled:opacity-50"
                          >
                            <option value="buyer">구매자</option>
                            <option value="seller">판매자</option>
                          </select>
                        )}
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
            {meta.hasNext && (
              <div className="border-t border-ph-border p-[16px] text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-[20px] text-[13.5px] font-semibold text-ph-text-secondary disabled:opacity-40"
                >
                  {loadingMore ? '불러오는 중…' : '더 보기'}
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  )
}
