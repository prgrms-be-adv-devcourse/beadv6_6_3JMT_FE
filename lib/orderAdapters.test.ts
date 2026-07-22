import test from 'node:test'
import assert from 'node:assert/strict'

import {
  composePurchasedPrompts,
  hasPurchasedProduct,
  mapOrderToPrompt,
} from './orderAdapters.ts'

test('mapOrderToPrompt keeps legacy mocked nested product orders', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    downloaded: false,
    isRefundable: false,
    purchasedAt: '2026-06-25T10:00:00',
    product: {
      id: 'product-1',
      title: 'Mock prompt',
      productType: 'NOTION',
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
  assert.equal(prompt?.productType, 'PROMPT')
  assert.equal(prompt?.model, 'Prompt')
  assert.equal(prompt?.priceLabel, '구매 완료')
})

test('mapOrderToPrompt keeps v2 download and refund flags', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    downloaded: true,
    isRefundable: false,
    productType: 'PROMPT',
    title: 'Prompt',
    model: null,
    rating: null,
    paidAt: '2026-07-18T10:00:00',
    createdAt: '2026-07-18T09:50:00',
    product: null,
  })

  assert.equal(prompt?.downloaded, true)
  assert.equal(prompt?.isRefundable, false)
})

test('mapOrderToPrompt excludes fully refunded v2 orders and products', () => {
  assert.equal(mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    orderStatus: 'ALL_REFUNDED',
    orderProductStatus: 'REFUNDED',
    downloaded: false,
    isRefundable: false,
    productType: 'PROMPT',
    title: 'Refunded prompt',
    model: null,
    rating: null,
    paidAt: '2026-07-18T10:00:00',
    createdAt: '2026-07-18T09:50:00',
    product: null,
  }), null)
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

test('mapOrderToPrompt keeps paid products while an order refund is requested', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    orderStatus: 'REFUND_REQUESTED',
    orderProductStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    productType: 'PROMPT',
    title: 'Accessible prompt',
    model: null,
    rating: null,
    paidAt: '2026-07-18T10:00:00',
    createdAt: '2026-07-18T09:50:00',
    product: null,
  })

  assert.equal(prompt?.id, 'product-1')
})

test('composePurchasedPrompts enriches cards with product and seller data', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    orderProductId: 'order-product-1',
    productId: 'product-1',
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    downloaded: true,
    isRefundable: false,
    productType: 'PROMPT',
    title: '주문 시점 제목',
    model: null,
    rating: null,
    paidAt: '2026-07-22T10:00:00',
    createdAt: '2026-07-22T09:50:00',
    product: null,
  })

  assert.ok(prompt)

  const [card] = composePurchasedPrompts(
    [prompt],
    [{
      productId: 'product-1',
      sellerId: 'seller-1',
      title: '최신 상품 제목',
      amount: 12000,
      thumbnailUrl: '/prompt.png',
      productType: 'IMAGE',
      model: 'GPT-5',
      salesCount: 31,
      averageRating: 4.8,
      status: 'ON_SALE',
    }],
    { 'seller-1': '판매자 이름' },
  )

  assert.deepEqual(card, {
    ...prompt,
    title: '최신 상품 제목',
    amount: 12000,
    thumbnail_url: '/prompt.png',
    productType: 'IMAGE',
    model: 'GPT-5',
    rating: 4.8,
    salesCount: 31,
    sellerId: 'seller-1',
    seller: '판매자 이름',
  })
  assert.equal(card.orderId, 'order-1')
  assert.equal(card.orderProductId, 'order-product-1')
  assert.equal(card.downloaded, true)
  assert.equal(card.isRefundable, false)
})

test('composePurchasedPrompts keeps order fallback for missing product and seller', () => {
  const prompt = mapOrderToPrompt({
    orderId: 'order-1',
    productId: 'product-1',
    downloaded: false,
    isRefundable: true,
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    productType: 'PROMPT',
    title: '기존 제목',
    model: null,
    rating: null,
    paidAt: '2026-07-22T10:00:00',
    createdAt: '2026-07-22T09:50:00',
    product: null,
  })

  assert.ok(prompt)
  assert.deepEqual(composePurchasedPrompts([prompt], [], {}), [prompt])

  const [card] = composePurchasedPrompts(
    [prompt],
    [{
      productId: 'product-1',
      sellerId: 'missing-seller',
      title: '최신 제목',
      amount: 1000,
      thumbnailUrl: null,
      productType: 'PROMPT',
      model: 'Claude',
      salesCount: 1,
      averageRating: 5,
      status: 'ON_SALE',
    }],
    { 'missing-seller': null },
  )

  assert.equal(card.seller, 'PromptHub')
})
