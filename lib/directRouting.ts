// 로컬 직접 라우팅 (Direct Routing)
// 로컬에서 테스트하고 싶은 서비스 하나의 경로 목록과 대상을 .env.local에 개인적으로 설정하면,
// 그 경로들만 로컬로 가고 나머지는 그대로 AWS 게이트웨이로 간다. 예:
//   NEXT_PUBLIC_LOCAL_PROXY_PATHS=/api/v2/products,/api/v2/sellers/me/products,/api/v2/admin/products
//   NEXT_PUBLIC_LOCAL_PROXY_TARGET=http://localhost:8082
// 둘 다 커밋되지 않는 .env.local에만 두므로, 어떤 경로가 어느 서비스 것인지는 공용 코드가 아니라
// 지금 그 서비스를 로컬로 띄운 사람이 알아서 적는다.
//
// getLocalProxyConfig()가 유일한 진입점이다 — next.config.ts/lib/auth.ts뿐 아니라
// mocks/handlers/index.ts도 이걸 그대로 가져다 쓴다. "PATHS/TARGET 둘 다 있어야 활성화"라는
// 조건과 경로 매칭 규칙이 여러 곳에서 따로 재구현되며 어긋나는 걸 막기 위함이다.

export interface LocalProxyConfig {
  paths: string[]
  target: string
}

function normalizePath(p: string): string {
  return p.trim().replace(/\/+$/, '')
}

function normalizeTarget(t: string): string {
  return t.trim().replace(/\/+$/, '')
}

export function getLocalProxyConfig(): LocalProxyConfig | null {
  if (process.env.NODE_ENV === 'production') return null

  const rawPaths = process.env.NEXT_PUBLIC_LOCAL_PROXY_PATHS
  const rawTarget = process.env.NEXT_PUBLIC_LOCAL_PROXY_TARGET
  if (!rawPaths || !rawTarget) return null

  const paths = rawPaths.split(',').map(normalizePath).filter(Boolean)
  const target = normalizeTarget(rawTarget)
  if (paths.length === 0 || !target) return null

  return { paths, target }
}

export function buildDirectRoutingRewrites(): { source: string; destination: string }[] {
  const config = getLocalProxyConfig()
  if (!config) return []
  return config.paths.map((prefix) => ({
    source: `${prefix}/:path*`,
    destination: `${config.target}${prefix}/:path*`,
  }))
}

export function isDirectRoutedUrl(url?: string): boolean {
  if (!url) return false
  const config = getLocalProxyConfig()
  if (!config) return false
  const path = url.split('?')[0]
  return config.paths.some((p) => path === p || path.startsWith(`${p}/`))
}

export function directRoutingHeaders(
  url: string | undefined,
  user: { id: string; roles: string[] } | null | undefined,
): Record<string, string> | null {
  if (!user || !isDirectRoutedUrl(url)) return null
  const role = user.roles.find((r) => r === 'admin') ?? user.roles[0]
  return {
    'X-User-Id': user.id,
    'X-User-Role': role ? role.toUpperCase() : '',
  }
}
