import test from 'node:test'
import assert from 'node:assert/strict'

import { formatAdminOrderSellers } from './adminOrderAdapters.ts'

test('formatAdminOrderSellers returns a fallback when no seller exists', () => {
  assert.equal(formatAdminOrderSellers({ sellerCount: 0, sellers: [] }), '판매자 정보 없음')
})

test('formatAdminOrderSellers returns the seller nickname for one seller', () => {
  assert.equal(
    formatAdminOrderSellers({
      sellerCount: 1,
      sellers: [{ sellerId: 's1', sellerNickname: 'alpha', productCount: 1, orderAmount: 1000 }],
    }),
    'alpha',
  )
})

test('formatAdminOrderSellers summarizes multiple sellers', () => {
  assert.equal(
    formatAdminOrderSellers({
      sellerCount: 3,
      sellers: [
        { sellerId: 's1', sellerNickname: 'alpha', productCount: 1, orderAmount: 1000 },
        { sellerId: 's2', sellerNickname: 'beta', productCount: 1, orderAmount: 2000 },
        { sellerId: 's3', sellerNickname: 'gamma', productCount: 1, orderAmount: 3000 },
      ],
    }),
    'alpha 외 2명',
  )
})
