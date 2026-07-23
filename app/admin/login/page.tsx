'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ShieldCheck, LockKeyhole, MessageCircle } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useAuthStore()

  const kakaoAdminLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
      redirect_uri: `${window.location.origin}/auth/kakao/callback`,
      response_type: 'code',
      state: 'admin',
    })
    window.location.href = `https://kauth.kakao.com/oauth/authorize?${params}`
  }

  // 이미 로그인된 admin이 /admin/login 재방문 시 자동 이동
  // deps 빈 배열: mount 시 1회만 실행 → handleSubmit의 router.push와 충돌 없음
  useEffect(() => {
    if (isLoggedIn && user?.roles?.includes('admin')) {
      router.replace('/admin')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

          {/* 카카오 로그인 */}
          <button
            type="button"
            onClick={kakaoAdminLogin}
            className="flex h-[52px] w-full items-center justify-center gap-[9px] rounded-ph-md text-[16px] font-bold"
            style={{ background: '#FEE500', color: '#191600', border: 'none', cursor: 'pointer' }}
          >
            <MessageCircle style={{ width: 19, height: 19 }} />
            카카오로 관리자 로그인
          </button>

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
