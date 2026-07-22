import assert from 'node:assert/strict'
import test from 'node:test'

import { mapCartResponseToItems } from './cartAdapters.ts'

test('mapCartResponseToItems keeps direct cart item responses', () => {
  assert.deepEqual(
    mapCartResponseToItems([
      {
        id: 'cart-1',
        productId: 'product-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: '/thumb.png',
      },
    ]),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: '/thumb.png',
      },
    ],
  )
})

test('mapCartResponseToItems converts cartProductId nested cart responses', () => {
  assert.deepEqual(
    mapCartResponseToItems([
      {
        cartProductId: 'cart-1',
        product: {
          id: 'product-1',
          title: 'Prompt',
          amount: 1000,
          thumbnail_url: '/thumb.png',
        },
      },
    ]),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: '/thumb.png',
      },
    ],
  )
})

test('mapCartResponseToItems keeps legacy cartItemId nested cart responses', () => {
  assert.deepEqual(
    mapCartResponseToItems([
      {
        cartItemId: 'cart-1',
        product: {
          id: 'product-1',
          title: 'Prompt',
          amount: 1000,
          thumbnail_url: '/thumb.png',
        },
      },
    ]),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: '/thumb.png',
      },
    ],
  )
})

test('mapCartResponseToItems skips malformed cart entries', () => {
  assert.deepEqual(
    mapCartResponseToItems([
      null,
      { id: 'missing-title', amount: 1000 },
      { id: 'missing-amount', title: 'Prompt' },
      { cartProductId: 'cart-without-product-id', title: 'Prompt', amount: 1000 },
    ]),
    [],
  )
})

test('mapCartResponseToItems unwraps common list containers', () => {
  assert.deepEqual(
    mapCartResponseToItems({
      cartProducts: [
        {
          id: 'cart-1',
          productId: 'product-1',
          title: 'Prompt',
          amount: 1000,
          thumbnailUrl: null,
        },
      ],
    }),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: null,
      },
    ],
  )
})

test('mapCartResponseToItems maps backend cart response products', () => {
  assert.deepEqual(
    mapCartResponseToItems({
      products: [
        {
          cartProductId: 'cart-1',
          productId: 'product-1',
          productTitle: 'Prompt',
          productAmount: 1000,
          thumbnailUrl: '/thumb.png',
          sellerId: 'seller-1',
        },
      ],
    }),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: '/thumb.png',
        sellerId: 'seller-1',
      },
    ],
  )
})

test('mapCartResponseToItems maps backend add cart product response', () => {
  assert.deepEqual(
    mapCartResponseToItems([
      {
        cartProductId: 'cart-1',
        productId: 'product-1',
        productTitle: 'Prompt',
        productAmount: 1000,
        thumbnailUrl: null,
      },
    ]),
    [
      {
        id: 'product-1',
        productId: 'product-1',
        cartProductId: 'cart-1',
        title: 'Prompt',
        amount: 1000,
        thumbnailUrl: null,
      },
    ],
  )
})
