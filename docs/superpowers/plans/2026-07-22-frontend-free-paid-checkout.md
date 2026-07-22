# Frontend Free and Paid Checkout Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배포 환경의 Toss 클라이언트 키 누락을 예방하고, 유료 주문은 Toss 준비 후 생성하며, 백엔드가 완료한 0원 주문은 Toss 없이 구매 내역으로 이동하고, Checkout 실패 정보를 단계별로 진단할 수 있게 한다.

**Architecture:** 현재 `preparePaidOrder()`와 `createOrder()` 계약은 유지한다. 테스트 가능한 `lib/checkoutContracts.ts`에 응답 금액 분기와 Checkout 오류 정규화를 추가하고, `app/checkout/page.tsx`는 결제 준비·주문 생성·결제창 호출의 활성 단계를 기록하는 얇은 오케스트레이터로 남긴다. `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 Next.js 16의 빌드 시 공개 환경변수이므로 저장소에는 이름과 설정 절차만 문서화하고 실제 값은 Vercel 환경에만 둔다.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Axios 1.18, Toss Payments SDK 2.7.1, Zustand 5, Node.js `node:test`, Vercel

## Global Constraints

- 백엔드의 0원 주문 지원은 배포 완료된 상태로 가정하며 무료 구매 버튼을 임시 비활성화하지 않는다.
- 주문 생성은 기존 `POST /api/v2/orders`만 사용한다.
- `payment-ready` API를 추가하거나 호출하지 않는다.
- 장바구니 경로는 `/api/v2/cart`와 `/api/v2/cart/{cartProductId}`를 유지한다.
- `NEXT_PUBLIC_TOSS_CLIENT_KEY`의 실제 값을 소스, 테스트, 문서, 커밋에 기록하지 않는다.
- 유료 주문은 `Toss 클라이언트 키 확인 → Toss SDK 준비 → 주문 생성 → Toss 결제창 호출` 순서를 지킨다.
- 무료 주문은 `주문 생성 → 응답 totalAmount가 0인지 확인 → Toss 호출 생략 → /mypage?tab=purchased 이동` 순서를 지킨다.
- 구매 완료 상태를 localStorage 또는 Zustand만으로 만들지 않는다. 구매 권한은 주문 API 성공 응답을 근거로 한다.
- Checkout 새 동작은 실패 테스트를 먼저 추가하고 Node 계약 테스트, ESLint, production build를 모두 통과시킨다.
- Task 5의 Vercel 설정·재배포는 운영 변경 권한을 명시적으로 받은 실행에서만 수행한다. 권한이 없으면 Task 4 검증에서 멈춘다.

## Current Baseline

다음 항목은 현재 `main`의 `956d60b` 커밋에 이미 구현되어 있으므로 다시 만들지 않는다.

- `lib/checkoutContracts.ts`의 `preparePaidOrder()`가 키 누락과 SDK 로드 실패 시 주문 생성을 막는다.
- `app/checkout/page.tsx`가 유료 상품에서 `preparePaidOrder()` 후 `createOrder()`를 호출한다.
- 주문 응답의 `totalAmount === 0`이면 Toss `requestPayment()`를 생략하고 구매 내역으로 이동한다.
- `lib/orders.ts`와 `lib/orderContracts.ts`가 `{ data: { totalAmount, order: { orderId } } }` 응답을 `{ orderId, totalAmount }`로 변환한다.
- `payment-ready` 호출은 없고 장바구니 API는 `/api/v2/cart`를 사용한다.

이번 계획은 현재 기준선에서 빠진 환경변수 안내, 구조화된 오류 정보, 무료 응답 분기 테스트, 중복 제출 방지 및 운영 검증만 보강한다.

계획 작성 시 로컬 `main`은 `origin/main`보다 10커밋 뒤지만, `git diff HEAD..origin/main`에는 Checkout·주문 계약 파일 변경이 없다. 실행자는 격리 브랜치 또는 worktree를 만들기 전에 팀이 의도한 최신 기준 브랜치를 동기화하고, 동기화 후 이 계획의 파일 경계를 다시 확인한다.

---

### Task 1: Toss Environment Contract and Deployment Documentation

**Files:**
- Modify: `.env.local.example:1-9`
- Modify: `README.md:32-36`

**Interfaces:**
- Consumes: Next.js가 빌드 시 인라인하는 `process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY`
- Produces: 값이 없는 안전한 환경변수 예시와 Vercel Production/Preview 설정·재배포 절차

- [ ] **Step 1: Verify the missing configuration contract**

Run:

```bash
rg -n "NEXT_PUBLIC_TOSS_CLIENT_KEY" .env.local.example README.md
```

Expected: no matches, proving that contributors and deployers cannot discover the required key from tracked setup documentation.

- [ ] **Step 2: Add the public Toss key placeholder to the local example**

Append this placeholder after the existing public Kakao key in `.env.local.example`:

```dotenv
NEXT_PUBLIC_TOSS_CLIENT_KEY=<토스-클라이언트-키>
```

Do not copy the value from `.env.local`; only the placeholder is committed.

- [ ] **Step 3: Document build-time and Vercel requirements**

Add this section to `README.md` before `## Deploy on Vercel`:

