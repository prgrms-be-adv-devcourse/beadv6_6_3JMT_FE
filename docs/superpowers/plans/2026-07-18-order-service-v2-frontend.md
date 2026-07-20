# Order Service v2 Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프론트엔드의 장바구니·주문·환불·관리자 주문 기능을 order-service v2 계약에 맞추고, 결제 조회는 Payment Service로 이전하며 `X-User-Role` 없이 동작하게 한다.

**Architecture:** 공통 URL 접두사 `/api/v2`는 유지하고, 변경된 요청·응답 DTO는 API 모듈과 어댑터에서 화면 모델로 변환한다. 브라우저는 `Authorization: Bearer ...`만 인증 수단으로 사용하며 order-service 호출 코드가 `X-User-Role`을 생성하거나 해당 값에 의존하지 않게 한다.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Axios, Zustand, Node.js `node:test`, Playwright

## Global Constraints

- 대상 저장소는 `beadv6_6_3JMT_FE`이다.
- 모든 order-service 호출은 `/api/v2`를 사용하고 v1 fallback을 추가하지 않는다.
- 브라우저의 정상 Gateway 호출은 `Authorization`만 전송한다. `X-User-Id`와 권한 판정은 Gateway 이후의 내부 관심사다.
- order-service 기능은 `X-User-Role` 헤더의 존재 여부나 값에 의존하지 않는다.
- 주문 생성 v2 요청은 `products: Array<{ productId; productTitle }>` 형식이다.
- 주문 생성 v2 응답의 주문 ID는 `data.order.orderId`에 있다.
- order-service의 결제 내역 API와 `payment-ready` API는 제거하며 v2 대체 경로를 만들지 않는다.
- 결제 내역 원본은 Payment Service의 `GET /api/v2/payments`에서 조회하고, 상품명·다운로드·환불 가능 상태는 order-service 주문 목록과 `orderId`로 조합한다.
- 환불 요청은 Payment Service에 직접 보내지 않고 `POST /api/v2/orders/refunds`에 `paymentId + orderProductIds`를 보낸다.
- 장바구니 전체 삭제 API는 v2 계약에 포함하지 않고, 현재 사용되지 않는 FE 클라이언트 함수만 제거한다.
- 구현 전 `node_modules/next/dist/docs/`에서 변경 대상 Next.js API 문서를 확인한다.

---

## 1. 현재 상태와 변경 요약

| 영역 | 현재 상태 | 목표 상태 |
| --- | --- | --- |
| 공통 API 경로 | `API_BASE = '/api/v2'` | 변경 없음 |
| 주문 생성 요청 | `{ productId }` 또는 `{ productIds }` | `{ products: [{ productId, productTitle }] }` |
| 주문 생성 응답 | `data.orderId`로 간주 | `data.order.orderId`를 화면 모델로 변환 |
| 주문 목록 | 응답을 `MyOrderItem[]`로 강제 캐스팅 | v2 DTO 타입과 어댑터를 통해 변환 |
| 관리자 주문 | 최상위 `sellerNickname` 사용 | `sellerCount`, `sellers[]`를 요약 표시 |
| 결제 내역 | 제거된 `/orders/payments` 호출 | Payment Service의 `/api/v2/payments` 사용 |
| 환불 요청 | `/payments/{paymentId}/refund` 직접 호출 | `/api/v2/orders/refunds`에 결제 ID와 주문상품 ID 전달 |
| 장바구니 | v2 경로 및 DTO 어댑터 구현됨 | 유지하고 계약 테스트 보강 |
| 인증 헤더 | 정상 호출은 Bearer, 로컬 direct routing helper는 역할 헤더 지원 | order-service API 모듈은 `X-User-Role`을 직접 설정하지 않으며 없어도 동작 |

## 2. 확정할 FE 계약

### 2.1 주문 생성

요청:

```json
{
  "products": [
    {
      "productId": "00000000-0000-0000-0000-000000000201",
      "productTitle": "면접 준비 프롬프트"
    }
  ]
}
```

응답에서 FE가 사용하는 최소 필드:

```json
{
  "success": true,
  "data": {
    "totalAmount": 15000,
    "order": {
      "orderId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111"
    }
  }
}
```

### 2.2 주문 목록 항목

```ts
export interface OrderListItem {
  orderId: string
  orderProductId: string
  productId: string
  orderStatus: 'CREATED' | 'COMPLETED' | 'FAILED' | 'PARTIAL_REFUNDED' | 'ALL_REFUNDED'
  orderProductStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  downloaded: boolean
  isRefundable: boolean
  productType: string
  title: string
  model: string | null
  rating: number | null
  paidAt: string | null
  createdAt: string
}
```

