import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getHybridGatewayHeaders,
  isHybridApiMocking,
  normalizeCreateOrderParams,
  shouldAttachHybridGatewayHeaders,
} from './hybridApi.ts'

test('isHybridApiMocking only enables the hybrid mode', () => {
  assert.equal(isHybridApiMocking('hybrid'), true)
  assert.equal(isHybridApiMocking('enabled'), false)
  assert.equal(isHybridApiMocking('disabled'), false)
  assert.equal(isHybridApiMocking(undefined), false)
})

test('shouldAttachHybridGatewayHeaders targets order and cart APIs only', () => {
  assert.equal(shouldAttachHybridGatewayHeaders('/api/v1/orders'), true)
  assert.equal(shouldAttachHybridGatewayHeaders('/api/v1/orders/payments?page=1'), true)
  assert.equal(shouldAttachHybridGatewayHeaders('/api/v1/cart/products'), true)
  assert.equal(shouldAttachHybridGatewayHeaders('/api/v1/products'), false)
  assert.equal(shouldAttachHybridGatewayHeaders('/api/v1/payments/confirm'), false)
  assert.equal(shouldAttachHybridGatewayHeaders(undefined), false)
})

test('getHybridGatewayHeaders extracts user id from mock tokens', () => {
  assert.deepEqual(getHybridGatewayHeaders('mock-token::11111111-1111-1111-1111-111111111111', 'buyer'), {
    'X-User-Id': '11111111-1111-1111-1111-111111111111',
    'X-User-Role': 'USER',
  })
})

test('getHybridGatewayHeaders maps legacy mock ids to stable UUIDs', () => {
  assert.deepEqual(getHybridGatewayHeaders('mock-token::user-1', 'buyer'), {
    'X-User-Id': '00000000-0000-0000-0000-000000000001',
    'X-User-Role': 'USER',
  })
})

test('getHybridGatewayHeaders uses admin role for admin users', () => {
  assert.deepEqual(getHybridGatewayHeaders('mock-token::admin-1', 'admin'), {
    'X-User-Id': '00000000-0000-0000-0000-000000000101',
    'X-User-Role': 'ADMIN',
  })
})

test('getHybridGatewayHeaders returns null for non-mock tokens', () => {
  assert.equal(getHybridGatewayHeaders('real-jwt-token', 'buyer'), null)
  assert.equal(getHybridGatewayHeaders(null, 'buyer'), null)
})

test('normalizeCreateOrderParams always returns productIds', () => {
  assert.deepEqual(normalizeCreateOrderParams({ productId: 'product-1' }), {
    productIds: ['product-1'],
  })
  assert.deepEqual(normalizeCreateOrderParams({ productIds: ['product-1', 'product-2'] }), {
    productIds: ['product-1', 'product-2'],
  })
})
