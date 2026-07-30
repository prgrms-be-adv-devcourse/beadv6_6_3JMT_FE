import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildAdminSettlementDeliveryQuery,
  canRetrySettlementDelivery,
  mapAdminSettlementDeliveryPage,
  mapAdminSettlementDeliverySummary,
} from './settlementDeliveryContracts.ts'

const failedDelivery = {
  settlementDeliveryId: 'delivery-1',
  settlementId: 'settlement-1',
  deliveryRequestId: 'request-1',
  status: 'DELIVERY_FAILED',
  attemptCount: '3',
  statusReason: 'gRPC UNAVAILABLE: attempts=3',
  firstAttemptAt: '2026-07-29T01:00:00',
  lastAttemptAt: '2026-07-29T01:00:04',
  reconciledAt: null,
  retryInProgress: false,
  availableActions: ['RETRY'],
}

test('mapAdminSettlementDeliveryPage normalizes delivery rows and page metadata', () => {
  const result = mapAdminSettlementDeliveryPage({
    items: [failedDelivery],
    totalElements: '12',
    page: '1',
    size: '20',
  })

  assert.equal(result.totalElements, 12)
  assert.equal(result.page, 1)
  assert.equal(result.items[0].attemptCount, 3)
  assert.equal(result.items[0].statusReason, 'gRPC UNAVAILABLE: attempts=3')
  assert.equal(result.items[0].reconciledAt, null)
})

test('mapAdminSettlementDeliverySummary normalizes all status counts', () => {
  assert.deepEqual(
    mapAdminSettlementDeliverySummary({
      calculatedCount: '2',
      reconciledCount: 8,
      deliveryFailedCount: '3',
      mismatchCount: 1,
      retryInProgressCount: '1',
    }),
    {
      calculatedCount: 2,
      reconciledCount: 8,
      deliveryFailedCount: 3,
      mismatchCount: 1,
      retryInProgressCount: 1,
    },
  )
})

test('buildAdminSettlementDeliveryQuery maps problem and single-status filters', () => {
  assert.deepEqual(buildAdminSettlementDeliveryQuery('problem', ' request-1 ', 0, 20), {
    problemOnly: true,
    identifier: 'request-1',
    page: 0,
    size: 20,
  })
  assert.deepEqual(buildAdminSettlementDeliveryQuery('MISMATCH', '', 2, 20), {
    status: 'MISMATCH',
    page: 2,
    size: 20,
  })
  assert.deepEqual(buildAdminSettlementDeliveryQuery('all', '', 0, 20), {
    page: 0,
    size: 20,
  })
})

test('canRetrySettlementDelivery requires backend action and no retry in progress', () => {
  const mapped = mapAdminSettlementDeliveryPage({ items: [failedDelivery] }).items[0]

  assert.equal(canRetrySettlementDelivery(mapped), true)
  assert.equal(canRetrySettlementDelivery({ ...mapped, retryInProgress: true }), false)
  assert.equal(canRetrySettlementDelivery({ ...mapped, availableActions: [] }), false)
})