### 2.3 관리자 주문 항목

```ts
export interface AdminOrderSellerSummary {
  sellerId: string
  sellerNickname: string
  productCount: number
  orderAmount: number
}

export interface AdminOrder {
  orderId: string
  sellerCount: number
  sellers: AdminOrderSellerSummary[]
  productTitle: string
  totalOrderCount: number
  totalOrderAmount: number
  orderStatus: string
  createdAt: string
}
```

판매자 표시는 다음 규칙을 사용한다.

- 판매자 0명: `판매자 정보 없음`
- 판매자 1명: 첫 번째 `sellerNickname`
- 판매자 2명 이상: `첫 번째 sellerNickname 외 {sellerCount - 1}명`

### 2.4 Payment Service 결제 내역과 FE 조합 모델

```ts
export interface PaymentHistoryItem {
  orderId: string
  paymentId: string
  paymentStatus: 'PAID' | 'PARTIAL_REFUNDED' | 'ALL_REFUNDED'
  amount: number
  paidAt: string
}

export interface PaymentItem extends PaymentHistoryItem {
  title: string
  orderProductIds: string[]
  downloaded: boolean
  isRefundable: boolean
}
```

`PaymentHistoryItem`은 Payment Service가 소유한다. FE는 같은 `orderId`의 `OrderListItem[]`을 묶어 다음 값을 만든다.

- `title`: 주문상품 1개면 해당 제목, 여러 개면 `첫 상품명 외 N건`
- `orderProductIds`: 해당 주문의 모든 주문상품 ID
- `downloaded`: 주문상품 중 하나라도 다운로드했으면 true
- `isRefundable`: 결제 상태가 `PAID`이고 모든 주문상품의 `isRefundable`이 true일 때 true

## 3. 파일 변경 맵

| 파일 | 책임 |
| --- | --- |
| `lib/apiBase.ts` | `/api/v2` 접두사 유지 여부 확인 |
| `types/api/orders.ts` | 주문 생성·목록·결제·관리자 v2 DTO 타입 정의 |
| `lib/orders.ts` | 주문 생성 요청 빌드, 응답 변환, 주문 목록 API 캡슐화 |
| `lib/orders.test.ts` | 주문 생성 요청·응답 계약 테스트 |
| `lib/orderAdapters.ts` | v2 주문 목록을 구매 상품 화면 모델로 변환 |
| `lib/orderAdapters.test.ts` | v2 주문 목록 변환 및 환불 상태 테스트 |
| `app/checkout/page.tsx` | 상품 ID와 제목을 주문 생성 API에 전달 |
| `lib/adminOrderAdapters.ts` | 다중 판매자 표시 문자열 생성 |
| `lib/adminOrderAdapters.test.ts` | 판매자 0명·1명·다수 표시 규칙 테스트 |
| `app/admin/orders/page.tsx` | v2 관리자 주문 타입 및 판매자 요약 표시 |
| `lib/payments.ts` | Payment Service 결제 조회와 order-service 환불 접수 호출 |
| `lib/paymentAdapters.ts` | 결제 원본과 주문상품 목록을 화면용 결제 행으로 조합 |
| `lib/paymentAdapters.test.ts` | 단건·다건·환불 가능 상태 조합 테스트 |
| `components/ui/PaymentTable.tsx` | 주문 단위 결제 행과 환불 가능 상태 표시 |
| `lib/cart.ts` | 존재하지 않는 장바구니 전체 삭제 호출 제거 |
| `lib/cart.test.ts` | v2 장바구니 응답 회귀 테스트 유지 |
| `lib/auth.ts` | order-service 요청이 Bearer 인증을 사용하는지 확인 |

---

### Task 1: 주문 생성 v2 계약 적용

**Files:**

- Modify: `types/api/orders.ts`
- Modify: `lib/orders.ts`
- Create: `lib/orders.test.ts`

**Interfaces:**

- Consumes: checkout 화면의 `{ productId, productTitle }[]`
- Produces: `createOrder(products): Promise<{ orderId; totalAmount }>`

- [ ] **Step 1: 주문 생성 타입을 v2 구조로 정의한다**

```ts
export interface CreateOrderProduct {
  productId: string
  productTitle: string
}

export interface CreateOrderRequest {
  products: CreateOrderProduct[]
}

export interface CreateOrderResponseData {
  totalAmount: number
  order: {
    orderId: string
  }
}

export interface CreateOrderResult {
  orderId: string
  totalAmount: number
}
```

