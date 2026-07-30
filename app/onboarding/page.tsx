'use client'

import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-14 font-ph">
      <section className="w-full max-w-[480px] rounded-ph-xl border border-ph-border bg-ph-white p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ph-secondary text-ph-primary">
          <Sparkles aria-hidden="true" className="h-6 w-6" />
        </span>
        <h1 className="mb-2 mt-5 text-[28px] font-bold tracking-[-0.02em] text-ph-text">
          PromptHub에 오신 것을 환영해요
        </h1>
        <p className="mb-7 text-[15px] leading-6 text-ph-text-secondary">
          새로운 계정의 준비가 끝났습니다. 다양한 프롬프트를 둘러보세요.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="h-[52px] w-full rounded-ph-md border-0 bg-ph-primary text-[16px] font-bold text-ph-white hover:bg-ph-blue-hover"
        >
          시작하기
        </button>
      </section>
    </div>
  )
}
