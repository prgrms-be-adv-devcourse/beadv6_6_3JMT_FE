import assert from 'node:assert/strict'
import test from 'node:test'

import { mapMockPaymentToHistoryItem } from '../paymentHistory.ts'

test('mapMockPaymentToHistoryItem summarizes cart payments by first product title', () => {
  assert.deepEqual(
    mapMockPaymentToHistoryItem({
      paymentId: 'pay-1',
      orderId: 'order-1',
      productIds: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
      totalAmount: 10800,
      status: 'paid',
      paidAt: '2026-06-28T10:00:00.000Z',
    }),
    {
      orderId: 'order-1',
      paymentId: 'pay-1',
      paymentStatus: 'PAID',
      isRefundable: true,
      productType: 'PROMPT',
      title: '사진 같은 제품 목업 생성기 외 1건',
      amount: 10800,
      paidAt: '2026-06-28T10:00:00.000Z',
    },
  )
})

test('mapMockPaymentToHistoryItem keeps a single payment title without suffix', () => {
  assert.equal(
    mapMockPaymentToHistoryItem({
      paymentId: 'pay-2',
      orderId: 'order-2',
      productIds: ['33333333-3333-3333-3333-333333333333'],
      totalAmount: 7900,
      status: 'paid',
      paidAt: '2026-06-28T11:00:00.000Z',
    }).title,
    '리액트 컴포넌트 리팩터링 도우미',
  )
})
