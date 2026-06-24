'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Check,
  X,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/api'
import { SectionCard, LinkAction } from '@/components/admin/SectionCard'
import { Identity } from '@/components/admin/DataTable'
import { ICON_MAP } from '@/lib/iconMap'

interface SalesPoint {
  day: string
  date: string
  count: number
  revenue: number
}

interface Stats {
  totalUsers: number
  totalUsersDelta: number
  newToday: number
  newTodayDelta: number
  monthRevenue: number
  monthRevenueDelta: number
  pendingPayout: number
  pendingPayoutCount: number
  sales7d: SalesPoint[]
}

interface SellerApply {
  id: string
  userId: string
  userName: string
  email: string
  categories: string[]
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

interface ReviewProduct {
  id: string
  title: string
  seller: string
  model: string
  category: string
  icon: string
  status?: string
}

const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`
function wonShort(n: number) {
  if (n >= 1e8) return `₩${(n / 1e8).toFixed(1)}억`
  if (n >= 1e4) return `₩${Math.round(n / 1e4).toLocaleString('ko-KR')}만`
  return `₩${n.toLocaleString('ko-KR')}`
}

const CATEGORY_LABEL: Record<string, string> = {
  writing: '글쓰기',
  marketing: '마케팅',
  image: '이미지 생성',
  coding: '코딩',
  chatbot: '챗봇',
  data: '데이터 분석',
}

function mmdd(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* ── KPI 카드 ── */
function StatCard({
  Icon,
  label,
  value,
  sub,
  delta,
  loading,
}: {
  Icon: typeof Users
  label: string
  value: string
  sub?: string
  delta?: number
  loading?: boolean
}) {
  const up = delta != null && delta >= 0
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
            {delta != null && (
              <span
                className={`inline-flex items-center gap-[2px] pb-[2px] text-[13px] font-bold ${
                  up ? 'text-ph-primary' : 'text-ph-error'
                }`}
              >
                {up ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                {Math.abs(delta)}%
              </span>
            )}
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
  const [stats, setStats] = useState<Stats | null>(null)
  const [applies, setApplies] = useState<SellerApply[]>([])
  const [products, setProducts] = useState<ReviewProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = async () => {
    try {
      const [statsRes, appliesRes, productsRes] = await Promise.all([
        api.get('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/admin/sellers/applies', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/admin/products', {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'review' },
        }),
      ])
      setStats(statsRes.data.data)
      setApplies(appliesRes.data.data ?? [])
      setProducts(productsRes.data.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const actSellerApp = async (id: string, action: 'approve' | 'reject') => {
    setActing(id)
    try {
      await api.put(`/api/v1/admin/sellers/${id}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setApplies((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a)),
      )
    } finally {
      setActing(null)
    }
  }

  const sales = stats?.sales7d ?? []
  const weekTotal = sales.reduce((s, d) => s + d.count, 0)
  const weekRevenue = sales.reduce((s, d) => s + d.revenue, 0)
  const pendingApps = applies.filter((a) => a.status === 'pending').slice(0, 4)
  const pendingAppsCount = applies.filter((a) => a.status === 'pending').length
  const reviewProducts = products.filter((p) => p.status === 'review').slice(0, 4)
  const reviewCount = products.filter((p) => p.status === 'review').length

  return (
    <div className="flex flex-col gap-[20px]">
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          Icon={Users}
          label="총 가입자"
          value={(stats?.totalUsers ?? 0).toLocaleString('ko-KR')}
          delta={stats?.totalUsersDelta}
          sub="누적 회원 수"
          loading={loading}
        />
        <StatCard
          Icon={UserPlus}
          label="오늘 신규 가입"
          value={(stats?.newToday ?? 0).toLocaleString('ko-KR')}
          delta={stats?.newTodayDelta}
          sub="어제 대비"
          loading={loading}
        />
        <StatCard
          Icon={TrendingUp}
          label="이번 달 거래액"
          value={wonShort(stats?.monthRevenue ?? 0)}
          delta={stats?.monthRevenueDelta}
          sub={`GMV · ${won(stats?.monthRevenue ?? 0)}`}
          loading={loading}
        />
        <StatCard
          Icon={Wallet}
          label="정산 대기 금액"
          value={wonShort(stats?.pendingPayout ?? 0)}
          sub={`${stats?.pendingPayoutCount ?? 0}건 처리 대기`}
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

      {/* 하단 반반: 최근 판매자 신청 + 검수 대기 상품 */}
      <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-2">
        <SectionCard
          title="최근 판매자 신청"
          sub={`${pendingAppsCount}건 승인 대기`}
          action={<LinkAction onClick={() => router.push('/admin/sellers')}>전체 보기</LinkAction>}
          bodyStyle={{ padding: pendingApps.length ? '6px 0' : 0 }}
        >
          {loading ? null : pendingApps.length === 0 ? (
            <AdminEmpty Icon={CheckCircle2} title="처리할 신청이 없어요" sub="모든 판매자 신청을 검토했습니다." />
          ) : (
            pendingApps.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-[12px] px-[22px] py-[13px]"
                style={{ borderTop: i ? '1px solid var(--ph-border)' : 'none' }}
              >
                <div className="min-w-0 flex-1">
                  <Identity
                    name={a.userName}
                    sub={a.categories.map((c) => CATEGORY_LABEL[c] ?? c).join(', ') || a.email}
                    size={38}
                  />
                </div>
                <span className="whitespace-nowrap text-[12.5px] text-ph-text-muted">{mmdd(a.appliedAt)}</span>
                <div className="flex gap-[6px]">
                  <RowBtn tone="solid" onClick={() => actSellerApp(a.id, 'approve')} disabled={acting === a.id}>
                    <Check size={15} />승인
                  </RowBtn>
                  <RowBtn tone="danger" onClick={() => actSellerApp(a.id, 'reject')} disabled={acting === a.id}>
                    <X size={15} />반려
                  </RowBtn>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="검수 대기 상품"
          sub={`${reviewCount}건 검수 대기`}
          action={<LinkAction onClick={() => router.push('/admin/products')}>전체 보기</LinkAction>}
          bodyStyle={{ padding: reviewProducts.length ? '6px 0' : 0 }}
        >
          {loading ? null : reviewProducts.length === 0 ? (
            <AdminEmpty Icon={ClipboardCheck} title="검수할 상품이 없어요" sub="모든 등록 상품을 검토했습니다." />
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
    </div>
  )
}
