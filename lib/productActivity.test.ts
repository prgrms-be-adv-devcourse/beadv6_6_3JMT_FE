import assert from 'node:assert/strict'
import test from 'node:test'

import { productIdsByLatestActivity } from './productActivity.ts'

test('productIdsByLatestActivity returns distinct product ids from newest to oldest', () => {
  assert.deepEqual(
    productIdsByLatestActivity([
      { productId: 'old', occurredAt: '2026-08-12T10:00:00' },
      { productId: 'new', occurredAt: '2026-08-14T10:00:00' },
      { productId: 'old', occurredAt: '2026-08-13T10:00:00' },
      { productId: 'unknown' },
    ]),
    ['new', 'old', 'unknown'],
  )
})
