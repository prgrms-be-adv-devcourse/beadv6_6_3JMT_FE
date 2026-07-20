import test from 'node:test'
import assert from 'node:assert/strict'

import { mapPaymentHistory } from './paymentAdapters.ts'

test('mapPaymentHistory joins multiple order products into one payment row', () => {
  const [payment] = mapPaymentHistory(
    [{
      orderId: 'order-1',
      paymentId: 'payment-1',
      paymentStatus: 'PAID',
      amount: 3000,
      paidAt: '2026-07-18T10:00:00',
    }],
    [
      { orderId: 'order-1', orderProductId: 'op-1', title: 'A', downloaded: false, isRefundable: true },
      { orderId: 'order-1', orderProductId: 'op-2', title: 'B', downloaded: false, isRefundable: true },
    ],
  )

  assert.equal(payment.title, 'A 외 1건')
  assert.deepEqual(payment.orderProductIds, ['op-1', 'op-2'])
  assert.equal(payment.isRefundable, true)
})

test('mapPaymentHistory disables refund when an order product is downloaded', () => {
  const [payment] = mapPaymentHistory(
    [{
      orderId: 'order-1',
      paymentId: 'payment-1',
      paymentStatus: 'PAID',
      amount: 1000,
      paidAt: '2026-07-18T10:00:00',
    }],
    [{ orderId: 'order-1', orderProductId: 'op-1', title: 'A', downloaded: true, isRefundable: false }],
  )

  assert.equal(payment.downloaded, true)
  assert.equal(payment.isRefundable, false)
})