```markdown
## Checkout payment configuration

Paid Checkout requires `NEXT_PUBLIC_TOSS_CLIENT_KEY`.

- Local development: copy `.env.local.example` to `.env.local` and set the Toss client key locally.
- Vercel Production: add `NEXT_PUBLIC_TOSS_CLIENT_KEY` in Project Settings → Environment Variables.
- Vercel Preview: add the same variable only when Preview Checkout must be tested.
- Redeploy after changing the variable. Next.js inlines `NEXT_PUBLIC_*` values during `next build`, so an existing deployment does not pick up a later value automatically.
- Never hardcode the key in TypeScript, checked-in environment files, or documentation.
```

- [ ] **Step 4: Verify the tracked files contain the variable name but no value**

Run:

```bash
rg -n "NEXT_PUBLIC_TOSS_CLIENT_KEY" .env.local.example README.md app/checkout/page.tsx
git diff --check
```

Expected: the example, README, and Checkout source reference the same variable name; no whitespace errors are reported. Manually confirm the diff contains only `<토스-클라이언트-키>` and no real key.

- [ ] **Step 5: Commit the configuration documentation**

```bash
git add .env.local.example README.md
git commit -m "chore: frontend Toss 클라이언트 키 설정 문서화"
```

---

### Task 2: Checkout Outcome and Failure Contracts

**Files:**
- Modify: `lib/checkoutContracts.test.ts:1-89`
- Modify: `lib/checkoutContracts.ts:1-34`

**Interfaces:**
- Consumes: `totalAmount: number`, an optional staged Checkout error, or an Axios-shaped `unknown` error
- Produces: `shouldRequestPayment(totalAmount): boolean`
- Produces: `CheckoutStageError` with stage `payment_setup | order_creation | payment_request`
- Produces: `normalizeCheckoutFailure(error, fallbackStage): CheckoutFailure`
- Preserves: `preparePaidOrder<TPayment, TOrder>(options): Promise<{ paymentInstance: TPayment; order: TOrder }>`

- [ ] **Step 1: Write failing response-amount and error-normalization tests**

Extend `lib/checkoutContracts.test.ts` imports and add these tests:

```ts
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
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
node --experimental-strip-types --test lib/checkoutContracts.test.ts
```

Expected: FAIL because `CheckoutStageError`, `normalizeCheckoutFailure`, and `shouldRequestPayment` are not exported.

- [ ] **Step 3: Add exact Checkout stage and failure types**

Add these declarations to `lib/checkoutContracts.ts`:

```ts
export type CheckoutStage = 'payment_setup' | 'order_creation' | 'payment_request'

export type CheckoutFailure = {
  stage: CheckoutStage
  status: number | null
  code: string | null
  message: string
}

export class CheckoutStageError extends Error {
  constructor(
    readonly stage: CheckoutStage,
    message: string,
    readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'CheckoutStageError'
  }
}

export function shouldRequestPayment(totalAmount: number): boolean {
  return totalAmount > 0
}
```

- [ ] **Step 4: Implement error normalization without depending on Axios at runtime**

Add this implementation to `lib/checkoutContracts.ts`:

```ts
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

export function normalizeCheckoutFailure(
  error: unknown,
  fallbackStage: CheckoutStage,
): CheckoutFailure {
  const stagedError = error instanceof CheckoutStageError ? error : null
  const source = stagedError?.originalError ?? error
  const sourceRecord = asRecord(source)
  const response = asRecord(sourceRecord?.response)
  const data = asRecord(response?.data)
  const status = typeof response?.status === 'number' ? response.status : null
  const code = typeof data?.code === 'string' ? data.code : null
  const serverMessage = typeof data?.message === 'string' ? data.message : null
  const localMessage = error instanceof Error ? error.message : null

  return {
    stage: stagedError?.stage ?? fallbackStage,
    status,
    code,
    message: serverMessage ??
      (status === 503
        ? '주문 서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
        : localMessage ?? '주문 요청을 처리하지 못했습니다.'),
  }
}
```

The server message wins whenever it exists. HTTP status, server code, and stage remain available for structured development logs even when only `message` is rendered to the user.

- [ ] **Step 5: Tag preparation and order-creation failures inside preparePaidOrder**

Replace the error branches and order call in `preparePaidOrder()` with:

