import test from 'node:test'
import assert from 'node:assert/strict'

import {
  composePurchasedOrderCards,
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

test('composePurchasedOrderCards combines order, product, and seller responses', () => {
  const cards = composePurchasedOrderCards(
    [
      {
        orderId: 'order-1',
        orderProductId: 'order-product-1',
        productId: 'product-2',
        orderStatus: 'COMPLETED',
        orderProductStatus: 'PAID',
        downloaded: true,
        isRefundable: false,
        paidAt: '2026-07-22T10:00:00',
      },
      {
        orderId: 'order-2',
        orderProductId: 'order-product-2',
        productId: 'product-1',
        orderStatus: 'COMPLETED',
        orderProductStatus: 'PAID',
        downloaded: false,
        isRefundable: true,
        paidAt: '2026-07-21T10:00:00',
      },
    ],
    [
      {
        productId: 'product-1',
        sellerId: 'seller-1',
        title: 'First product',
        amount: 1000,
        thumbnailUrl: null,
        productType: 'PROMPT',
        model: 'GPT-4.1',
        salesCount: 3,
        averageRating: 4.5,
        status: 'ACTIVE',
      },
      {
        productId: 'product-2',
        sellerId: 'seller-2',
        title: 'Second product',
        amount: 2000,
        thumbnailUrl: '/second.png',
        productType: 'NOTION',
        model: '',
        salesCount: 5,
        averageRating: 4.8,
        status: 'ACTIVE',
      },
    ],
    { 'seller-1': '판매자 1', 'seller-2': '판매자 2' },
  )

  assert.deepEqual(cards.map((card) => card.id), ['product-2', 'product-1'])
  assert.equal(cards[0]?.seller, '판매자 2')
  assert.equal(cards[0]?.title, 'Second product')
  assert.equal(cards[0]?.model, 'Prompt')
  assert.equal(cards[0]?.downloaded, true)
  assert.equal(cards[1]?.amount, 1000)
})

test('composePurchasedOrderCards excludes missing products and refunded orders', () => {
  const cards = composePurchasedOrderCards(
    [
      {
        orderId: 'order-missing',
        productId: 'missing-product',
        orderStatus: 'COMPLETED',
        orderProductStatus: 'PAID',
        downloaded: false,
        isRefundable: false,
      },
      {
        orderId: 'order-refunded',
        productId: 'product-1',
        orderStatus: 'ALL_REFUNDED',
        orderProductStatus: 'REFUNDED',
        downloaded: false,
        isRefundable: false,
      },
    ],
    [{
      productId: 'product-1',
      sellerId: 'seller-1',
      title: 'Refunded product',
      amount: 1000,
      thumbnailUrl: null,
      productType: 'PROMPT',
      model: 'GPT-4.1',
      salesCount: 0,
      averageRating: 0,
      status: 'ACTIVE',
    }],
    { 'seller-1': '판매자 1' },
  )

  assert.deepEqual(cards, [])
})

test('composePurchasedOrderCards uses a fallback when seller data is missing', () => {
  const cards = composePurchasedOrderCards(
    [{
      orderId: 'order-1',
      productId: 'product-1',
      orderStatus: 'COMPLETED',
      orderProductStatus: 'PAID',
      downloaded: false,
      isRefundable: false,
    }],
    [{
      productId: 'product-1',
      sellerId: 'seller-1',
      title: 'Product',
      amount: 1000,
      thumbnailUrl: null,
      productType: 'PROMPT',
      model: 'GPT-4.1',
      salesCount: 0,
      averageRating: 0,
      status: 'ACTIVE',
    }],
    { 'seller-1': null },
  )

  assert.equal(cards[0]?.seller, '탈퇴한 판매자')
})
