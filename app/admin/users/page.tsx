'use client'

import { useEffect, useState } from 'react'
import { SectionCard } from '@/components/admin/SectionCard'
import { Table, Th, Td, Tr, Identity } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/Badge'
import { CircleCheck, CirclePause, CircleX, Search } from 'lucide-react'
import { type AdminUser, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '@/lib/adminUsers'

type UserStatus = AdminUser['status']
type RoleFilter = 'ALL' | AdminUser['role']

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
  // 백엔드 role 파라미터는 계정이 과거 보유했던 역할까지 매칭해 중복으로 잡힌다
  // (예: 관리자 계정이 buyer/seller 필터에도 함께 걸림). 그래서 유형 탭은 표시되는
  // u.role 값 기준으로 클라이언트에서만 필터링한다 — 전체 목록을 한 번에 받아온다.
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setKeyword(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    fetchAllUsers().finally(() => setLoading(false))
  }, [])

  async function fetchAllUsers() {
    const total = await getAdminUsers({ role: 'ALL', page: 1, size: 1 }).then((res) => res.meta.total)
    const res = await getAdminUsers({ role: 'ALL', page: 1, size: total || 1 })
    setAllUsers(res.data)
  }

  async function handleRoleChange(userId: string, newRole: 'buyer' | 'seller') {
    setChanging(userId)
    try {
      await updateAdminUserRole(userId, newRole)
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } finally {
      setChanging(null)
    }
  }

  async function handleStatusChange(userId: string, newStatus: UserStatus) {
    setChanging(userId)
    try {
      await updateAdminUserStatus(userId, newStatus)
      setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)))
    } finally {
      setChanging(null)
    }
  }

  function selectTab(id: RoleFilter) {
    setRoleFilter(id)
    setVisibleCount(PAGE_SIZE)
  }

  const counts = {
    ALL: allUsers.length,
    admin: allUsers.filter((u) => u.role === 'admin').length,
    buyer: allUsers.filter((u) => u.role === 'buyer').length,
    seller: allUsers.filter((u) => u.role === 'seller').length,
  }

  const byRole = roleFilter === 'ALL' ? allUsers : allUsers.filter((u) => u.role === roleFilter)
  const q = keyword.trim().toLowerCase()
  const filtered = !q
    ? byRole
    : byRole.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
      )
  const users = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  return (
    <div className="flex flex-col gap-[20px]">
      <SectionCard
        title="사용자 목록"
        sub={`총 ${counts.ALL.toLocaleString('ko-KR')}명 · 관리자 ${counts.admin}명 · 구매자 ${counts.buyer}명 · 판매자 ${counts.seller}명`}
        bodyStyle={{ padding: 0 }}
        action={
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-ph-text-muted"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="닉네임, 이메일, 회원 ID 검색"
              className="h-[36px] w-[260px] rounded-ph-md border border-ph-border bg-ph-bg pl-[34px] pr-[12px] text-[13.5px] text-ph-text placeholder:text-ph-text-muted focus:border-ph-primary focus:outline-none"
            />
          </div>
        }
      >
        <div className="flex gap-[8px] border-b border-ph-border px-[22px] py-[16px]">
          {ROLE_TABS.map((t) => {
            const active = roleFilter === t.id
            return (
              <button
                key={t.id}
                onClick={() => selectTab(t.id)}
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
            {hasMore && (
              <div className="border-t border-ph-border p-[16px] text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="h-[38px] rounded-ph-sm border border-ph-border bg-ph-white px-[20px] text-[13.5px] font-semibold text-ph-text-secondary"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>
    </div>
  )
}