```ts
if (!readyPayment) {
  if (!clientKey) {
    throw new CheckoutStageError('payment_setup', '결제 설정이 완료되지 않았습니다.')
  }

  try {
    readyPayment = await loadPayments(clientKey)
  } catch (error: unknown) {
    throw new CheckoutStageError(
      'payment_setup',
      '결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      error,
    )
  }
}

try {
  const order = await createOrder()
  return { paymentInstance: readyPayment, order }
} catch (error: unknown) {
  throw new CheckoutStageError(
    'order_creation',
    '주문 요청을 처리하지 못했습니다.',
    error,
  )
}
```

- [ ] **Step 6: Run the focused contract test to verify GREEN**

Run:

```bash
node --experimental-strip-types --test lib/checkoutContracts.test.ts
```

Expected: all existing paid-order ordering tests and the new amount/error tests PASS.

---

### Task 3: Checkout Page Integration and Duplicate Submission Guard

**Files:**
- Modify: `app/checkout/page.tsx:3-155`

**Interfaces:**
- Consumes: `shouldRequestPayment`, `CheckoutStageError`, `normalizeCheckoutFailure`, existing `preparePaidOrder`, and the backend `CreateOrderResult`
- Produces: one order request per active submission, a free-order purchased-page redirect, a paid Toss request, a user-facing server message, and a structured development log

- [ ] **Step 1: Import the stage contracts and add an immediate submission lock**

Update the React and Checkout imports:

```ts
import { Suspense, useEffect, useRef, useState } from 'react'
import {
  CheckoutStageError,
  normalizeCheckoutFailure,
  preparePaidOrder,
  shouldRequestPayment,
  type CheckoutStage,
} from '@/lib/checkoutContracts'
```

Add this ref beside the existing state:

```ts
const submissionLockedRef = useRef(false)
```

At the first line of `handleOrder()`, replace the current guard with:

```ts
if (submissionLockedRef.current || loading || items.length === 0 || !user) return
submissionLockedRef.current = true
```

This closes the same-render double-click window before React commits `loading=true`.

- [ ] **Step 2: Track the active stage and retain the existing paid preparation order**

Before entering `try`, initialize the fallback stage:

```ts
let activeStage: CheckoutStage = total > 0 ? 'payment_setup' : 'order_creation'
```

Keep the existing `total > 0` call to `preparePaidOrder()` and the zero-total direct call to `createOrder()`. Do not move paid `createOrder()` ahead of Toss preparation. `preparePaidOrder()` now preserves `payment_setup` versus `order_creation` on thrown errors.

- [ ] **Step 3: Base the post-order branch on the backend response**

Replace the literal `totalAmount === 0` branch with:

```ts
if (!shouldRequestPayment(totalAmount)) {
  router.replace('/mypage?tab=purchased')
  return
}
```

The order API success is the purchase-completion source of truth. Do not set a purchased flag in localStorage or Zustand. Keep `_mock_pending_order` only as its existing MSW test bridge; it must not control production access.

- [ ] **Step 4: Tag Toss invocation failures and normalize all Checkout failures**

Immediately before `requestPayment()`, set:

```ts
activeStage = 'payment_request'
```

Wrap a missing post-order payment instance with its stage:

```ts
if (!paymentInstance) {
  throw new CheckoutStageError(
    'payment_setup',
    '결제 모듈이 초기화되지 않았습니다. 잠시 후 다시 시도해 주세요.',
  )
}
```

Replace the `catch (e: any)` body with:

```ts
} catch (error: unknown) {
  const failure = normalizeCheckoutFailure(error, activeStage)
  console.error('Checkout failure', failure, error)
  setError(failure.message)
  submissionLockedRef.current = false
  setLoading(false)
}
```

The structured `failure` object always contains `stage`, `status`, `code`, and `message`. The screen displays the server message when present; the development log preserves all diagnostic fields.

- [ ] **Step 5: Verify static contract boundaries**

Run:

```bash
rg -n "payment-ready|/api/v2/cart/products" app/checkout lib/checkoutContracts.ts lib/orders.ts lib/cart.ts
rg -n "shouldRequestPayment|normalizeCheckoutFailure|submissionLockedRef" app/checkout/page.tsx lib/checkoutContracts.ts
```

Expected: the first command has no matches; the second shows the new branch, error normalization, and lock integration.

- [ ] **Step 6: Run the focused tests and commit the Checkout change**

Run:

```bash
node --experimental-strip-types --test lib/checkoutContracts.test.ts lib/orders.test.ts
```

Expected: all Checkout and order response contract tests PASS.

Then commit:

```bash
git add app/checkout/page.tsx lib/checkoutContracts.ts lib/checkoutContracts.test.ts
git commit -m "fix: frontend 무료 유료 Checkout 분기와 오류 정보 보강"
```

---

### Task 4: Automated Regression Verification

