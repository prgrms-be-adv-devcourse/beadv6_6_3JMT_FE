import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRefundRequest } from './refundContracts.ts'

test('buildRefundRequest sends the order id in the selected-product refund path', () => {
  assert.deepEqual(buildRefundRequest('order-1', ['line-2', 'line-3']), {
    path: '/api/v2/orders/order-1/refund',
    body: {
      orderProductIds: ['line-2', 'line-3'],
    },
  })
})
