import axios from 'axios'
import { directRoutingHeaders } from '@/lib/directRouting'
import { useAuthStore } from '@/store/useAuthStore'
import { useToastStore } from '@/store/useToastStore'
import { API_BASE } from '@/lib/apiBase'

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL,
})

// interceptor 없는 별도 인스턴스: refresh 요청 자체가 401을 받아도 아래 response
// interceptor를 다시 타지 않게 해서, isRefreshing 대기열과의 데드락을 막는다.
const refreshClient = axios.create({
  baseURL: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const { token, user } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const directHeaders = directRoutingHeaders(config.url, user ?? null)
  if (directHeaders) {
    Object.assign(config.headers, directHeaders)
  }
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken, setToken, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) {
              reject(error)
              return
            }
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await refreshClient.post(`${API_BASE}/auth/token/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = res.data.data as {
          accessToken: string
          refreshToken?: string
        }
        setToken(accessToken, newRefreshToken)
        pendingQueue.forEach((cb) => cb(accessToken))
        pendingQueue = []
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        pendingQueue.forEach((cb) => cb(null))
        pendingQueue = []
        // A006/A012/A013 등 refresh 실패 사유를 백엔드 message 그대로 안내
        // (예: RT 재사용 감지, 세션 무효화 시 무음 로그아웃되지 않도록)
        const message = (refreshErr as { response?: { data?: { message?: string } } })?.response?.data
          ?.message
        if (message) {
          useToastStore.getState().showToast(message)
        }
        logout()
        if (typeof window !== 'undefined') {
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
