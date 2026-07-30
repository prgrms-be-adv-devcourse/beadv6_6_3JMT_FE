'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2, Clock3, MessageCircle, RefreshCcw, ShieldCheck } from 'lucide-react'
import { rejoin } from '@/lib/oauth'
import { getAuthErrorCode } from '@/lib/rejoinContracts'
import { rejoinSession } from '@/lib/rejoinSession'
import { createSingleFlight } from '@/lib/rejoinSubmission'
import { useAuthStore } from '@/store/useAuthStore'
import { useToast } from '@/store/useToastStore'

type RejoinPageState = 'loading' | 'ready' | 'submitting' | 'expired' | 'error'

const retainedItems = [
  '기존 사용자 ID',
  '구매·찜 등 기존 데이터',
  '판매자 역할 등 기존 권한',
  '기존 OAuth 연동',
]

function startKakaoLogin() {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? '',
    redirect_uri: `${window.location.origin}/auth/kakao/callback`,
    response_type: 'code',
  })
  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`)
}

export default function RejoinPage() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)
  const openLoginModal = useAuthStore((state) => state.openLoginModal)
  const showToast = useToast()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const singleFlight = useRef(createSingleFlight())
  const [pageState, setPageState] = useState<RejoinPageState>('loading')

  useEffect(() => {
    let active = true
    let expiryTimer: ReturnType<typeof setTimeout> | undefined
    queueMicrotask(() => {
      if (!active) return
      const inspection = rejoinSession.inspect()
      if (inspection.status === 'missing') {
        openLoginModal()
        router.replace('/')
        return
      }
      setPageState(inspection.status === 'expired' ? 'expired' : 'ready')
      if (inspection.status === 'valid') {
        const remainingMs = Date.parse(inspection.value.expiresAt) - Date.now()
        expiryTimer = setTimeout(
          () => {
            rejoinSession.clear()
            setPageState('expired')
          },
          Math.min(remainingMs, 2_147_483_647),
        )
      }
    })

    return () => {
      active = false
      if (expiryTimer) clearTimeout(expiryTimer)
    }
  }, [openLoginModal, router])

  useEffect(() => {
    if (pageState === 'ready' || pageState === 'expired' || pageState === 'error') {
      headingRef.current?.focus()
    }
  }, [pageState])

  const returnToLogin = () => {
    rejoinSession.clear()
    openLoginModal()
    router.replace('/')
  }

  const handleConfirm = async () => {
    const submission = singleFlight.current.run(async () => {
      const inspection = rejoinSession.inspect()
      if (inspection.status !== 'valid') {
        setPageState('expired')
        return
      }

      setPageState('submitting')
      try {
        const result = await rejoin({ rejoinToken: inspection.value.token })
        const roles = result.user.roles.map((role) => role.toLowerCase())
        login({ ...result.user, roles, provider: 'kakao' }, result.accessToken, result.refreshToken)
        rejoinSession.clear()
        showToast('계정이 다시 활성화되었습니다')
        router.replace('/')
      } catch (error) {
        if (getAuthErrorCode(error) === 'A014' || rejoinSession.inspect().status !== 'valid') {
          rejoinSession.clear()
          setPageState('expired')
          return
        }
        setPageState('error')
      }
    })

    if (submission) await submission
  }

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <p role="status" className="text-[15px] text-ph-text-secondary">
          재가입 정보를 확인하고 있어요.
        </p>
      </div>
    )
  }

  const isSubmitting = pageState === 'submitting'
  const isExpired = pageState === 'expired'
  const isError = pageState === 'error'

  return (
    <div
      className="flex min-h-[calc(100vh-72px)] items-center justify-center px-5 py-14 font-ph"
      style={{ background: 'linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%)' }}
    >
      <section className="w-full max-w-[520px] rounded-ph-xl border border-ph-border bg-ph-white p-7 sm:p-10">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-ph-secondary text-ph-primary">
          {isExpired ? (
            <Clock3 aria-hidden="true" className="h-6 w-6" />
          ) : isError ? (
            <RefreshCcw aria-hidden="true" className="h-6 w-6" />
          ) : (
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          )}
        </div>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="m-0 text-[28px] font-bold tracking-[-0.02em] text-ph-text outline-none"
        >
          {isExpired
            ? '재가입 확인 시간이 만료되었어요'
            : isError
              ? '계정을 복구하지 못했어요'
              : '다시 만나 반가워요'}
        </h1>

        <div aria-live="polite" aria-atomic="true">
          {isExpired ? (
            <>
              <p className="mb-7 mt-3 text-[15px] leading-6 text-ph-text-secondary">
                안전한 계정 복구를 위해 다시 로그인해주세요.
              </p>
              <button
                type="button"
                onClick={startKakaoLogin}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-ph-md border-0 bg-[#FEE500] text-[16px] font-bold text-[#191600] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle aria-hidden="true" className="h-5 w-5" />
                카카오로 다시 로그인
              </button>
            </>
          ) : isError ? (
            <>
              <p className="mb-7 mt-3 text-[15px] leading-6 text-ph-text-secondary">
                잠시 후 다시 시도해주세요. 재가입 확인 시간 안에는 같은 화면에서 다시 시도할 수
                있어요.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="h-[52px] flex-1 rounded-ph-md border-0 bg-ph-primary px-5 text-[16px] font-bold text-ph-white hover:bg-ph-blue-hover"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={returnToLogin}
                  className="h-[52px] flex-1 rounded-ph-md border border-ph-border bg-ph-white px-5 text-[15px] font-bold text-ph-text"
                >
                  로그인으로 돌아가기
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-6 mt-3 text-[15px] leading-6 text-ph-text-secondary">
                이전에 탈퇴한 계정입니다. 재가입하면 기존 계정을 그대로 이어서 사용할 수 있어요.
              </p>

              <div className="rounded-ph-lg bg-ph-surface-muted p-5">
                <p className="mb-3 mt-0 text-[14px] font-bold text-ph-text">
                  기존 계정을 다시 활성화하면 유지되는 항목
                </p>
                <ul className="m-0 space-y-2.5 p-0">
                  {retainedItems.map((item) => (
                    <li
                      key={item}
                      className="flex list-none items-start gap-2 text-[14px] leading-5 text-ph-text-secondary"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-ph-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mb-6 mt-4 flex items-start gap-2 text-[13px] leading-5 text-ph-text-muted">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                취소하면 계정에는 아무 변경도 발생하지 않습니다.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  aria-describedby={isSubmitting ? 'rejoin-progress' : undefined}
                  className="h-[52px] rounded-ph-md border-0 bg-ph-primary px-5 text-[16px] font-bold text-ph-white hover:bg-ph-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? '계정을 복구하고 있어요' : '기존 계정으로 다시 시작'}
                </button>
                <button
                  type="button"
                  onClick={returnToLogin}
                  disabled={isSubmitting}
                  className="h-[48px] rounded-ph-md border border-ph-border bg-ph-white px-5 text-[15px] font-bold text-ph-text disabled:cursor-not-allowed disabled:opacity-50"
                >
                  취소하고 로그인으로 돌아가기
                </button>
              </div>

              <p id="rejoin-progress" role="status" className="sr-only">
                {isSubmitting ? '계정을 복구하고 있습니다. 잠시만 기다려주세요.' : ''}
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
