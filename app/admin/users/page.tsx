'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller'
}

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  buyer: { label: '구매자', cls: 'bg-blue-100 text-blue-700' },
  seller: { label: '판매자', cls: 'bg-violet-100 text-violet-700' },
}

export default function AdminUsersPage() {
  const { token } = useAuthStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [token])

  async function fetchUsers() {
    if (!token) return
    try {
      const res = await api.get('/api/v1/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      setUsers(res.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userId: string, newRole: 'buyer' | 'seller') {
    setChanging(userId)
    try {
      await api.put(`/api/v1/admin/users/${userId}`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    } finally {
      setChanging(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
        <h2 className="text-[#0f172a] font-semibold">전체 유저</h2>
        <span className="text-[#64748b] text-sm">{users.length}명</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9]">
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">ID</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">이름</th>
              <th className="px-6 py-3 text-left text-[#64748b] font-medium">이메일</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">역할</th>
              <th className="px-6 py-3 text-center text-[#64748b] font-medium">역할 변경</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f8fafc]">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((user) => {
                  const r = ROLE_LABEL[user.role] ?? { label: user.role, cls: 'bg-gray-100 text-gray-700' }
                  return (
                    <tr key={user.id} className="border-b border-[#f8fafc] hover:bg-[#f8fafc]">
                      <td className="px-6 py-4 text-[#64748b] font-mono text-xs">{user.id}</td>
                      <td className="px-6 py-4 text-[#0f172a] font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-[#64748b]">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${r.cls}`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={user.role}
                          disabled={changing === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'buyer' | 'seller')}
                          className="text-xs border border-[#e2e8f0] rounded-lg px-2 py-1.5 text-[#0f172a] disabled:opacity-50 cursor-pointer"
                        >
                          <option value="buyer">구매자</option>
                          <option value="seller">판매자</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-[#94a3b8]">유저가 없습니다.</div>
        )}
      </div>
    </div>
  )
}
