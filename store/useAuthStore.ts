import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller' | 'admin'
  provider?: 'local' | 'kakao'
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoggedIn: boolean
  loginModalOpen: boolean
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  setToken: (token: string) => void
  openLoginModal: () => void
  closeLoginModal: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoggedIn: false,
      loginModalOpen: false,
      login: (user, token, refreshToken) => {
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=86400`
          document.cookie = `role=${user.role}; path=/; max-age=86400`
        }
        set({ user, token, refreshToken: refreshToken ?? null, isLoggedIn: true })
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
          document.cookie = 'role=; path=/; max-age=0'
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
    }
  )
)
