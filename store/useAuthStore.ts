import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'seller'
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  loginModalOpen: boolean
  login: (user: User, token: string) => void
  logout: () => void
  openLoginModal: () => void
  closeLoginModal: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      loginModalOpen: false,
      login: (user, token) => {
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=86400`
          document.cookie = `role=${user.role}; path=/; max-age=86400`
        }
        set({ user, token, isLoggedIn: true })
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
          document.cookie = 'role=; path=/; max-age=0'
        }
        set({ user: null, token: null, isLoggedIn: false })
      },
      openLoginModal: () => set({ loginModalOpen: true }),
      closeLoginModal: () => set({ loginModalOpen: false }),
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
