export type DirectRoutingService = 'settlement' | 'order' | 'product' | 'payment' | 'user'

export interface DirectRoutingConfig {
  service: DirectRoutingService
  enableEnvVar: string
  targetEnvVar: string
  defaultTarget: string
  pathPrefixes: string[]
}

// 순서 고정: apigateway(application.yaml)의 라우트 선언 순서(settlement → order → product → payment → user)와
// 동일하게 맞춘다. user-service는 /api/v1/sellers, /api/v1/admin 같은 넓은 경로를 갖고 있어서 반드시
// 마지막에 와야 settlement/order/product의 더 구체적인 경로가 먼저 매칭된다.
export const DIRECT_ROUTING_CONFIGS: DirectRoutingConfig[] = [
  {
    service: 'settlement',
    enableEnvVar: 'NEXT_PUBLIC_SETTLEMENT_DIRECT',
    targetEnvVar: 'SETTLEMENT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8085',
    pathPrefixes: ['/api/v1/sellers/me/settlements', '/api/v1/admin/settlements'],
  },
  {
    service: 'order',
    enableEnvVar: 'NEXT_PUBLIC_ORDER_DIRECT',
    targetEnvVar: 'ORDER_PROXY_TARGET',
    defaultTarget: 'http://localhost:8083',
    pathPrefixes: ['/api/v1/orders', '/api/v1/cart', '/api/v1/admin/orders'],
  },
  {
    service: 'product',
    enableEnvVar: 'NEXT_PUBLIC_PRODUCT_DIRECT',
    targetEnvVar: 'PRODUCT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8082',
    pathPrefixes: ['/api/v1/products', '/api/v1/sellers/me/products', '/api/v1/admin/products'],
  },
  {
    service: 'payment',
    enableEnvVar: 'NEXT_PUBLIC_PAYMENT_DIRECT',
    targetEnvVar: 'PAYMENT_PROXY_TARGET',
    defaultTarget: 'http://localhost:8084',
    pathPrefixes: ['/api/v1/payments'],
  },
  {
    service: 'user',
    enableEnvVar: 'NEXT_PUBLIC_USER_DIRECT',
    targetEnvVar: 'USER_PROXY_TARGET',
    defaultTarget: 'http://localhost:8081',
    pathPrefixes: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/seller',
      '/api/v1/sellers',
      '/api/v1/wishlists',
      '/api/v1/admin',
    ],
  },
]

function isEnabled(cfg: DirectRoutingConfig): boolean {
  return process.env[cfg.enableEnvVar] === 'true'
}

function targetFor(cfg: DirectRoutingConfig): string {
  return process.env[cfg.targetEnvVar] || cfg.defaultTarget
}

export function buildDirectRoutingRewrites(): { source: string; destination: string }[] {
  const rules: { source: string; destination: string }[] = []
  for (const cfg of DIRECT_ROUTING_CONFIGS) {
    if (!isEnabled(cfg)) continue
    const target = targetFor(cfg)
    for (const prefix of cfg.pathPrefixes) {
      rules.push({ source: `${prefix}/:path*`, destination: `${target}${prefix}/:path*` })
    }
  }
  return rules
}

export function isDirectRoutedUrl(url?: string): boolean {
  if (!url || process.env.NODE_ENV === 'production') return false
  const path = url.split('?')[0]
  return DIRECT_ROUTING_CONFIGS.some(
    (cfg) => isEnabled(cfg) && cfg.pathPrefixes.some((p) => path === p || path.startsWith(`${p}/`)),
  )
}

export function directRoutingHeaders(
  url: string | undefined,
  user: { id: string; roles: string[] } | null | undefined,
): Record<string, string> | null {
  if (!user || !isDirectRoutedUrl(url)) return null
  const role = user.roles[0]
  return {
    'X-User-Id': user.id,
    'X-User-Role': role ? role.toUpperCase() : '',
  }
}