- [ ] **Step 2: 실패하는 순수 함수 계약 테스트를 작성한다**

```ts
test('buildCreateOrderRequest sends product id and title', () => {
  assert.deepEqual(
    buildCreateOrderRequest([{ productId: 'product-1', productTitle: 'Prompt' }]),
    { products: [{ productId: 'product-1', productTitle: 'Prompt' }] },
  )
})

test('mapCreateOrderResponse reads nested order id', () => {
  assert.deepEqual(
    mapCreateOrderResponse({ totalAmount: 15000, order: { orderId: 'order-1' } }),
    { orderId: 'order-1', totalAmount: 15000 },
  )
})
```

- [ ] **Step 3: 테스트가 기존 계약 때문에 실패하는지 확인한다**

Run:

```bash
node --experimental-strip-types --test lib/orders.test.ts
```

Expected: `buildCreateOrderRequest` 또는 `mapCreateOrderResponse`가 없어 FAIL.

- [ ] **Step 4: `lib/orders.ts`에 요청·응답 변환을 구현한다**

```ts
export function buildCreateOrderRequest(products: CreateOrderProduct[]): CreateOrderRequest {
  return { products }
}

export function mapCreateOrderResponse(data: CreateOrderResponseData): CreateOrderResult {
  return { orderId: data.order.orderId, totalAmount: data.totalAmount }
}

export async function createOrder(products: CreateOrderProduct[]): Promise<CreateOrderResult> {
  const res = await api.post(`${API_BASE}/orders`, buildCreateOrderRequest(products))
  return mapCreateOrderResponse(res.data.data as CreateOrderResponseData)
}
```

- [ ] **Step 5: 주문 생성 계약 테스트를 통과시킨다**

Run:

```bash
node --experimental-strip-types --test lib/orders.test.ts
```

Expected: 2 tests PASS.

---

### Task 2: 체크아웃 화면에서 상품 제목 전달

**Files:**

- Modify: `app/checkout/page.tsx`

**Interfaces:**

- Consumes: `LineItem.productId`, `LineItem.title`
- Produces: `createOrder([{ productId, productTitle }])` 호출

- [ ] **Step 1: 단건·장바구니 분기를 하나의 상품 배열 변환으로 통합한다**

```ts
const orderProducts = items.map((item) => ({
  productId: item.productId,
  productTitle: item.title,
}))
const { orderId } = await createOrder(orderProducts)
```

- [ ] **Step 2: 기존 `{ productId }`, `{ productIds }` 생성 코드를 제거한다**

- [ ] **Step 3: 주문 ID를 Toss 결제와 `_mock_pending_order`에 그대로 연결한다**

- [ ] **Step 4: TypeScript와 ESLint를 검증한다**

Run:

```bash
npm run lint
```

Expected: 신규 타입 오류와 lint 오류가 없음.

---

### Task 3: 주문 목록 v2 타입과 어댑터 적용

**Files:**

- Modify: `types/api/orders.ts`
- Modify: `lib/orders.ts`
- Modify: `lib/orderAdapters.ts`
- Modify: `lib/orderAdapters.test.ts`
- Modify: `app/mypage/page.tsx`
- Modify: `app/detail/[id]/page.tsx`
- Modify: `app/reader/[id]/page.tsx`

**Interfaces:**

- Consumes: `PageResponse<OrderListItem>`
- Produces: 구매 상품 카드에서 사용하는 `ProductInfo`

- [ ] **Step 1: `OrderListItem`에 v2 필드를 정확히 정의한다**

`downloaded`와 `isRefundable`은 선택값이 아니라 boolean 필수값으로 정의한다.

- [ ] **Step 2: v2 주문 행 변환 테스트를 보강한다**

```ts
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
  })

  assert.equal(prompt?.downloaded, true)
  assert.equal(prompt?.isRefundable, false)
})
```

`isActivePurchasedOrder`는 주문 상태가 `COMPLETED` 또는 `PARTIAL_REFUNDED`이면서 주문상품 상태가 `PAID`인 항목만 true를 반환해야 한다. `ALL_REFUNDED` 주문과 `REFUNDED` 주문상품은 구매 완료 카드에서 제외한다.

- [ ] **Step 3: 주문 목록 호출을 `lib/orders.ts`로 모은다**

