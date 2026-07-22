import assert from 'node:assert/strict'
import test from 'node:test'

import {
  composeWishlistCards,
  toSyncedWishItems,
} from './wishlistComposition.ts'

const wishlists = [
  { wishlistId: 'wish-2', productId: 'product-2', addedAt: '2026-07-22T11:00:00' },
  { wishlistId: 'wish-1', productId: 'product-1', addedAt: '2026-07-22T10:00:00' },
]

const products = [
  {
    productId: 'product-1',
    sellerId: 'seller-1',
    title: 'Prompt 1',
    amount: 1000,
    thumbnailUrl: null,
    productType: 'PROMPT',
    model: 'GPT-4o',
    salesCount: 3,
    averageRating: 4.5,
    status: 'ON_SALE',
  },
  {
    productId: 'product-2',
    sellerId: 'seller-2',
    title: 'Prompt 2',
    amount: 2000,
    thumbnailUrl: '/thumb.png',
    productType: 'PROMPT',
    model: 'Claude',
    salesCount: 5,
    averageRating: 4.8,
    status: 'ON_SALE',
  },
]

test('composeWishlistCards keeps wishlist order and maps seller names', () => {
  const cards = composeWishlistCards(wishlists, products, {
    'seller-1': '판매자 1',
    'seller-2': '판매자 2',
  })

  assert.deepEqual(cards.map((card) => card.id), ['product-2', 'product-1'])
  assert.deepEqual(cards.map((card) => card.seller), ['판매자 2', '판매자 1'])
})

test('composeWishlistCards omits missing products and falls back for missing sellers', () => {
  const cards = composeWishlistCards(wishlists, [products[0]], {})

  assert.equal(cards.length, 1)
  assert.equal(cards[0].id, 'product-1')
  assert.equal(cards[0].seller, '탈퇴한 판매자')
})

test('toSyncedWishItems keeps only product and wishlist ids', () => {
  assert.deepEqual(toSyncedWishItems(wishlists), [
    { id: 'product-2', wishlistId: 'wish-2' },
    { id: 'product-1', wishlistId: 'wish-1' },
  ])
})
