'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, isLoggedIn, login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 이미 로그인된 admin이 /admin/login 재방문 시 자동 이동
  // deps 빈 배열: mount 시 1회만 실행 → handleSubmit의 router.push와 충돌 없음
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      router.replace('/admin')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/v1/auth/login', { email, password })
      const { user: loginUser, token } = res.data.data
      if (loginUser.role !== 'admin') {
        setError('관리자 계정이 아닙니다.')
        return
      }
      login(loginUser, token)
      router.push('/admin')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message ?? '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-white font-bold text-2xl">PromptHub</span>
            <span className="text-xs bg-[#1B64DA] text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <p className="text-[#64748b] text-sm">관리자 콘솔에 로그인하세요</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@prompthub.kr"
                required
                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#1B64DA] focus:ring-1 focus:ring-[#1B64DA] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#1B64DA] focus:ring-1 focus:ring-[#1B64DA] transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#1B64DA] hover:bg-[#1957bd] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '로그인 중...' : '관리자 로그인'}
            </button>
          </form>

          {/* 데모 안내 */}
          {process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && (
            <div className="mt-5 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#64748b] leading-relaxed">
              <span className="font-medium text-[#475569]">데모 계정</span><br />
              admin@prompthub.kr / password123
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-[#475569] text-xs">
          일반 서비스로 돌아가려면{' '}
          <a href="/" className="text-[#1B64DA] hover:underline">여기</a>를 클릭하세요
        </p>
      </div>
    </div>
  )
}
