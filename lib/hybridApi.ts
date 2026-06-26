import type { AxiosRequestConfig } from 'axios'

type AuthRole = 'buyer' | 'seller' | 'admin' | string | undefined

type CreateOrderSingle = { productId: string }
type CreateOrderCart = { productIds: string[] }

const MOCK_USER_UUIDS: Record<string, string> = {
  'user-1': '00000000-0000-0000-0000-000000000001',
  'user-2': '00000000-0000-0000-0000-000000000002',
  'user-3': '00000000-0000-0000-0000-000000000003',
  'user-4': '00000000-0000-0000-0000-000000000004',
  'user-5': '00000000-0000-0000-0000-000000000005',
  'user-6': '00000000-0000-0000-0000-000000000006',
  'user-7': '00000000-0000-0000-0000-000000000007',
  'admin-1': '00000000-0000-0000-0000-000000000101',
}

export function isHybridApiMocking(value: string | undefined): boolean {
  return value === 'hybrid'
}

export function isApiMockingEnabled(value: string | undefined): boolean {
  return value === 'enabled' || value === 'hybrid'
}

export function shouldAttachHybridGatewayHeaders(url: string | undefined): boolean {
  if (!url) return false

  return (
    url === '/api/v1/orders' ||
    url.startsWith('/api/v1/orders/') ||
    url.startsWith('/api/v1/orders?') ||
    url === '/api/v1/admin/orders' ||
    url.startsWith('/api/v1/admin/orders/') ||
    url.startsWith('/api/v1/admin/orders?') ||
    url === '/api/v1/cart' ||
    url.startsWith('/api/v1/cart/')
  )
}

export function getHybridGatewayHeaders(
  token: string | null | undefined,
  role: AuthRole,
): Record<string, string> | null {
  const prefix = 'mock-token::'
  if (!token?.startsWith(prefix)) return null

  const rawUserId = token.slice(prefix.length)
  const userId = MOCK_USER_UUIDS[rawUserId] ?? rawUserId
  if (!userId) return null

  return {
    'X-User-Id': userId,
    'X-User-Role': String(role).toLowerCase() === 'admin' ? 'ADMIN' : 'USER',
  }
}

export function attachHybridGatewayHeaders(
  config: AxiosRequestConfig,
  token: string | null | undefined,
  role: AuthRole,
): void {
  if (!isHybridApiMocking(process.env.NEXT_PUBLIC_API_MOCKING)) return
  if (!shouldAttachHybridGatewayHeaders(config.url)) return

  const headers = getHybridGatewayHeaders(token, role)
  if (!headers) return

  config.headers = config.headers ?? {}
  Object.assign(config.headers, headers)
}

export function normalizeCreateOrderParams(
  params: CreateOrderSingle | CreateOrderCart,
): CreateOrderCart {
  if ('productId' in params) {
    return { productIds: [params.productId] }
  }

  return { productIds: params.productIds }
}
