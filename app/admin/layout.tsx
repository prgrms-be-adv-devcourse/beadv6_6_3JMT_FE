'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Sparkles,
  LayoutDashboard,
  Users,
  Store,
  ClipboardCheck,
  ShoppingCart,
  Wallet,
  LogOut,
  Bell,
  LifeBuoy,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

type BadgeKey = 'sellers' | 'products' | 'settlements'

type NavEntry =
  | { type: 'group'; label: string }
  | {
      type: 'item'
      href: string
      label: string
      Icon: typeof LayoutDashboard
      badgeKey?: BadgeKey
    }

// 원본 shared-admin-ui.js NAV 구조 (5항목) + 기존 주문 관리 페이지 유지(운영 관리 그룹에 편입)
const NAV: NavEntry[] = [
  { type: 'item', href: '/admin', label: '대시보드 홈', Icon: LayoutDashboard },
  { type: 'group', label: '운영 관리' },
  { type: 'item', href: '/admin/users', label: '사용자 관리', Icon: Users },
  { type: 'item', href: '/admin/sellers', label: '판매자 신청 관리', Icon: Store, badgeKey: 'sellers' },
  { type: 'item', href: '/admin/products', label: '상품 검수', Icon: ClipboardCheck, badgeKey: 'products' },
  { type: 'item', href: '/admin/orders', label: '주문 관리', Icon: ShoppingCart },
  { type: 'item', href: '/admin/payments', label: '정산 관리', Icon: Wallet, badgeKey: 'settlements' },
]

// 원본 admin-app.js PAGES 메타 (title + subtitle)
const PAGE_META: Record<string, { title: string; sub: string }> = {
  '/admin': { title: '대시보드 홈', sub: 'PromptHub 마켓플레이스 운영 현황을 한눈에 확인하세요.' },
  '/admin/users': { title: '사용자 관리', sub: '회원 계정을 조회하고 상태를 관리합니다.' },
  '/admin/sellers': { title: '판매자 신청 관리', sub: '판매자 전환 신청을 검토하고 승인·반려합니다.' },
  '/admin/products': { title: '상품 검수', sub: '등록된 프롬프트를 검수하고 게시 여부를 결정합니다.' },
  '/admin/orders': { title: '주문 관리', sub: '주문 내역을 조회하고 환불을 처리합니다.' },
  '/admin/payments': { title: '정산 관리', sub: '판매 수익 정산을 승인하고 지급을 처리합니다.' },
}

