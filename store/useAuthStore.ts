import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  roles: string[]
  provider?: 'local' | 'kakao'
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
  setToken: (token: string) => void
  openLoginModal: () => void
  closeLoginModal: () => void
  setHasHydrated: (state: boolean) => void
}

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
          document.cookie = `token=${token}; path=/; max-age=86400`
          document.cookie = `roles=${user.roles.join(',')}; path=/; max-age=86400`
        }
        set({ user, token, refreshToken: refreshToken ?? null, isLoggedIn: true })
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
          document.cookie = 'roles=; path=/; max-age=0'
        }
        set({ user: null, token: null, refreshToken: null, isLoggedIn: false })
      },
      setToken: (token) => set({ token }),
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
