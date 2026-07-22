import assert from 'node:assert/strict'
import test from 'node:test'

import { hasSelfPurchaseItem, isSelfPurchase } from './purchasePolicy.ts'

test('isSelfPurchase detects a product sold by the current user', () => {
  assert.equal(isSelfPurchase('user-1', 'user-1'), true)
  assert.equal(isSelfPurchase('user-1', 'seller-2'), false)
})

test('isSelfPurchase allows legacy data with a missing user or seller id', () => {
  assert.equal(isSelfPurchase(null, 'seller-1'), false)
  assert.equal(isSelfPurchase('user-1', undefined), false)
})

test('hasSelfPurchaseItem blocks the whole checkout when one item belongs to the user', () => {
  assert.equal(
    hasSelfPurchaseItem('user-1', [{ sellerId: 'seller-2' }, { sellerId: 'user-1' }]),
    true,
  )
  assert.equal(
    hasSelfPurchaseItem('user-1', [{ sellerId: 'seller-2' }, { sellerId: undefined }]),
    false,
  )
})
