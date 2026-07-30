'use client'

import { ShieldX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function AuthForbiddenPage() {
  const router = useRouter()
  const openLoginModal = useAuthStore((state) => state.openLoginModal)

  const returnToLogin = () => {
    openLoginModal()
    router.replace('/')
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-14 font-ph">
      <section className="w-full max-w-[480px] rounded-ph-xl border border-ph-border bg-ph-white p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ph-warning-bg text-ph-warning">
          <ShieldX aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mb-2 mt-5 text-[28px] font-bold tracking-[-0.02em] text-ph-text">
          이용이 제한된 계정입니다
        </h1>
        <p className="mb-7 text-[15px] leading-6 text-ph-text-secondary">
          이 계정으로는 현재 PromptHub를 이용할 수 없습니다. 도움이 필요하면 고객 지원에
          문의해주세요.
        </p>
        <button
          type="button"
          onClick={returnToLogin}
          className="h-[52px] w-full rounded-ph-md border-0 bg-ph-primary text-[16px] font-bold text-ph-white hover:bg-ph-blue-hover"
        >
          로그인으로 돌아가기
        </button>
      </section>
    </div>
  )
}
