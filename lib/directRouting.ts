// 로컬 직접 라우팅 (Direct Routing)
// 로컬에서 테스트하고 싶은 서비스 하나의 경로 목록과 대상을 .env.local에 개인적으로 설정하면,
// 그 경로들만 로컬로 가고 나머지는 그대로 AWS 게이트웨이로 간다. 예:
//   NEXT_PUBLIC_LOCAL_PROXY_PATHS=/api/v1/products,/api/v1/sellers/me/products,/api/v1/admin/products
//   NEXT_PUBLIC_LOCAL_PROXY_TARGET=http://localhost:8082
// 둘 다 커밋되지 않는 .env.local에만 두므로, 어떤 경로가 어느 서비스 것인지는 공용 코드가 아니라
// 지금 그 서비스를 로컬로 띄운 사람이 알아서 적는다.

function getLocalProxyPaths(): string[] {
  const raw = process.env.NEXT_PUBLIC_LOCAL_PROXY_PATHS
  if (!raw) return []
  return raw.split(',').map((p) => p.trim()).filter(Boolean)
}

function getLocalProxyTarget(): string | undefined {
  return process.env.NEXT_PUBLIC_LOCAL_PROXY_TARGET || undefined
}

export function buildDirectRoutingRewrites(): { source: string; destination: string }[] {
  if (process.env.NODE_ENV === 'production') return []
  const target = getLocalProxyTarget()
  const paths = getLocalProxyPaths()
  if (!target || paths.length === 0) return []
  return paths.map((prefix) => ({
    source: `${prefix}/:path*`,
    destination: `${target}${prefix}/:path*`,
  }))
}

export function isDirectRoutedUrl(url?: string): boolean {
  if (!url || process.env.NODE_ENV === 'production') return false
  const target = getLocalProxyTarget()
  const paths = getLocalProxyPaths()
  if (!target || paths.length === 0) return false
  const path = url.split('?')[0]
  return paths.some((p) => path === p || path.startsWith(`${p}/`))
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
