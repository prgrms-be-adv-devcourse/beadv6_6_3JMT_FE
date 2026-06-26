import axios from 'axios'
import { attachHybridGatewayHeaders, isApiMockingEnabled } from '@/lib/hybridApi'
import { useAuthStore } from '@/store/useAuthStore'

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  attachHybridGatewayHeaders(config, token, user?.role)
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken, setToken, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        if (!isApiMockingEnabled(process.env.NEXT_PUBLIC_API_MOCKING) && typeof window !== 'undefined') {
          window.location.href = '/'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/api/v1/auth/token/refresh', { refreshToken })
        const { accessToken } = res.data.data as { accessToken: string }
        setToken(accessToken)
        pendingQueue.forEach((cb) => cb(accessToken))
        pendingQueue = []
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch {
        logout()
        if (!isApiMockingEnabled(process.env.NEXT_PUBLIC_API_MOCKING) && typeof window !== 'undefined') {
          window.location.href = '/'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