**Files:**
- Verify: `app/checkout/page.tsx`
- Verify: `lib/checkoutContracts.ts`
- Verify: `lib/checkoutContracts.test.ts`
- Verify: `lib/orders.ts`
- Verify: `lib/cart.ts`

**Interfaces:**
- Verifies: Checkout and adjacent cart/order/payment contracts compile together without adding a new API

- [ ] **Step 1: Run all frontend contract tests**

Run:

```bash
node --experimental-strip-types --test \
  lib/adminOrderAdapters.test.ts \
  lib/cart.test.ts \
  lib/checkoutContracts.test.ts \
  lib/directRouting.test.ts \
  lib/httpContracts.test.ts \
  lib/orderAdapters.test.ts \
  lib/orderGrouping.test.ts \
  lib/orders.test.ts \
  lib/paymentAdapters.test.ts \
  lib/refundContracts.test.ts
```

Expected: all tests PASS. The existing Node module-type warning is informational and must not be mistaken for a test failure.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the Next.js 16 production build**

Run:

```bash
npm run build
```

Expected: Next.js production compilation and TypeScript validation complete successfully.

- [ ] **Step 4: Inspect scope and secret safety**

Run:

```bash
git diff --check HEAD~2..HEAD
git diff --stat HEAD~2..HEAD
git diff HEAD~2..HEAD -- .env.local.example README.md app/checkout/page.tsx lib/checkoutContracts.ts lib/checkoutContracts.test.ts
```

Expected: no whitespace errors; only the five planned frontend files changed; no real Toss key, backend file, `payment-ready` path, or cart endpoint change appears.

---

### Task 5: Vercel Deployment and Production Checkout Verification

**Files:**
- No repository files are modified.

**Interfaces:**
- Consumes: a valid Toss client key, Vercel project access, deployed backend 0원 주문 support, test buyer account, paid and free test products
- Produces: a rebuilt Production deployment and evidence for every Checkout completion condition

- [ ] **Step 1: Configure the Production environment variable**

In Vercel, open the frontend project and navigate to **Settings → Environment Variables**. Add `NEXT_PUBLIC_TOSS_CLIENT_KEY` for **Production** using the valid client key. Add **Preview** only when Preview Checkout is part of the release test. Do not paste the value into an issue, PR, log, or repository file.

- [ ] **Step 2: Redeploy from the verified commit**

Create a new Production deployment after the variable is saved. Reusing the old build is insufficient because Next.js 16 inlines `NEXT_PUBLIC_*` values during `next build`.

Expected: the deployment finishes successfully from the commit that passed Task 4.

- [ ] **Step 3: Verify paid single-item and cart Checkout**

For a paid direct purchase and a paid cart purchase, use the browser Network panel and verify this order:

```text
Checkout button click
→ Toss SDK is ready
→ one POST /api/v2/orders
→ Toss payment window opens
```

Expected: one order request per click, no `payment-ready` request, and the Toss payment amount equals the order response `totalAmount`.

- [ ] **Step 4: Verify missing-key and SDK-load failure safeguards in Preview**

Use a Preview deployment without the key, then a Preview run with the Toss SDK request blocked.

Expected in both cases:

```text
POST /api/v2/orders call count: 0
Checkout button: re-enabled after the error
User message: configuration or SDK-load failure message
```

Restore the Preview setting or unblock the SDK after the test.

- [ ] **Step 5: Verify the free-order success path**

Buy a free product and inspect Network/navigation:

```text
one POST /api/v2/orders
→ response data.totalAmount = 0
→ zero Toss requestPayment calls
→ /mypage?tab=purchased
```

Expected: the product appears in purchase history and its content is immediately accessible. Refresh the purchased page to confirm access comes from the backend, not local state.

- [ ] **Step 6: Verify free-order failure detail and duplicate-click protection**

Against a controlled Preview/API response, return HTTP 400 with `{ code: 'V001', message: '입력값 검증 실패' }`, then rapidly double-click the order button once.

Expected:

```text
POST /api/v2/orders call count: 1
Visible message: 입력값 검증 실패
Console failure.stage: order_creation
Console failure.status: 400
Console failure.code: V001
Console failure.message: 입력값 검증 실패
```

- [ ] **Step 7: Verify navigation recovery**

Test Checkout refresh and browser Back in both direct-buy and cart modes.

Expected: an empty direct-buy memory store redirects to the product detail page; an empty cart redirects to `/browse`; a failed submission unlocks the button; a successful free order uses replace navigation so Back does not resubmit the completed Checkout.

- [ ] **Step 8: Record release evidence**

Record the Production deployment URL/ID, commit SHA, test account identifier, paid/free product identifiers, and pass/fail result for Steps 3-7 in the release ticket. Do not record the Toss client key.
