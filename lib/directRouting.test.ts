import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDirectRoutingRewrites,
  directRoutingHeaders,
  getLocalProxyConfig,
  isDirectRoutedUrl,
} from './directRouting.ts'

const ENV_KEYS = ['NEXT_PUBLIC_LOCAL_PROXY_PATHS', 'NEXT_PUBLIC_LOCAL_PROXY_TARGET', 'NODE_ENV']
const mutableEnv = process.env as Record<string, string | undefined>

function resetEnv() {
  for (const key of ENV_KEYS) delete mutableEnv[key]
}

test('buildDirectRoutingRewrites returns nothing when nothing is configured', () => {
  resetEnv()
  assert.deepEqual(buildDirectRoutingRewrites(), [])
})

test('buildDirectRoutingRewrites returns nothing when only paths or only target is set', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  assert.deepEqual(buildDirectRoutingRewrites(), [])

  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.deepEqual(buildDirectRoutingRewrites(), [])
  resetEnv()
})

test('buildDirectRoutingRewrites builds a rewrite per configured path prefix', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products, /api/v1/sellers/me/products,/api/v1/admin/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  const rules = buildDirectRoutingRewrites()
  assert.deepEqual(rules, [
    { source: '/api/v1/products/:path*', destination: 'http://localhost:8082/api/v1/products/:path*' },
    { source: '/api/v1/sellers/me/products/:path*', destination: 'http://localhost:8082/api/v1/sellers/me/products/:path*' },
    { source: '/api/v1/admin/products/:path*', destination: 'http://localhost:8082/api/v1/admin/products/:path*' },
  ])
  resetEnv()
})

test('getLocalProxyConfig trims whitespace and strips trailing slashes from the target and each path', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = ' /api/v1/products/ , /api/v1/admin/products '
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = ' http://localhost:8082/ '
  assert.deepEqual(getLocalProxyConfig(), {
    paths: ['/api/v1/products', '/api/v1/admin/products'],
    target: 'http://localhost:8082',
  })
  resetEnv()
})

test('buildDirectRoutingRewrites is always empty in production regardless of config', () => {
  resetEnv()
  mutableEnv.NODE_ENV = 'production'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.deepEqual(buildDirectRoutingRewrites(), [])
  resetEnv()
})

test('isDirectRoutedUrl is false when nothing is configured', () => {
  resetEnv()
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
})

test('isDirectRoutedUrl is true for configured paths, exact and nested', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products,/api/v1/admin/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(isDirectRoutedUrl('/api/v1/products'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/products/123/related?limit=4'), true)
  assert.equal(isDirectRoutedUrl('/api/v1/admin/products/123/approve'), true)
  resetEnv()
})

test('isDirectRoutedUrl does not match an unconfigured path', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(isDirectRoutedUrl('/api/v1/orders'), false)
  resetEnv()
})

test('isDirectRoutedUrl is always false in production regardless of config', () => {
  resetEnv()
  mutableEnv.NODE_ENV = 'production'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(isDirectRoutedUrl('/api/v1/products/123'), false)
  resetEnv()
})

test('directRoutingHeaders returns null when the url is not direct-routed', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(directRoutingHeaders('/api/v1/orders', { id: 'u-1', roles: ['seller'] }), null)
  resetEnv()
})

test('directRoutingHeaders returns null when there is no logged-in user', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(directRoutingHeaders('/api/v1/products/1/approve', null), null)
  resetEnv()
})

test('directRoutingHeaders injects the real user id and uppercased role', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.deepEqual(
    directRoutingHeaders('/api/v1/products', { id: 'u-1', roles: ['seller'] }),
    { 'X-User-Id': 'u-1', 'X-User-Role': 'SELLER' },
  )
  resetEnv()
})

test('directRoutingHeaders prefers the admin role when the user has multiple roles', () => {
  resetEnv()
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.deepEqual(
    directRoutingHeaders('/api/v1/products', { id: 'u-1', roles: ['seller', 'admin'] }),
    { 'X-User-Id': 'u-1', 'X-User-Role': 'ADMIN' },
  )
  resetEnv()
})

test('directRoutingHeaders is always null in production regardless of config', () => {
  resetEnv()
  mutableEnv.NODE_ENV = 'production'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_PATHS = '/api/v1/products'
  mutableEnv.NEXT_PUBLIC_LOCAL_PROXY_TARGET = 'http://localhost:8082'
  assert.equal(directRoutingHeaders('/api/v1/products', { id: 'u-1', roles: ['seller'] }), null)
  resetEnv()
})
