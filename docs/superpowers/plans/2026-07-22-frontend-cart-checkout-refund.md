# Frontend Cart, Checkout, and Refund Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프런트엔드의 장바구니 빈 상태, 유료 결제 준비 순서, 환불 요청 계약을 현재 합의된 API에 맞게 수정한다.

**Architecture:** API 경로는 `/api/v2/cart`를 유지하고, 오류 판별·Toss 준비·환불 요청 구성은 Node 테스트가 가능한 순수 계약 모듈로 분리한다. Checkout Client Component는 유료 상품에서만 Toss SDK를 주문 생성 전에 준비하며 무료 상품 흐름은 유지한다.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Axios, Toss Payments SDK, Node.js `node:test`

## Global Constraints

- 백엔드 파일과 Gateway 설정은 수정하지 않는다.
- 장바구니 경로는 `/api/v2/cart`와 `/api/v2/cart/{cartProductId}`를 유지한다.
- `payment-ready` API를 추가하거나 호출하지 않는다.
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`를 코드에 하드코딩하지 않는다.
- 모든 동작 변경은 실패 테스트를 먼저 확인한다.

---

### Task 1: Empty Cart Response

**Files:**
- Create: `lib/httpContracts.ts`
- Create: `lib/httpContracts.test.ts`
- Modify: `lib/cart.ts:6-9`

**Interfaces:**
- Consumes: Axios 형태의 `unknown` 오류
- Produces: `hasHttpStatus(error: unknown, status: number): boolean`

- [ ] **Step 1: Write the failing status contract test**

```ts
test('hasHttpStatus recognizes an HTTP response status', () => {
  assert.equal(hasHttpStatus({ response: { status: 404 } }, 404), true)
  assert.equal(hasHttpStatus({ response: { status: 500 } }, 404), false)
  assert.equal(hasHttpStatus(new Error('network')), 404), false)
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `node --experimental-strip-types --test lib/httpContracts.test.ts`

Expected: FAIL because `lib/httpContracts.ts` does not exist.

- [ ] **Step 3: Implement the status contract and cart normalization**

```ts
export function hasHttpStatus(error: unknown, status: number): boolean {
  if (typeof error !== 'object' || error === null) return false
  const response = (error as { response?: unknown }).response
  if (typeof response !== 'object' || response === null) return false
  return (response as { status?: unknown }).status === status
}
```

Wrap `getCartItems()` in `try/catch`; return `[]` only for status 404 and rethrow every other error.

- [ ] **Step 4: Run the focused test**

Run: `node --experimental-strip-types --test lib/httpContracts.test.ts`

Expected: PASS.

### Task 2: Paid Checkout Preparation

**Files:**
- Create: `lib/checkoutContracts.ts`
- Create: `lib/checkoutContracts.test.ts`
- Modify: `app/checkout/page.tsx:84-141`

**Interfaces:**
- Consumes: optional Toss instance, public client key, SDK loader, order creator
- Produces: `preparePaidOrder<TPayment, TOrder>(options): Promise<{ paymentInstance: TPayment; order: TOrder }>`

- [ ] **Step 1: Write failing checkout ordering tests**

Cover these behaviors:

```ts
test('preparePaidOrder rejects a missing client key before creating an order', async () => {
  let loadCalls = 0
  let orderCalls = 0
  await assert.rejects(
    preparePaidOrder({
      paymentInstance: null,
      clientKey: undefined,
      loadPayments: async () => { loadCalls += 1; return { id: 'payment' } },
      createOrder: async () => { orderCalls += 1; return { orderId: 'order-1' } },
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
      loadPayments: async () => { throw new Error('blocked') },
      createOrder: async () => { orderCalls += 1; return { orderId: 'order-1' } },
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
    loadPayments: async () => { events.push('load'); return { id: 'payment' } },
    createOrder: async () => { events.push('order'); return { orderId: 'order-1' } },
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
    loadPayments: async () => { loadCalls += 1; return { id: 'loaded' } },
    createOrder: async () => ({ orderId: 'order-1' }),
  })
  assert.equal(loadCalls, 0)
  assert.equal(result.paymentInstance.id, 'existing')
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `node --experimental-strip-types --test lib/checkoutContracts.test.ts`

Expected: FAIL because `preparePaidOrder` does not exist.

- [ ] **Step 3: Implement minimal paid-order orchestration**

```ts
export async function preparePaidOrder<TPayment, TOrder>({
  paymentInstance,
  clientKey,
  loadPayments,
  createOrder,
}: PreparePaidOrderOptions<TPayment, TOrder>) {
  let readyPayment = paymentInstance
  if (!readyPayment) {
    if (!clientKey) throw new Error('결제 설정이 완료되지 않았습니다.')
    try {
      readyPayment = await loadPayments(clientKey)
    } catch {
      throw new Error('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }
  const order = await createOrder()
  return { paymentInstance: readyPayment, order }
}
```

- [ ] **Step 4: Integrate checkout flow**

For `total > 0`, call `preparePaidOrder()` and only then invoke Toss `requestPayment()`. For `total === 0`, call `createOrder()` directly and keep the existing purchased-page redirect. Do not add `payment-ready`.

- [ ] **Step 5: Run the focused test**

Run: `node --experimental-strip-types --test lib/checkoutContracts.test.ts`

Expected: PASS.

### Task 3: Refund Request Contract

**Files:**
- Create: `lib/refundContracts.ts`
- Create: `lib/refundContracts.test.ts`
- Modify: `lib/payments.ts:22-30`
- Modify: `app/mypage/page.tsx:526-532`

**Interfaces:**
- Consumes: `orderId: string`, `orderProductIds: string[]`
- Produces: `buildRefundRequest(orderId, orderProductIds): { path: string; body: { orderProductIds: string[] } }`

- [ ] **Step 1: Write the failing refund contract test**

```ts
test('buildRefundRequest uses the order-scoped route without paymentId', () => {
  assert.deepEqual(buildRefundRequest('order-1', ['line-1']), {
    path: '/api/v2/orders/order-1/refund',
    body: { orderProductIds: ['line-1'] },
  })
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `node --experimental-strip-types --test lib/refundContracts.test.ts`

Expected: FAIL because `buildRefundRequest` does not exist.

- [ ] **Step 3: Implement and integrate the refund contract**

Use `encodeURIComponent(orderId)` in the path. Change `requestRefund` to accept `orderId` and `orderProductIds`, then pass `paymentItem.orderId` from My Page. Do not send `paymentId`.

- [ ] **Step 4: Run the focused test**

Run: `node --experimental-strip-types --test lib/refundContracts.test.ts`

Expected: PASS.

### Task 4: Order Status Types and Regression Verification

**Files:**
- Modify: `types/api/orders.ts:34-41`
- Verify: all modified frontend files

**Interfaces:**
- Produces: `OrderStatus` and `OrderProductStatus` unions containing `REFUND_REQUESTED`

- [ ] **Step 1: Add `REFUND_REQUESTED` to both status unions**

Do not change existing serialized enum names.

- [ ] **Step 2: Run all contract tests**

Run:

```bash
node --experimental-strip-types --test \
  lib/httpContracts.test.ts \
  lib/checkoutContracts.test.ts \
  lib/refundContracts.test.ts \
  lib/cart.test.ts \
  lib/orders.test.ts \
  lib/orderAdapters.test.ts \
  lib/paymentAdapters.test.ts
```

Expected: all tests PASS.

- [ ] **Step 3: Run lint and production build**

Run: `npm run lint`

Expected: zero lint errors.

Run: `npm run build`

Expected: production build and TypeScript checks complete successfully.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and `git diff --stat`.

Expected: no whitespace errors and no backend changes.
