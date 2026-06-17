'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Header from './Header'
import Footer from './Footer'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    // admin 계정이 일반 사이트로 오면 로그인 정보 초기화
    if (user?.role === 'admin' && !isAdmin) {
      logout()
    }
  }, [user, isAdmin, logout])

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
