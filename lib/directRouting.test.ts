import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DIRECT_ROUTING_CONFIGS,
  buildDirectRoutingRewrites,
  directRoutingHeaders,
  isDirectRoutedUrl,
} from './directRouting.ts'

const ENV_KEYS = DIRECT_ROUTING_CONFIGS.flatMap((c) => [c.enableEnvVar, c.targetEnvVar])
const mutableEnv = process.env as Record<string, string | undefined>

function resetEnv() {
  for (const key of ENV_KEYS) delete mutableEnv[key]
  delete mutableEnv.NODE_ENV
}

test('buildDirectRoutingRewrites returns nothing when no flags are set', () => {
  resetEnv()
  assert.deepEqual(buildDirectRoutingRewrites(), [])
})

test('buildDirectRoutingRewrites builds a rewrite per path prefix for an enabled service', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  const rules = buildDirectRoutingRewrites()
  assert.deepEqual(rules, [
    { source: '/api/v1/products/:path*', destination: 'http://localhost:8082/api/v1/products/:path*' },
    { source: '/api/v1/sellers/me/products/:path*', destination: 'http://localhost:8082/api/v1/sellers/me/products/:path*' },
    { source: '/api/v1/admin/products/:path*', destination: 'http://localhost:8082/api/v1/admin/products/:path*' },
  ])
  resetEnv()
})

test('buildDirectRoutingRewrites honors a custom proxy target', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_ORDER_DIRECT = 'true'
  process.env.ORDER_PROXY_TARGET = 'http://localhost:9999'
  const rules = buildDirectRoutingRewrites()
  assert.equal(rules[0].destination, 'http://localhost:9999/api/v1/orders/:path*')
  resetEnv()
})

test('buildDirectRoutingRewrites keeps settlement/order/product/payment before user when all are enabled', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_USER_DIRECT = 'true'
  process.env.NEXT_PUBLIC_ORDER_DIRECT = 'true'
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT = 'true'
  process.env.NEXT_PUBLIC_PAYMENT_DIRECT = 'true'
  const rules = buildDirectRoutingRewrites()
  const firstSettlementIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/sellers/me/settlements'))
  const firstOrderIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/orders'))
  const firstProductIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/products'))
  const firstPaymentIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/payments'))
  const firstUserIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/auth'))
  assert.ok(firstSettlementIdx < firstUserIdx)
  assert.ok(firstOrderIdx < firstUserIdx)
  assert.ok(firstProductIdx < firstUserIdx)
  assert.ok(firstPaymentIdx < firstUserIdx)
  // settlement/admin/settlements 는 user의 /api/v1/admin catch-all보다 먼저 매칭돼야 한다
  const firstAdminSettlementsIdx = rules.findIndex((r) => r.source.startsWith('/api/v1/admin/settlements'))
  const firstAdminCatchAllIdx = rules.findIndex((r) => r.source === '/api/v1/admin/:path*')
  assert.ok(firstAdminSettlementsIdx < firstAdminCatchAllIdx)
  resetEnv()
})

test('buildDirectRoutingRewrites builds settlement and payment rewrites with their own default ports', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT = 'true'
  process.env.NEXT_PUBLIC_PAYMENT_DIRECT = 'true'
  const rules = buildDirectRoutingRewrites()
  assert.deepEqual(rules, [
    { source: '/api/v1/sellers/me/settlements/:path*', destination: 'http://localhost:8085/api/v1/sellers/me/settlements/:path*' },
    { source: '/api/v1/admin/settlements/:path*', destination: 'http://localhost:8085/api/v1/admin/settlements/:path*' },
    { source: '/api/v1/payments/:path*', destination: 'http://localhost:8084/api/v1/payments/:path*' },
  ])
  resetEnv()
})

test('isDirectRoutedUrl is false when the matching service flag is off', () => {
  resetEnv()
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
})

test('isDirectRoutedUrl is true for an enabled service, exact and nested paths', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/products'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/products/123/related?limit=4'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/admin/products/123/approve'), true)
  resetEnv()
})

test('isDirectRoutedUrl does not match an unrelated path even when a flag is on', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/orders'), false)
  resetEnv()
})

test('isDirectRoutedUrl is always false in production regardless of flags', () => {
  resetEnv()
  mutableEnv.NODE_ENV = 'production'
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
  resetEnv()
})

test('directRoutingHeaders returns null when the url is not direct-routed', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(directRoutingHeaders('/api/v1/orders', { id: 'u-1', roles: ['seller'] }), null)
  resetEnv()
})

test('directRoutingHeaders returns null when there is no logged-in user', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.equal(directRoutingHeaders('/api/v1/admin/products/1/approve', null), null)
  resetEnv()
})

test('directRoutingHeaders injects the real user id and uppercased role', () => {
  resetEnv()
  process.env.NEXT_PUBLIC_PRODUCT_DIRECT = 'true'
  assert.deepEqual(
    directRoutingHeaders('/api/v1/sellers/me/products', { id: 'u-1', roles: ['seller'] }),
    { 'X-User-Id': 'u-1', 'X-User-Role': 'SELLER' },
  )
  resetEnv()
})
