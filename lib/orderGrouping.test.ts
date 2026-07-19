import test from 'node:test'
import assert from 'node:assert/strict'

import { groupOrders } from './orderGrouping.ts'
import type { PaymentItem } from '@/types/api/orders'

function item(overrides: Partial<PaymentItem>): PaymentItem {
  return {
    orderId: 'order-1',
    paymentId: 'pay-1',
    paymentStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    productType: 'PROMPT',
    title: 'Prompt A',
    amount: 5000,
    paidAt: '2026-06-28T10:00:00',
    ...overrides,
  }
}

test('groupOrders: 단일 아이템 주문', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', amount: 9000, paidAt: '2026-06-28T10:00:00' }),
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].orderId, 'ORD-1')
  assert.equal(result[0].amount, 9000)
  assert.equal(result[0].paidAt, '2026-06-28T10:00:00')
  assert.equal(result[0].status, '결제완료')
  assert.equal(result[0].items.length, 1)
})

test('groupOrders: 다중 아이템, 전부 PAID → 결제완료', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'PAID', amount: 4000 }),
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].amount, 10000)
  assert.equal(result[0].status, '결제완료')
  assert.equal(result[0].items.length, 2)
})

test('groupOrders: 다중 아이템, 일부 REFUNDING → 부분 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDING', amount: 4000 }),
  ])

  assert.equal(result[0].status, '부분 환불')
})

test('groupOrders: 다중 아이템, 일부 REFUNDED → 부분 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDED', amount: 4000 }),
  ])

  assert.equal(result[0].status, '부분 환불')
})

test('groupOrders: 다중 아이템, 전부 REFUNDED → 전체 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'REFUNDED', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDED', amount: 4000 }),
  ])

  assert.equal(result[0].status, '전체 환불')
})

test('groupOrders: 서로 다른 orderId는 별도 그룹으로 유지', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1' }),
    item({ orderId: 'ORD-2', paymentId: 'pay-2' }),
  ])

  assert.equal(result.length, 2)
  assert.deepEqual(result.map((o) => o.orderId), ['ORD-1', 'ORD-2'])
})
