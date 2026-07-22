import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRefundRequest } from './refundContracts.ts'

test('buildRefundRequest sends payment id and only selected order product ids', () => {
  assert.deepEqual(buildRefundRequest('payment-1', ['line-2', 'line-3']), {
    path: '/api/v2/orders/refunds',
    body: {
      paymentId: 'payment-1',
      orderProductIds: ['line-2', 'line-3'],
    },
  })
})
