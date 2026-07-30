'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Header from './Header'
import Footer from './Footer'
import LoginModal from '@/components/modals/LoginModal'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { loginModalOpen, closeLoginModal } = useAuthStore()
  const isFullscreen = pathname.startsWith('/admin')
  const hideFooter = isFullscreen || pathname.startsWith('/reader')

  return (
    <>
      <LoginModal open={loginModalOpen} onClose={closeLoginModal} />
      {isFullscreen ? (
        children
      ) : (
        <>
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          <main style={{ flex: 1 }}>
            {children}
          </main>
          {!hideFooter && <Footer />}
        </>
      )}
    </>
  )
}