```ts
export async function getOrders(): Promise<MyOrderItem[]> {
  const res = await api.get(`${API_BASE}/orders`)
  return (res.data.data ?? []) as MyOrderItem[]
}
```

- [ ] **Step 4: 세 화면의 직접 `api.get('/orders')` 호출을 `getOrders()`로 교체한다**

- [ ] **Step 5: 어댑터 테스트를 실행한다**

Run:

```bash
node --experimental-strip-types --test lib/orderAdapters.test.ts
```

Expected: 기존 legacy fixture와 신규 v2 fixture가 모두 PASS.

---

### Task 4: 관리자 주문의 다중 판매자 응답 적용

**Files:**

- Modify: `types/api/orders.ts`
- Create: `lib/adminOrderAdapters.ts`
- Create: `lib/adminOrderAdapters.test.ts`
- Modify: `app/admin/orders/page.tsx`

**Interfaces:**

- Consumes: `AdminOrder.sellerCount`, `AdminOrder.sellers`
- Produces: 테이블 판매자 셀의 단일 표시 문자열

- [ ] **Step 1: 관리자 주문 및 판매자 요약 타입을 정의한다**

2.3절의 `AdminOrderSellerSummary`와 `AdminOrder`를 그대로 사용한다.

- [ ] **Step 2: 판매자 표시 규칙 테스트를 작성한다**

```ts
test('formatAdminOrderSellers summarizes multiple sellers', () => {
  assert.equal(
    formatAdminOrderSellers({
      sellerCount: 3,
      sellers: [
        { sellerId: 's1', sellerNickname: 'alpha', productCount: 1, orderAmount: 1000 },
        { sellerId: 's2', sellerNickname: 'beta', productCount: 1, orderAmount: 2000 },
        { sellerId: 's3', sellerNickname: 'gamma', productCount: 1, orderAmount: 3000 },
      ],
    }),
    'alpha 외 2명',
  )
})
```

- [ ] **Step 3: `formatAdminOrderSellers`를 구현한다**

```ts
export function formatAdminOrderSellers(
  order: Pick<AdminOrder, 'sellerCount' | 'sellers'>,
): string {
  const first = order.sellers[0]?.sellerNickname
  if (!first) return '판매자 정보 없음'
  return order.sellerCount > 1 ? `${first} 외 ${order.sellerCount - 1}명` : first
}
```

- [ ] **Step 4: 관리자 주문 테이블에서 `order.sellerNickname`을 변환 함수 호출로 교체한다**

- [ ] **Step 5: 관리자 상태 필터를 v2 enum으로 교체한다**

```ts
const FILTER_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'CREATED', label: '생성' },
  { value: 'COMPLETED', label: '결제 완료' },
  { value: 'FAILED', label: '실패' },
  { value: 'PARTIAL_REFUNDED', label: '부분 환불' },
  { value: 'ALL_REFUNDED', label: '전체 환불' },
]
```

- [ ] **Step 6: 어댑터 테스트를 실행한다**

Run:

```bash
node --experimental-strip-types --test lib/adminOrderAdapters.test.ts
```

Expected: 판매자 없음·1명·다수 케이스 PASS.

---

### Task 5: v2 결제 내역 계약 적용

**Files:**

- Modify: `types/api/orders.ts`
- Modify: `lib/payments.ts`
- Create: `lib/paymentAdapters.ts`
- Create: `lib/paymentAdapters.test.ts`
- Modify: `components/ui/PaymentTable.tsx`
- Modify: `app/mypage/page.tsx`

**Interfaces:**

- Consumes: Payment Service `GET /api/v2/payments`와 order-service `GET /api/v2/orders`
- Produces: 주문 정보가 결합된 `PaymentItem[]`과 `PaginationMeta`

- [ ] **Step 1: 제거된 order-service 결제 내역 경로를 Payment Service 경로로 변경한다**

```ts
export async function getPaymentHistory(
  page = 1,
  size = 20,
): Promise<{ data: PaymentHistoryItem[]; meta: PaginationMeta }> {
  const res = await api.get(`${API_BASE}/payments`, { params: { page, size } })
  return { data: res.data.data, meta: res.data.meta }
}
```

- [ ] **Step 2: 결제와 주문 목록을 조합하는 실패 테스트를 작성한다**

