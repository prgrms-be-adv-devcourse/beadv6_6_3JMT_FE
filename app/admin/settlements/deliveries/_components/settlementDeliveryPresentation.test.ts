import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatSettlementDeliveryCount,
  formatSettlementDeliveryDateTime,
  settlementDeliveryProblemCount,
  settlementDeliveryTotalCount,
  shortenSettlementDeliveryId,
} from './settlementDeliveryPresentation.ts'

const summary = {
  calculatedCount: 2,
  reconciledCount: 8,
  deliveryFailedCount: 3,
  mismatchCount: 1,
  retryInProgressCount: 1,
}

test('summary helpers separate actual status totals from the derived problem count', () => {
  assert.equal(settlementDeliveryProblemCount(summary), 4)
  assert.equal(settlementDeliveryTotalCount(summary), 14)
  assert.equal(settlementDeliveryProblemCount(null), null)
})

test('count formatter does not present unavailable summary data as zero', () => {
  assert.equal(formatSettlementDeliveryCount(12), '12건')
  assert.equal(formatSettlementDeliveryCount(null), '-')
})

test('identifier helper keeps short IDs and abbreviates long IDs', () => {
  assert.equal(shortenSettlementDeliveryId('delivery-1'), 'delivery-1')
  assert.equal(
    shortenSettlementDeliveryId('00000000-0000-0000-0000-000000000663'),
    '00000000…000663',
  )
})

test('date formatter handles nullable and invalid backend values', () => {
  assert.equal(formatSettlementDeliveryDateTime(null), '-')
  assert.equal(formatSettlementDeliveryDateTime('not-a-date'), 'not-a-date')
})
