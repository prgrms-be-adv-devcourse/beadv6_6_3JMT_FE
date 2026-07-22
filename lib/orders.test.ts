import test from 'node:test'
import assert from 'node:assert/strict'

import { buildCreateOrderRequest, mapCreateOrderResponse, mapOrderListResponse } from './orderContracts.ts'

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

test('mapOrderListResponse flattens backend order products and keeps order fields', () => {
  assert.deepEqual(
    mapOrderListResponse([{
      orderId: 'order-1',
      orderNumber: 'ORD-20260722-000001',
      orderStatus: 'COMPLETED',
      totalAmount: 15000,
      products: [{
        orderProductId: 'order-product-1',
        productId: 'product-1',
        orderProductStatus: 'PAID',
        amount: 15000,
        isRefundable: true,
        downloaded: false,
        productType: null,
        title: 'Spring Boot 코드 리뷰',
        model: null,
        rating: null,
      }],
      paidAt: '2026-07-22T10:00:00',
      createdAt: '2026-07-22T09:58:00',
    }]),
    [{
      orderId: 'order-1',
      orderNumber: 'ORD-20260722-000001',
      orderTotalAmount: 15000,
      orderProductId: 'order-product-1',
      productId: 'product-1',
      amount: 15000,
      orderStatus: 'COMPLETED',
      orderProductStatus: 'PAID',
      downloaded: false,
      isRefundable: true,
      productType: null,
      title: 'Spring Boot 코드 리뷰',
      model: null,
      rating: null,
      paidAt: '2026-07-22T10:00:00',
      createdAt: '2026-07-22T09:58:00',
    }],
  )
})