```ts
test('mapPaymentHistory joins order products and refund state', () => {
  const [payment] = mapPaymentHistory(
    [{
      orderId: 'order-1',
      paymentId: 'payment-1',
      paymentStatus: 'PAID',
      amount: 3000,
      paidAt: '2026-07-18T10:00:00',
    }],
    [
      { orderId: 'order-1', orderProductId: 'op-1', title: 'A', downloaded: false, isRefundable: true },
      { orderId: 'order-1', orderProductId: 'op-2', title: 'B', downloaded: false, isRefundable: true },
    ],
  )

  assert.equal(payment.title, 'A 외 1건')
  assert.deepEqual(payment.orderProductIds, ['op-1', 'op-2'])
  assert.equal(payment.isRefundable, true)
})
```

- [ ] **Step 3: `mapPaymentHistory`를 구현한다**

```ts
export function mapPaymentHistory(
  payments: PaymentHistoryItem[],
  orders: Array<Pick<OrderListItem, 'orderId' | 'orderProductId' | 'title' | 'downloaded' | 'isRefundable'>>,
): PaymentItem[] {
  return payments.map((payment) => {
    const products = orders.filter((order) => order.orderId === payment.orderId)
    const firstTitle = products[0]?.title ?? '주문 상품'
    return {
      ...payment,
      title: products.length > 1 ? `${firstTitle} 외 ${products.length - 1}건` : firstTitle,
      orderProductIds: products.map((product) => product.orderProductId),
      downloaded: products.some((product) => product.downloaded),
      isRefundable:
        payment.paymentStatus === 'PAID' &&
        products.length > 0 &&
        products.every((product) => product.isRefundable),
    }
  })
}
```

- [ ] **Step 4: 마이페이지에서 주문 목록과 결제 내역을 함께 조회해 조합한다**

`Promise.all([getOrders(), getPaymentHistory(1)])` 결과를 `mapPaymentHistory`에 전달한다.

- [ ] **Step 5: 환불 요청을 order-service v2 비동기 접수 API로 변경한다**

```ts
export async function requestRefund(params: {
  paymentId: string
  orderProductIds: string[]
}): Promise<void> {
  await api.post(`${API_BASE}/orders/refunds`, params)
}
```

HTTP 202는 환불 완료가 아니라 접수 성공으로 처리하고 화면에는 `환불 신청 중`을 표시한다.

기존 Payment Service의 `PAY004`, `PAY005`, `PAY006` 전용 분기는 제거하고 다음 HTTP 상태 기준 메시지를 사용한다.

- 400: `환불할 상품을 다시 확인해 주세요.`
- 403: `본인이 구매한 상품만 환불할 수 있어요.`
- 404: `주문 상품을 찾을 수 없어요.`
- 409: `이미 다운로드했거나 환불할 수 없는 상품이에요.`

- [ ] **Step 6: `PaymentTable`의 중복 `Payment` 타입을 제거하고 v2 상태를 표시한다**

`PAID`, `REFUNDING`, `PARTIAL_REFUNDED`, `ALL_REFUNDED` 표시 규칙을 정의한다.

- [ ] **Step 7: 결제 어댑터 테스트를 실행한다**

Run:

```bash
node --experimental-strip-types --test lib/paymentAdapters.test.ts
```

Expected: 단건·다건·다운로드됨·부분환불 케이스 PASS.

Expected: 한 주문에 상품이 여러 개여도 결제 내역은 한 행이고, 환불 요청에는 해당 주문의 `orderProductIds` 전체가 포함된다.

---

### Task 6: 장바구니 v2 계약 유지와 잘못된 클라이언트 제거

**Files:**

- Modify: `lib/cart.ts`
- Modify: `lib/cart.test.ts`

**Interfaces:**

- Consumes: `/api/v2/cart/products` 조회·추가·개별 삭제
- Produces: `CartItem[]`

- [ ] **Step 1: 사용되지 않고 BE에 존재하지 않는 `clearCartItems()`를 제거한다**

- [ ] **Step 2: `mapCartResponseToItems`의 `products` 컨테이너 테스트를 유지한다**

- [ ] **Step 3: 장바구니 계약 테스트를 실행한다**

Run:

```bash
node --experimental-strip-types --test lib/cart.test.ts
```

Expected: 모든 장바구니 fixture PASS.

---

### Task 7: `X-User-Role` 비의존성과 오류 UX 검증

**Files:**

- Verify: `lib/auth.ts`
- Verify: `lib/orders.ts`
- Verify: `lib/cart.ts`
- Modify: `app/checkout/page.tsx`
- Modify: `lib/directRouting.test.ts`

**Interfaces:**

- Consumes: 사용자 access token
- Produces: Gateway가 인증 가능한 `Authorization: Bearer ...` 요청

