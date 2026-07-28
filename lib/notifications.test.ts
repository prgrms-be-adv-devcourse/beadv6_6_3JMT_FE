import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeNotificationQueryParams } from './notifications.ts'

test('normalizeNotificationQueryParams defaults page to 1 and size to 20 when undefined', () => {
  const result = normalizeNotificationQueryParams()
  assert.deepEqual(result, { page: 1, size: 20 })
})

test('normalizeNotificationQueryParams corrects page < 1 to 1', () => {
  const result = normalizeNotificationQueryParams({ page: 0, size: 10 })
  assert.equal(result.page, 1)
  assert.equal(result.size, 10)
})

test('normalizeNotificationQueryParams clamps size to max 100 and min 1', () => {
  const over = normalizeNotificationQueryParams({ page: 1, size: 150 })
  assert.equal(over.size, 100)

  const under = normalizeNotificationQueryParams({ page: 1, size: -5 })
  assert.equal(under.size, 20)
})

test('normalizeNotificationQueryParams includes category when provided', () => {
  const result = normalizeNotificationQueryParams({ category: 'ORDER', page: 2, size: 30 })
  assert.deepEqual(result, { category: 'ORDER', page: 2, size: 30 })
})
