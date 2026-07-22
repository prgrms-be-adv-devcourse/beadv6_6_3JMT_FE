import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CheckoutStageError,
  normalizeCheckoutFailure,
  preparePaidOrder,
  shouldRequestPayment,
} from './checkoutContracts.ts'

test('shouldRequestPayment skips zero and requests Toss for a positive amount', () => {
  assert.equal(shouldRequestPayment(0), false)
  assert.equal(shouldRequestPayment(15000), true)
})

test('preparePaidOrder rejects a missing client key before creating an order', async () => {
  let loadCalls = 0
  let orderCalls = 0

  await assert.rejects(
    preparePaidOrder({
      paymentInstance: null,
      clientKey: undefined,
      loadPayments: async () => {
        loadCalls += 1
        return { id: 'payment' }
      },
      createOrder: async () => {
        orderCalls += 1
        return { orderId: 'order-1' }
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof CheckoutStageError)
      assert.equal(error.stage, 'payment_setup')
      assert.equal(error.message, '결제 설정이 완료되지 않았습니다.')
      return true
    },
  )

  assert.equal(loadCalls, 0)
  assert.equal(orderCalls, 0)
})

test('preparePaidOrder rejects SDK load failure before creating an order', async () => {
  let orderCalls = 0

  await assert.rejects(
    preparePaidOrder({
      paymentInstance: null,
      clientKey: 'client-key',
      loadPayments: async () => {
        throw new Error('blocked')
      },
      createOrder: async () => {
        orderCalls += 1
        return { orderId: 'order-1' }
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof CheckoutStageError)
      assert.equal(error.stage, 'payment_setup')
      assert.equal(error.message, '결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return true
    },
  )

  assert.equal(orderCalls, 0)
})

test('preparePaidOrder loads the SDK before creating an order', async () => {
  const events: string[] = []

  const result = await preparePaidOrder({
    paymentInstance: null,
    clientKey: 'client-key',
    loadPayments: async () => {
      events.push('load')
      return { id: 'payment' }
    },
    createOrder: async () => {
      events.push('order')
      return { orderId: 'order-1' }
    },
  })

  assert.deepEqual(events, ['load', 'order'])
  assert.deepEqual(result, {
    paymentInstance: { id: 'payment' },
    order: { orderId: 'order-1' },
  })
})

test('preparePaidOrder reuses an existing payment instance', async () => {
  let loadCalls = 0

  const result = await preparePaidOrder({
    paymentInstance: { id: 'existing' },
    clientKey: undefined,
    loadPayments: async () => {
      loadCalls += 1
      return { id: 'loaded' }
    },
    createOrder: async () => ({ orderId: 'order-1' }),
  })

  assert.equal(loadCalls, 0)
  assert.equal(result.paymentInstance.id, 'existing')
})

test('preparePaidOrder identifies order API failures as order_creation', async () => {
  const failure = await preparePaidOrder({
    paymentInstance: { id: 'payment' },
    clientKey: 'client-key',
    loadPayments: async () => ({ id: 'unused' }),
    createOrder: async () => {
      throw {
        response: {
          status: 400,
          data: { code: 'V001', message: '입력값 검증 실패' },
        },
      }
    },
  }).catch((error: unknown) => normalizeCheckoutFailure(error, 'payment_setup'))

  assert.deepEqual(failure, {
    stage: 'order_creation',
    status: 400,
    code: 'V001',
    message: '입력값 검증 실패',
  })
})

test('normalizeCheckoutFailure preserves a payment request stage and server details', () => {
  const originalError = {
    response: {
      status: 409,
      data: { code: 'PAY002', message: '이미 처리된 주문입니다.' },
    },
  }

  assert.deepEqual(
    normalizeCheckoutFailure(
      new CheckoutStageError('payment_request', '결제창 호출에 실패했습니다.', originalError),
      'order_creation',
    ),
    {
      stage: 'payment_request',
      status: 409,
      code: 'PAY002',
      message: '이미 처리된 주문입니다.',
    },
  )
})

test('normalizeCheckoutFailure keeps a readable fallback for network errors', () => {
  assert.deepEqual(normalizeCheckoutFailure(new Error('Network Error'), 'order_creation'), {
    stage: 'order_creation',
    status: null,
    code: null,
    message: 'Network Error',
  })
})

test('normalizeCheckoutFailure maps a message-less 503 to a service message', () => {
  assert.deepEqual(
    normalizeCheckoutFailure(
      { response: { status: 503, data: {} } },
      'order_creation',
    ),
    {
      stage: 'order_creation',
      status: 503,
      code: null,
      message: '주문 서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    },
  )
})
