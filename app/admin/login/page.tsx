'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ShieldCheck, Mail, Lock, Info, LockKeyhole } from 'lucide-react'
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
    <div
      className="flex min-h-screen flex-col font-ph"
      style={{ background: 'linear-gradient(180deg, #fff, #f3f7fd 45%, #e4eefb)' }}
    >
      {/* 상단 로고 영역 */}
      <header className="px-8 py-[22px]">
        <div className="flex items-center gap-[11px]">
          <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-ph-primary text-ph-white">
            <Sparkles style={{ width: 21, height: 21 }} />
          </span>
          <span className="flex flex-col" style={{ lineHeight: 1.12 }}>
            <span className="text-[20px] font-bold tracking-[-0.02em] text-ph-text">
              Prompt<span className="text-ph-primary">Hub</span>
            </span>
            <span className="text-[12px] font-semibold tracking-[0.05em] text-ph-text-muted">
              ADMIN CONSOLE
            </span>
          </span>
        </div>
      </header>

      {/* 중앙 카드 */}
      <main className="flex flex-1 items-center justify-center px-6 pb-16 pt-6">
        <div className="w-[440px] max-w-full rounded-ph-xl border border-ph-border bg-ph-white p-9">
          {/* 관리자 전용 마커 */}
          <div className="inline-flex items-center gap-[7px] rounded-ph-full bg-ph-secondary px-3 py-1.5 text-[13px] font-bold text-ph-primary">
            <ShieldCheck style={{ width: 15, height: 15 }} />
            관리자 콘솔
          </div>

          <h1 className="mb-1.5 mt-[18px] text-[26px] font-bold tracking-[-0.02em] text-ph-text">
            PromptHub Admin 로그인
          </h1>
          <p className="mb-[26px] text-[15px] leading-[1.5] text-ph-text-secondary">
            운영팀 전용 페이지예요. 관리자 계정으로 로그인하세요.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            {/* 이메일 */}
            <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ph-text">
              이메일
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-ph-text-muted"
                  style={{ width: 17, height: 17 }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="admin@prompthub.kr"
                  required
                  className="h-11 w-full rounded-ph-md border border-ph-border bg-ph-white pl-[41px] pr-[14px] text-[15px] font-normal text-ph-text outline-none placeholder:text-ph-text-muted focus:border-ph-primary"
                />
              </div>
            </label>

            {/* 비밀번호 */}
            <label className="flex flex-col gap-1.5 text-[14px] font-semibold text-ph-text">
              비밀번호
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 text-ph-text-muted"
                  style={{ width: 17, height: 17 }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-ph-md border border-ph-border bg-ph-white pl-[41px] pr-[14px] text-[15px] font-normal text-ph-text outline-none placeholder:text-ph-text-muted focus:border-ph-primary"
                />
              </div>
            </label>

            {error && (
              <div className="rounded-ph-sm border border-[#fecaca] bg-[#fff1f1] px-2.5 py-1.5 text-[13px] text-ph-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-[52px] rounded-ph-md bg-ph-primary text-[16px] font-bold text-ph-on-accent transition-colors hover:bg-ph-blue-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? '로그인 중…' : '로그인'}
            </button>
          </form>

          {/* 데모 안내 — MSW Mock 활성화 시에만 표시 */}
          {process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && (
            <div className="mt-4 flex items-center gap-2 rounded-ph-md border border-ph-border bg-ph-gray-50 px-[13px] py-[11px] text-[12.5px] leading-[1.5] text-ph-text-muted">
              <Info style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>
                데모 계정:{' '}
                <b className="text-ph-text-secondary">admin@prompthub.kr</b> /{' '}
                <b className="text-ph-text-secondary">password123</b>
              </span>
            </div>
          )}

          {/* 접근 제한 안내 */}
          <div className="mt-[22px] flex items-center justify-center gap-[7px] text-[13.5px] text-ph-text-muted">
            <LockKeyhole style={{ width: 14, height: 14 }} />
            운영팀 외 접근이 제한된 페이지입니다.
          </div>
        </div>
      </main>
    </div>
  )
}
