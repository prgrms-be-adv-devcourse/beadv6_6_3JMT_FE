'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, TrendingUp, Wallet, ClipboardCheck, Sparkles } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { getAdminHome } from '@/lib/adminHome'
import type { AdminHomeViewModel } from '@/lib/adminHomeAdapters'
import { SectionCard, LinkAction } from '@/components/admin/SectionCard'
import { ICON_MAP } from '@/lib/iconMap'
import { apiErrorMessage } from '@/lib/utils'

type SalesPoint = AdminHomeViewModel['stats']['sales7d'][number]

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`
function wonShort(n: number) {
  if (n >= 1e8) return `₩${(n / 1e8).toFixed(1)}억`
  if (n >= 1e4) return `₩${Math.round(n / 1e4).toLocaleString('ko-KR')}만`
  return `₩${n.toLocaleString('ko-KR')}`
}

/* ── KPI 카드 ── */
function StatCard({
  Icon,
  label,
  value,
  sub,
  loading,
}: {
  Icon: typeof Users
  label: string
  value: string
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="rounded-ph-lg border border-ph-border bg-ph-white px-[22px] py-[20px]">
      <div className="flex items-center gap-[10px]">
        <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-ph-md bg-ph-secondary text-ph-primary">
          <Icon size={20} />
        </span>
        <span className="text-[14px] font-semibold text-ph-text-secondary">{label}</span>
      </div>
      <div className="mt-[16px] flex flex-wrap items-end gap-[10px]">
        {loading ? (
          <div className="h-[30px] w-[120px] animate-pulse rounded bg-ph-gray-100" />
        ) : (
          <>
            <span className="text-[30px] font-bold leading-none tracking-[-0.02em] text-ph-text">
              {value}
            </span>
          </>
        )}
      </div>
      {sub && <div className="mt-[8px] text-[13px] text-ph-text-muted">{sub}</div>}
    </div>
  )
}

/* ── 거래 건수 막대그래프 (원본 BarChart 이식) ── */
function SalesBarChart({ data }: { data: SalesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="flex items-end gap-[14px]" style={{ height: 230, padding: '8px 4px 0' }}>
      {data.map((d, i) => {
        const h = Math.round((d.count / max) * 100)
        const on = hover === i
        return (
          <div
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex h-full flex-1 flex-col items-center justify-end gap-[10px]"
          >
            <div
              className={`text-[13px] font-bold transition-colors ${
                on ? 'text-ph-primary' : 'text-ph-text-secondary'
              }`}
            >
              {d.count}
            </div>
            <div
              className={on ? 'bg-ph-primary' : 'bg-ph-secondary'}
              style={{
                width: '100%',
                maxWidth: 46,
                height: `${h}%`,
                minHeight: 8,
                borderRadius: '8px 8px 4px 4px',
                transition: 'background-color .15s ease, height .3s ease',
              }}
            />
            <div className="text-center leading-[1.3]">
              <div
                className={`text-[13.5px] font-semibold ${on ? 'text-ph-text' : 'text-ph-text-secondary'}`}
              >
                {d.day}
              </div>
              <div className="text-[11.5px] text-ph-text-muted">{d.date}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── 행 액션 버튼 ── */
function RowBtn({
  children,
  tone = 'neutral',
  onClick,
  disabled,
}: {
  children: ReactNode
  tone?: 'neutral' | 'blue' | 'solid' | 'danger'
  onClick?: () => void
  disabled?: boolean
}) {
  const tones: Record<string, string> = {
    neutral: 'border-ph-border bg-ph-white text-ph-text-secondary hover:bg-ph-gray-50',
    blue: 'border-ph-border bg-ph-white text-ph-primary hover:bg-ph-secondary hover:border-ph-primary',
    solid: 'border-transparent bg-ph-primary text-white hover:bg-ph-blue-hover',
    danger: 'border-ph-border bg-ph-white text-ph-error hover:border-ph-error hover:bg-[#fdeceb]',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-[34px] items-center justify-center gap-[5px] whitespace-nowrap rounded-ph-sm border px-[12px] text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

/* ── 빈 상태 ── */
function AdminEmpty({ Icon, title, sub }: { Icon: typeof Users; title: string; sub?: string }) {
  return (
    <div className="px-[20px] py-[56px] text-center text-ph-text-muted">
      <div className="mx-auto mb-[16px] flex h-[56px] w-[56px] items-center justify-center rounded-ph-full border border-ph-border bg-ph-gray-50">
        <Icon size={26} className="text-ph-text-muted" />
      </div>
      <div className="text-[15px] font-bold text-ph-text-secondary">{title}</div>
      {sub && <div className="mt-[5px] text-[13.5px]">{sub}</div>}
    </div>
  )
}

function CategoryIcon({ slug, style }: { slug: string; style?: CSSProperties }) {
  const Comp = ICON_MAP[slug] ?? Sparkles
  return <Comp style={style} />
}

export default function AdminDashboardPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [home, setHome] = useState<AdminHomeViewModel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setHome(await getAdminHome())
    } catch (err: unknown) {
      setError(apiErrorMessage(err, '대시보드 정보를 불러오지 못했어요'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return

    let active = true
    void getAdminHome()
      .then((data) => {
        if (active) setHome(data)
      })
      .catch((err: unknown) => {
        if (active) setError(apiErrorMessage(err, '대시보드 정보를 불러오지 못했어요'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const stats = home?.stats
  const sales = stats?.sales7d ?? []
  const weekTotal = stats?.weekTotal ?? 0
  const weekRevenue = stats?.weekRevenue ?? 0
  const reviewProducts = home?.products ?? []
  const reviewCount = home?.reviewCount ?? 0

  if (error) {
    return (
      <div className="rounded-ph-lg border border-ph-border bg-ph-white px-[24px] py-[56px] text-center">
        <div className="text-[15px] font-bold text-ph-text">{error}</div>
        <div className="mt-[6px] text-[13.5px] text-ph-text-muted">잠시 후 다시 시도해 주세요.</div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-[18px] inline-flex h-[36px] items-center justify-center rounded-ph-sm bg-ph-primary px-[16px] text-[13.5px] font-semibold text-white hover:bg-ph-blue-hover"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          Icon={Users}
          label="총 가입자"
          value={(stats?.totalUsers ?? 0).toLocaleString('ko-KR')}
          sub="누적 회원 수"
          loading={loading}
        />
        <StatCard
          Icon={UserPlus}
          label="오늘 신규 가입"
          value={(stats?.newToday ?? 0).toLocaleString('ko-KR')}
          sub="오늘 가입한 회원"
          loading={loading}
        />
        <StatCard
          Icon={TrendingUp}
          label="이번 달 거래액"
          value={wonShort(stats?.monthRevenue ?? 0)}
          sub={`GMV · ${won(stats?.monthRevenue ?? 0)}`}
          loading={loading}
        />
        <StatCard
          Icon={Wallet}
          label="정산 대기 금액"
          value={wonShort(stats?.pendingApprovalAmount ?? 0)}
          sub={`${stats?.pendingApprovalCount ?? 0}건 처리 대기`}
          loading={loading}
        />
      </div>

      {/* 최근 7일 거래량 */}
      <SectionCard
        title="최근 7일 거래량"
        sub={`총 ${weekTotal.toLocaleString('ko-KR')}건 · ${won(weekRevenue)} 거래`}
        action={
          <span className="inline-flex items-center gap-[7px] text-[13px] font-semibold text-ph-text-secondary">
            <span
              className="inline-block h-[11px] w-[11px] rounded-[3px]"
              style={{ background: 'var(--ph-secondary)', border: '1px solid var(--ph-primary)' }}
            />
            거래 건수
          </span>
        }
        bodyStyle={{ padding: '20px 24px 22px' }}
      >
        {loading ? (
          <div className="h-[230px] animate-pulse rounded bg-ph-gray-100" />
        ) : (
          <SalesBarChart data={sales} />
        )}
      </SectionCard>

      <SectionCard
        title="검수 대기 상품"
        sub={`${reviewCount}건 검수 대기`}
        action={<LinkAction onClick={() => router.push('/admin/products')}>전체 보기</LinkAction>}
        bodyStyle={{ padding: reviewProducts.length ? '6px 0' : 0 }}
      >
        {loading ? null : reviewProducts.length === 0 ? (
          <AdminEmpty
            Icon={ClipboardCheck}
            title="검수할 상품이 없어요"
            sub="모든 등록 상품을 검토했습니다."
          />
        ) : (
          reviewProducts.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-[12px] px-[22px] py-[13px]"
              style={{ borderTop: i ? '1px solid var(--ph-border)' : 'none' }}
            >
              <span className="inline-flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-ph-md bg-ph-secondary text-ph-primary">
                <CategoryIcon slug={p.icon} style={{ width: 19, height: 19 }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-ph-text">{p.title}</div>
                <div className="text-[12.5px] text-ph-text-muted">
                  {p.seller} · {p.model}
                </div>
              </div>
              <RowBtn tone="blue" onClick={() => router.push('/admin/products')}>
                검수
              </RowBtn>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  )
}
