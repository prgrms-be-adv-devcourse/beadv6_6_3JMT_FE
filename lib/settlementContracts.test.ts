import assert from 'node:assert/strict'
import test from 'node:test'

import {
  adminActionPath,
  mapAdminSettlementStatusCounts,
  mapAdminSettlementDetail,
  mapAdminSettlementList,
  mapSellerSettlementDetail,
  mapSellerSettlementList,
  settlementStatusCount,
} from './settlementContracts.ts'

const monthly = {
  settlementMonth: '2026-07',
  weeklySettlementCount: 3,
  aggregatedSettlementCount: 2,
  salesCount: 22,
  grossAmount: '2200000.00',
  feeAmount: '330000.00',
  refundAmount: '100000.00',
  payoutAmount: '1770000.00',
  statusCounts: [
    { status: 'APPROVED', statusLabel: '승인', count: 1 },
    { status: 'CANCELLED', statusLabel: '취소', count: 1 },
  ],
}

const weekly = {
  settlementId: 'settlement-1',
  periodStart: '2026-06-29',
  periodEnd: '2026-07-05',
  salesCount: 10,
  grossAmount: '1000000.00',
  feeAmount: '150000.00',
  refundAmount: null,
  payoutAmount: '850000.00',
  status: 'APPROVED',
  statusLabel: '승인',
  calculatedAt: '2026-07-06T00:05:00',
  approvedAt: '2026-07-06T10:00:00',
  payoutRequestedAt: null,
  paidAt: null,
  cancelledAt: null,
  availableActions: [{ type: 'REQUEST_PAYOUT', label: '지급 신청하기' }],
}

test('mapSellerSettlementList preserves monthly groups and normalizes amounts', () => {
  const result = mapSellerSettlementList({ items: [monthly], totalElements: 4, page: 0, size: 10 })

  assert.equal(result.totalElements, 4)
  assert.deepEqual(result.items[0], {
    ...monthly,
    grossAmount: 2200000,
    feeAmount: 330000,
    refundAmount: 100000,
    payoutAmount: 1770000,
  })
})

test('mapAdminSettlementList keeps seller identity with the monthly aggregate', () => {
  const result = mapAdminSettlementList({
    items: [{ sellerId: 'seller-1', sellerName: '판매자 1', ...monthly }],
    totalElements: 1,
    page: 0,
    size: 20,
  })

  assert.equal(result.items[0].sellerId, 'seller-1')
  assert.equal(result.items[0].sellerName, '판매자 1')
  assert.equal(result.items[0].settlementMonth, '2026-07')
})

test('mapSellerSettlementDetail maps weekly actions and null refund to zero', () => {
  const result = mapSellerSettlementDetail({ ...monthly, weeklySettlements: [weekly] })

  assert.equal(result.weeklySettlements[0].refundAmount, 0)
  assert.deepEqual(result.weeklySettlements[0].availableActions, [
    { type: 'REQUEST_PAYOUT', label: '지급 신청하기' },
  ])
})

test('mapAdminSettlementDetail maps seller identity and admin actions', () => {
  const result = mapAdminSettlementDetail({
    sellerId: 'seller-1',
    sellerName: null,
    ...monthly,
    weeklySettlements: [{ ...weekly, availableActions: [{ type: 'APPROVE', label: '승인' }] }],
  })

  assert.equal(result.sellerName, null)
  assert.equal(result.weeklySettlements[0].availableActions[0].type, 'APPROVE')
})

test('adminActionPath maps backend action types to existing patch routes', () => {
  assert.equal(adminActionPath('APPROVE'), 'approve')
  assert.equal(adminActionPath('RELEASE_HOLD'), 'release-hold')
  assert.equal(adminActionPath('RELEASE_PAYOUT_HOLD'), 'payout-hold/release')
})

test('admin weekly status counts keep all filter statuses independent', () => {
  const counts = mapAdminSettlementStatusCounts({
    statusCounts: [
      { status: 'WAITING', statusLabel: '대기', count: '60' },
      { status: 'APPROVAL_ON_HOLD', statusLabel: '승인 보류', count: '8' },
      { status: 'APPROVED', statusLabel: '승인', count: 0 },
      { status: 'PAYOUT_REQUESTED', statusLabel: '지급 신청', count: 4 },
      { status: 'PAYOUT_ON_HOLD', statusLabel: '지급 보류', count: 0 },
      { status: 'PAID', statusLabel: '지급 완료', count: 9 },
      { status: 'CANCELLED', statusLabel: '취소', count: 1 },
    ],
  })

  assert.equal(settlementStatusCount(counts, 'APPROVAL_ON_HOLD'), 8)
  assert.equal(settlementStatusCount(counts, 'PAYOUT_REQUESTED'), 4)
  assert.equal(settlementStatusCount(counts, 'CANCELLED'), 1)
  assert.equal(settlementStatusCount(counts), 82)
})
