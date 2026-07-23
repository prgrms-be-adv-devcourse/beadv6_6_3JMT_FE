import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  provider?: 'local' | 'kakao'
  profileImageUrl?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoggedIn: boolean
  loginModalOpen: boolean
  _hasHydrated: boolean
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  setToken: (token: string, refreshToken?: string) => void
  openLoginModal: () => void
  closeLoginModal: () => void
  setHasHydrated: (state: boolean) => void
}

// RT 만료(7일)와 동일하게 맞춤 — 짧으면 RT가 살아있어도 middleware가 먼저 로그아웃 처리해버림
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,
      loginModalOpen: false,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      login: (user, token, refreshToken) => {
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=${COOKIE_MAX_AGE}`
          document.cookie = `roles=${user.roles.join(',')}; path=/; max-age=${COOKIE_MAX_AGE}`
        }
        set((state) => ({ user, token, refreshToken: refreshToken ?? state.refreshToken, isLoggedIn: true }))
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
          document.cookie = 'roles=; path=/; max-age=0'
        }
        set({ user: null, token: null, refreshToken: null, isLoggedIn: false })
      },
      setToken: (token, refreshToken) => {
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=${COOKIE_MAX_AGE}`
        }
        set((state) => ({ token, refreshToken: refreshToken ?? state.refreshToken }))
      },
      openLoginModal: () => set({ loginModalOpen: true }),
      closeLoginModal: () => set({ loginModalOpen: false }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        // 구형 role(string) → 신형 roles(string[]) 마이그레이션
        if (state?.user && !state.user.roles) {
          const legacyRole = (state.user as unknown as { role?: string }).role
          if (legacyRole) {
            state.user.roles = [legacyRole.toLowerCase()]
          }
        }
        state?.setHasHydrated(true)
      },
    }
  )
)
