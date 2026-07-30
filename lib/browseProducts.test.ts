import assert from 'node:assert/strict'
import test from 'node:test'

import { enrichBrowseProducts } from './browseProducts.ts'

test('enrichBrowseProducts maps seller names to products by sellerId', async () => {
  const result = await enrichBrowseProducts(
    [
      { id: 'product-1', sellerId: 'seller-1' },
      { id: 'product-2', sellerId: 'seller-2' },
    ],
    async () => ({
      'seller-1': '김지희',
      'seller-2': '이종찬',
    }),
  )

  assert.deepEqual(
    result.map(({ id, seller }) => ({ id, seller })),
    [
      { id: 'product-1', seller: '김지희' },
      { id: 'product-2', seller: '이종찬' },
    ],
  )
})

test('enrichBrowseProducts keeps cards renderable when seller lookup fails', async () => {
  const result = await enrichBrowseProducts(
    [
      { id: 'product-1', sellerId: 'seller-1', seller: '기존 판매자' },
      { id: 'product-2', sellerId: 'seller-2' },
    ],
    async () => {
      throw new Error('seller service unavailable')
    },
  )

  assert.deepEqual(
    result.map(({ id, seller }) => ({ id, seller })),
    [
      { id: 'product-1', seller: '기존 판매자' },
      { id: 'product-2', seller: '탈퇴한 판매자' },
    ],
  )
})
