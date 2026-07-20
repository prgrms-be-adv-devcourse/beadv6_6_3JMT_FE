import test from 'node:test'
import assert from 'node:assert/strict'

import { buildCreateOrderRequest, mapCreateOrderResponse } from './orderContracts.ts'

test('buildCreateOrderRequest sends product id and title', () => {
  assert.deepEqual(
    buildCreateOrderRequest([{ productId: 'product-1', productTitle: 'Prompt' }]),
    { products: [{ productId: 'product-1', productTitle: 'Prompt' }] },
  )
})

test('mapCreateOrderResponse reads nested order id and total amount', () => {
  assert.deepEqual(
    mapCreateOrderResponse({ totalAmount: 15000, order: { orderId: 'order-1' } }),
    { orderId: 'order-1', totalAmount: 15000 },
  )
})
