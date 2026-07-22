import assert from 'node:assert/strict'
import test from 'node:test'

import { preparePaidOrder } from './checkoutContracts.ts'

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
    { message: '결제 설정이 완료되지 않았습니다.' },
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
    { message: '결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
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