function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const [badges, setBadges] = useState<Record<BadgeKey, number>>({ sellers: 0, products: 0, settlements: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 라우트 이동 시 모바일 사이드바 닫기
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // 사이드바 pending 건수 뱃지 집계
  useEffect(() => {
    if (!token || pathname === '/admin/login') return
    const load = async () => {
      try {
        const [appliesRes, productsRes, paymentsRes] = await Promise.all([
          api.get(`${API_BASE}/admin/sellers/applies`),
          api.get(`${API_BASE}/admin/products`, { params: { status: 'review' } }),
          api.get(`${API_BASE}/admin/payments`),
        ])
        const applies = appliesRes.data.data ?? []
        const products = productsRes.data.data ?? []
        const payments = paymentsRes.data.data ?? []
        setBadges({
          sellers: applies.filter((a: { status: string }) => a.status === 'pending').length,
          products: products.filter((p: { status: string }) => p.status === 'review').length,
          settlements: payments.filter((p: { status: string }) => p.status === 'PENDING_APPROVAL').length,
        })
      } catch {
        // 뱃지 집계 실패는 무시 (레이아웃 동작에 영향 없음)
      }
    }
    load()
  }, [token, pathname])

  // 로그인 페이지는 사이드바 없이 렌더링
  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = async () => {
    try {
      await api.post(`${API_BASE}/auth/logout`)
    } finally {
      logout()
      router.push('/')
    }
  }

  const meta = PAGE_META[pathname] ?? { title: '관리자 콘솔', sub: '' }
  const adminName = user?.name ?? '운영 관리자'
  const adminEmail = user?.email ?? 'admin@prompthub.kr'

  return (
    <div className="min-h-screen bg-ph-surface-muted">
      {/* ── 모바일 오버레이 ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden
        />
      )}

      {/* ── 사이드바 ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-ph-border bg-ph-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 로고 */}
        <div className="flex items-center justify-between px-[22px] pb-[18px] pt-[22px]">
          <div className="flex items-center gap-[10px]">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-ph-primary text-ph-white">
              <Sparkles size={18} />
            </span>
            <span className="flex flex-col leading-[1.1]">
              <span className="text-[18px] font-bold tracking-[-0.02em] text-ph-text">
                Prompt<span className="text-ph-primary">Hub</span>
              </span>
              <span className="text-[11.5px] font-semibold tracking-[0.04em] text-ph-text-muted">ADMIN CONSOLE</span>
            </span>
          </div>
          {/* 모바일 닫기 */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-ph-sm text-ph-text-secondary hover:bg-ph-gray-50 lg:hidden"
            title="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex flex-1 flex-col gap-[2px] overflow-y-auto px-[14px] pb-[14px] pt-[4px]">
          {NAV.map((entry, i) => {
            if (entry.type === 'group') {
              return (
                <div
                  key={`g-${i}`}
                  className="px-[10px] pb-[7px] pt-[16px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-ph-text-muted"
                >
                  {entry.label}
                </div>
              )
            }
            const active = isActive(entry.href, pathname)
            const count = entry.badgeKey ? badges[entry.badgeKey] : 0
            const Icon = entry.Icon
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={`flex items-center gap-[11px] rounded-ph-md px-[12px] py-[10px] text-[14.5px] transition-colors ${
                  active
                    ? 'bg-ph-secondary font-bold text-ph-primary'
                    : 'font-medium text-ph-text-secondary hover:bg-ph-gray-50'
                }`}
              >
                <Icon size={19} className="flex-shrink-0" />
                <span className="flex-1">{entry.label}</span>
                {count > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-[6px] text-[12px] font-bold ${
                      active ? 'bg-ph-primary text-ph-white' : 'bg-ph-secondary text-ph-primary'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* 하단 유저 */}
        <div className="border-t border-ph-border p-[14px]">
          <div className="flex items-center gap-[10px] px-[10px] py-[8px]">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ph-secondary text-[14px] font-bold text-ph-primary">
              {adminName[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-ph-text">{adminName}</div>
              <div className="truncate text-[12px] text-ph-text-muted">{adminEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              title="로그아웃"
              className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-ph-sm border border-ph-border text-ph-text-secondary transition-colors hover:border-ph-error hover:bg-[#fdeceb] hover:text-ph-error"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── 메인 ── */}
      <div className="flex min-h-screen flex-col lg:ml-[248px]">
        {/* 상단바 */}
        <header className="sticky top-0 z-30 border-b border-ph-border bg-white/85 backdrop-blur-[12px]">
          <div className="flex h-[70px] items-center gap-[12px] px-[20px] sm:gap-[20px] sm:px-[36px]">
            {/* 모바일 햄버거 */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-ph-md text-ph-text-secondary hover:bg-ph-gray-50 lg:hidden"
              title="메뉴"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="m-0 truncate text-[19px] font-bold tracking-[-0.02em] text-ph-text sm:text-[22px]">
                {meta.title}
              </h1>
              {meta.sub && <p className="mt-[3px] hidden truncate text-[13.5px] text-ph-text-muted sm:block">{meta.sub}</p>}
            </div>
            <div className="flex items-center gap-[8px]">
              <button
                title="알림"
                className="relative flex h-10 w-10 items-center justify-center rounded-ph-md text-ph-text-secondary"
              >
                <Bell size={19} />
                <span className="absolute right-[10px] top-[9px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-ph-primary" />
              </button>
              <button
                title="도움말"
                className="hidden h-10 w-10 items-center justify-center rounded-ph-md text-ph-text-secondary sm:flex"
              >
                <LifeBuoy size={19} />
              </button>
              <div className="mx-[4px] hidden h-6 w-px bg-ph-border sm:block" />
              <span className="hidden items-center gap-[7px] rounded-ph-full border border-ph-border bg-ph-gray-50 px-[10px] py-[6px] text-[13px] font-semibold text-ph-text-secondary sm:inline-flex">
                <ShieldCheck size={15} className="text-ph-primary" />
                운영팀
              </span>
            </div>
          </div>
        </header>

        {/* 콘텐츠 */}
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-[20px] pb-[40px] pt-[24px] sm:px-[36px] sm:pb-[56px] sm:pt-[28px]">
          {children}
        </main>
      </div>
    </div>
  )
}
