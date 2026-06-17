'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: '▣' },
  { href: '/admin/users', label: '유저 관리', icon: '👥' },
  { href: '/admin/products', label: '상품 관리', icon: '📦' },
  { href: '/admin/sellers', label: '판매자 신청', icon: '🏪' },
  { href: '/admin/orders', label: '주문 관리', icon: '🛒' },
  { href: '/admin/payments', label: '정산 내역', icon: '💰' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  useEffect(() => {
    if (pathname === '/admin/login') return
    if (user && user.role !== 'admin') router.replace('/admin/login')
  }, [user, router, pathname])

  // 로그인 페이지는 사이드바 없이 렌더링
  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
    } finally {
      logout()
      router.push('/')
    }
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* 사이드바 */}
      <aside className="w-60 flex-shrink-0 bg-[#0f172a] flex flex-col">
        {/* 로고 */}
        <div className="h-16 flex items-center px-6 border-b border-[#1e293b]">
          <span className="text-white font-bold text-lg">PromptHub</span>
          <span className="ml-2 text-xs bg-[#1B64DA] text-white px-2 py-0.5 rounded-full">Admin</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 mx-3 rounded-lg mb-1 text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1B64DA] text-white font-semibold'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* 하단 유저 정보 */}
        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1B64DA] flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0] ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name ?? '관리자'}</p>
              <p className="text-[#64748b] text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-center text-[#64748b] hover:text-white text-xs py-1.5 rounded transition-colors"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center px-8 flex-shrink-0">
          <h1 className="text-[#0f172a] font-semibold text-base">
            {NAV_ITEMS.find((item) =>
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            )?.label ?? '관리자 콘솔'}
          </h1>
          <div className="ml-auto text-sm text-[#64748b]">
            2026-06-17
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
