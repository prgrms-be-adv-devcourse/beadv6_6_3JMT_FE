import { create } from 'zustand'

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

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  loginModalOpen: false,
  login: (user, token) => set({ user, token, isLoggedIn: true }),
  logout: () => set({ user: null, token: null, isLoggedIn: false }),
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),
}))
