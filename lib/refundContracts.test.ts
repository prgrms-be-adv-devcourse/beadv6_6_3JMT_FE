import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRefundRequest } from './refundContracts.ts'

test('buildRefundRequest uses the order-scoped route without paymentId', () => {
  assert.deepEqual(buildRefundRequest('order/1', ['line-1']), {
    path: '/api/v2/orders/order%2F1/refund',
    body: { orderProductIds: ['line-1'] },
  })
})
