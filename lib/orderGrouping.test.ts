import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getSelectedRefundSummary,
  groupOrders,
  markRefundRequested,
  orderProductStatusLabel,
} from './orderGrouping.ts'
import type { OrderListItem } from '@/types/api/orders'

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

test('groupOrders builds order history and total from order items only', () => {
  const result = groupOrders([
    orderProduct(),
    orderProduct({ orderProductId: 'line-2', productId: 'product-2', amount: 9000 }),
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].orderId, 'order-1')
  assert.equal(result[0].titleSummary, 'Spring Boot 코드 리뷰 외 1건')
  assert.equal(result[0].amount, 15000)
  assert.equal(result[0].status, '결제완료')
  assert.deepEqual(result[0].items.map((item) => item.amount), [6000, 9000])
})

test('groupOrders preserves the order API order and groups repeated order ids', () => {
  const result = groupOrders([
    orderProduct({ orderId: 'order-2', orderProductId: 'line-2' }),
    orderProduct(),
    orderProduct({ orderId: 'order-2', orderProductId: 'line-3' }),
  ])

  assert.deepEqual(result.map((order) => order.orderId), ['order-2', 'order-1'])
  assert.deepEqual(result[0].items.map((item) => item.orderProductId), ['line-2', 'line-3'])
})

test('groupOrders maps every order status without hiding pending or failed orders', () => {
  const statuses = [
    'CREATED',
    'COMPLETED',
    'FAILED',
    'REFUND_REQUESTED',
    'PARTIAL_REFUNDED',
    'ALL_REFUNDED',
  ] as const
  const result = groupOrders(statuses.map((orderStatus, index) =>
    orderProduct({ orderId: `order-${index}`, orderProductId: `line-${index}`, orderStatus }),
  ))

  assert.deepEqual(result.map((order) => order.status), [
    '결제 대기',
    '결제완료',
    '결제 실패',
    '환불 신청 중',
    '부분 환불',
    '전체 환불',
  ])
})

test('groupOrders uses createdAt when a pending or failed order has no paidAt', () => {
  const [result] = groupOrders([orderProduct({ paidAt: null })])

  assert.equal(result.paidAt, '2026-06-28T09:58:00')
})

test('only paid and refundable order products are selectable', () => {
  const [result] = groupOrders([
    orderProduct({ orderProductId: 'selectable' }),
    orderProduct({ orderProductId: 'downloaded', downloaded: true, isRefundable: false }),
    orderProduct({ orderProductId: 'requested', orderProductStatus: 'REFUND_REQUESTED', isRefundable: false }),
    orderProduct({ orderProductId: 'refunded', orderProductStatus: 'REFUNDED', isRefundable: false }),
  ])

  assert.deepEqual(result.items.map((item) => item.selectable), [true, false, false, false])
  assert.equal(orderProductStatusLabel('PAID'), '결제완료')
  assert.equal(orderProductStatusLabel('REFUND_REQUESTED'), '환불 신청 중')
  assert.equal(orderProductStatusLabel('REFUNDED'), '환불 완료')
})

test('refund summary ignores unavailable selections', () => {
  const [result] = groupOrders([
    orderProduct({ orderProductId: 'line-1', amount: 6000 }),
    orderProduct({ orderProductId: 'line-2', amount: 4000 }),
    orderProduct({ orderProductId: 'line-3', orderProductStatus: 'REFUND_REQUESTED', isRefundable: false }),
  ])

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
  assert.equal(result[0].orderStatus, 'REFUND_REQUESTED')
  assert.equal(result[1].orderStatus, 'REFUND_REQUESTED')
})
