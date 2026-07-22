import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getSelectedRefundSummary,
  groupOrders,
  markRefundRequested,
  orderProductStatusLabel,
} from './orderGrouping.ts'
import type { OrderListItem, PaymentItem } from '@/types/api/orders'

function payment(overrides: Partial<PaymentItem> = {}): PaymentItem {
  return {
    orderId: 'order-1',
    paymentId: 'pay-1',
    paymentStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    title: 'Prompt A',
    amount: 5000,
    paidAt: '2026-06-28T10:00:00',
    orderProductIds: [],
    ...overrides,
  }
}

function orderProduct(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    orderId: 'order-1',
    orderProductId: 'line-1',
    productId: 'product-1',
    amount: 6000,
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    productType: 'PROMPT',
    title: 'Spring Boot 코드 리뷰',
    model: 'GPT',
    rating: 4.8,
    paidAt: '2026-06-28T10:00:00',
    createdAt: '2026-06-28T09:58:00',
    ...overrides,
  }
}

test('groupOrders joins order products while preserving payment total', () => {
  const result = groupOrders(
    [payment({ amount: 15000 })],
    [
      orderProduct(),
      orderProduct({ orderProductId: 'line-2', productId: 'product-2', amount: 9000 }),
    ],
  )

  assert.equal(result.length, 1)
  assert.equal(result[0].orderId, 'order-1')
  assert.equal(result[0].amount, 15000)
  assert.equal(result[0].status, '결제완료')
  assert.deepEqual(result[0].items.map((item) => item.amount), [6000, 9000])
})

test('groupOrders preserves payment order and supports empty details', () => {
  const result = groupOrders(
    [payment({ orderId: 'order-2', paymentId: 'pay-2' }), payment()],
    [orderProduct()],
  )

  assert.deepEqual(result.map((order) => order.paymentId), ['pay-2', 'pay-1'])
  assert.deepEqual(result[0].items, [])
  assert.equal(result[1].items.length, 1)
})

test('groupOrders maps payment statuses', () => {
  const statuses = ['PAID', 'REFUNDING', 'PARTIAL_REFUNDED', 'ALL_REFUNDED'] as const
  const result = groupOrders(
    statuses.map((paymentStatus, index) =>
      payment({ orderId: `order-${index}`, paymentId: `pay-${index}`, paymentStatus }),
    ),
    [],
  )

  assert.deepEqual(result.map((order) => order.status), [
    '결제완료',
    '환불 신청 중',
    '부분 환불',
    '전체 환불',
  ])
})

test('only paid and refundable order products are selectable', () => {
  const [result] = groupOrders(
    [payment()],
    [
      orderProduct({ orderProductId: 'selectable' }),
      orderProduct({ orderProductId: 'downloaded', downloaded: true, isRefundable: false }),
      orderProduct({ orderProductId: 'requested', orderProductStatus: 'REFUND_REQUESTED', isRefundable: false }),
      orderProduct({ orderProductId: 'refunded', orderProductStatus: 'REFUNDED', isRefundable: false }),
    ],
  )

  assert.deepEqual(result.items.map((item) => item.selectable), [true, false, false, false])
  assert.equal(orderProductStatusLabel('PAID'), '결제완료')
  assert.equal(orderProductStatusLabel('REFUND_REQUESTED'), '환불 신청 중')
  assert.equal(orderProductStatusLabel('REFUNDED'), '환불 완료')
})

test('refund summary ignores unavailable selections', () => {
  const [result] = groupOrders(
    [payment()],
    [
      orderProduct({ orderProductId: 'line-1', amount: 6000 }),
      orderProduct({ orderProductId: 'line-2', amount: 4000 }),
      orderProduct({ orderProductId: 'line-3', orderProductStatus: 'REFUND_REQUESTED', isRefundable: false }),
    ],
  )

  assert.deepEqual(
    getSelectedRefundSummary(result.items, ['line-2', 'line-3', 'missing']),
    { count: 1, amount: 4000, orderProductIds: ['line-2'] },
  )
})

test('markRefundRequested updates only selected order products', () => {
  const result = markRefundRequested(
    [orderProduct({ orderProductId: 'line-1' }), orderProduct({ orderProductId: 'line-2' })],
    ['line-2'],
  )

  assert.equal(result[0].orderProductStatus, 'PAID')
  assert.equal(result[0].isRefundable, true)
  assert.equal(result[1].orderProductStatus, 'REFUND_REQUESTED')
  assert.equal(result[1].isRefundable, false)
})
