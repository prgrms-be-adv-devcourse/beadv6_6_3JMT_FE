import test from 'node:test'
import assert from 'node:assert/strict'

import { hasPurchasedProduct, mapOrderToPrompt } from './orderAdapters.ts'

test('mapOrderToPrompt keeps legacy mocked nested product orders', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    downloaded: false,
    isRefundable: false,
    purchasedAt: '2026-06-25T10:00:00',
    product: {
      id: 'product-1',
      title: 'Mock prompt',
      category: 'writing',
      icon: 'pen',
      model: 'GPT-4o',
      amount: 1000,
      rating: 4.5,
      salesCount: 10,
      seller: 'seller',
      desc: 'desc',
    },
  })

  assert.equal(prompt?.id, 'product-1')
  assert.equal(prompt?.orderId, 'order-1')
  assert.equal(prompt?.purchasedAt, '2026-06-25T10:00:00')
})

test('mapOrderToPrompt converts real order-service flat orders', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    downloaded: false,
    isRefundable: false,
    orderStatus: 'PENDING',
    productType: 'PROMPT',
    title: 'Real prompt',
    model: null,
    rating: null,
    paidAt: null,
    createdAt: '2026-06-25T10:00:00',
    product: null,
    purchasedAt: '2026-06-25T10:00:00',
  })

  assert.equal(prompt?.id, 'product-1')
  assert.equal(prompt?.orderProductId, 'order-product-1')
  assert.equal(prompt?.title, 'Real prompt')
  assert.equal(prompt?.category, 'prompt')
  assert.equal(prompt?.model, 'Prompt')
  assert.equal(prompt?.priceLabel, '구매 완료')
})

test('hasPurchasedProduct supports both mocked and real order shapes', () => {
  assert.equal(
    hasPurchasedProduct([
      {
        orderId: 'order-1',
        downloaded: false,
    isRefundable: false,
            purchasedAt: '2026-06-25T10:00:00',
        product: null,
        productId: 'product-1',
      },
    ], 'product-1'),
    true,
  )

  assert.equal(
    hasPurchasedProduct([
      {
        orderId: 'order-2',
        downloaded: false,
    isRefundable: false,
            purchasedAt: '2026-06-25T10:00:00',
        product: { id: 'product-2' } as never,
      },
    ], 'product-2'),
    true,
  )
})

test('mapOrderToPrompt excludes refunded orders', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    downloaded: false,
    isRefundable: false,
    orderStatus: 'REFUNDED',
    productType: 'PROMPT',
    title: 'Refunded prompt',
    model: 'GPT-4.1',
    rating: 4.5,
    paidAt: '2026-06-25T10:00:00',
    createdAt: '2026-06-25T09:50:00',
    product: null,
  })

  assert.equal(prompt, null)
})

test('hasPurchasedProduct excludes refunded orders', () => {
  assert.equal(
    hasPurchasedProduct([
      {
        orderId: 'order-1',
        productId: 'product-1',
        downloaded: false,
    isRefundable: false,
        orderStatus: 'REFUNDED',
            purchasedAt: '2026-06-25T10:00:00',
        product: null,
      },
    ], 'product-1'),
    false,
  )
})