- [ ] **Step 1: order-service API 모듈에서 `X-User-Role`을 직접 설정하는 코드가 없는지 확인한다**

Run:

```bash
rg -n "X-User-Role" lib/orders.ts lib/cart.ts lib/payments.ts app/admin/orders/page.tsx
```

Expected: 검색 결과 없음.

- [ ] **Step 2: 정상 order-service 요청은 Axios 인증 인터셉터가 Bearer token만 추가하게 유지한다**

`directRoutingHeaders`는 다른 서비스의 로컬 개발 지원용이며 production에서는 항상 비활성화된다. order-service의 정상 Gateway 계약은 이 helper의 역할 헤더에 의존하지 않는다.

- [ ] **Step 3: 체크아웃 오류 메시지를 상태 코드별로 구분한다**

```ts
const status = (e as { response?: { status?: number } }).response?.status
const fallback = status === 503
  ? '주문 서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  : '주문 요청을 처리하지 못했습니다.'
```

- [ ] **Step 4: 인증·라우팅 회귀 테스트를 실행한다**

Run:

```bash
node --experimental-strip-types --test lib/directRouting.test.ts
```

Expected: production에서 direct routing 헤더가 생성되지 않고 일반 order URL에 내부 헤더가 추가되지 않음.

---

### Task 8: FE 전체 검증과 커밋

**Files:**

- Verify: 모든 변경 파일

**Interfaces:**

- Consumes: 배포된 order-service v2
- Produces: 장바구니부터 콘텐츠 열람까지 동작하는 FE

- [ ] **Step 1: 단위 테스트를 실행한다**

```bash
node --experimental-strip-types --test \
  lib/orders.test.ts \
  lib/orderAdapters.test.ts \
  lib/adminOrderAdapters.test.ts \
  lib/paymentAdapters.test.ts \
  lib/cart.test.ts \
  lib/directRouting.test.ts
```

Expected: 모든 테스트 PASS.

- [ ] **Step 2: 정적 검사와 프로덕션 빌드를 실행한다**

```bash
npm run lint
npm run build
```

Expected: lint error 0, Next.js production build 성공.

- [ ] **Step 3: staging E2E를 실행한다**

검증 시나리오:

1. 장바구니 조회·추가·개별 삭제
2. 단건 주문과 장바구니 다건 주문 생성
3. Toss 결제 승인
4. 마이페이지 주문·결제 내역 조회
5. 콘텐츠 열람과 다운로드 확정
6. 관리자 주문 목록에서 다중 판매자 표시
7. `X-User-Role` 없이 위 요청이 성공하는지 확인
8. order-service 중단 시 checkout에 503 안내가 표시되는지 확인

- [ ] **Step 4: 변경 파일만 커밋한다**

```bash
git add \
  types/api/orders.ts \
  lib/orders.ts lib/orders.test.ts \
  lib/orderAdapters.ts lib/orderAdapters.test.ts \
  lib/adminOrderAdapters.ts lib/adminOrderAdapters.test.ts \
  lib/payments.ts lib/paymentAdapters.ts lib/paymentAdapters.test.ts \
  lib/cart.ts lib/cart.test.ts \
  lib/directRouting.test.ts \
  components/ui/PaymentTable.tsx \
  app/checkout/page.tsx app/mypage/page.tsx \
  'app/detail/[id]/page.tsx' 'app/reader/[id]/page.tsx' \
  app/admin/orders/page.tsx
git commit -m "feat: migrate order clients to v2 contract"
```

---

## 4. FE 완료 조건

- [ ] order-service 요청 URL에 `/api/v1`이 없다.
- [ ] 주문 생성 본문에 `productTitle`이 포함된다.
- [ ] 주문 ID를 `data.order.orderId`에서 읽는다.
- [ ] 주문 목록의 `orderProductStatus`, `downloaded`, `isRefundable` 값이 구매·환불 UI에 반영된다.
- [ ] 관리자 주문에서 여러 판매자가 올바르게 요약된다.
- [ ] 결제 내역은 Payment Service에서 조회되고 주문 단위로 한 행씩 표시된다.
- [ ] 환불 요청은 `/api/v2/orders/refunds`에 `paymentId + orderProductIds`를 보내며 202를 접수 상태로 처리한다.
- [ ] FE order-service API 코드가 `X-User-Role`을 생성하거나 요구하지 않는다.
- [ ] 장바구니·주문·결제·다운로드 E2E가 통과한다.
- [ ] lint, 단위 테스트, production build가 모두 통과한다.
