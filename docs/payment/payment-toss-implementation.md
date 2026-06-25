# 토스페이먼츠 결제 연동 구현 레퍼런스

> 브랜치: `feat/payment-api-01`
> SDK: `@tosspayments/tosspayments-sdk` v2.7.1
> 연동 방식: 주문 생성 → Toss 결제창 → 결제 확인 (2-step)

---

## 1. 결제 플로우

```
[/checkout] 결제하기 클릭
    ↓
POST /api/v1/orders
{ productId } 또는 { productIds }
    ↓ { orderId }
payment.requestPayment() — Toss 결제창 팝업
         ↙ 성공                       ↘ 실패(취소/카드 거절)
/checkout/success                 /checkout/fail
?paymentKey=...                   ?code=...
&orderId=...                      &message=...
&amount=...
    ↓
POST /api/v1/payments/confirm
{ paymentKey, orderId, amount }
    ↙ 성공          ↘ 실패(PAY002/PAY003/V001)
/mypage?tab=purchased   에러 메시지 인라인 표시
```

**설계 결정 — confirm 실패는 `/checkout/fail`로 보내지 않는다:**
- PAY002(이미 결제됨)는 실제로 결제가 완료된 상태일 수 있다.
  이 경우 "실패" 화면을 보여주면 사용자가 혼란을 겪는다.
- 따라서 confirm 실패는 `/checkout/success` 페이지 안에서 인라인으로 처리하고,
  `/checkout/fail`은 Toss PG 수준의 실패(사용자 취소, 카드 거절)만 담당한다.

---

## 2. 구현 파일 설명

### `lib/payments.ts` — API 함수 레이어

```typescript
// 단건 / 장바구니 타입을 유니온으로 명시
type CreateOrderSingle = { productId: string }
type CreateOrderCart   = { productIds: string[] }

export async function createOrder(
  params: CreateOrderSingle | CreateOrderCart
): Promise<{ orderId: string }>

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number           // 반드시 number — string이면 Toss SDK에서 에러 발생
  _productIds?: string[]   // MSW 전용 (아래 'MSW 주의사항' 참고)
}): Promise<{ paymentId: string }>
```

**인증 처리:**
두 함수 모두 `lib/auth.ts`의 `api` 인스턴스를 사용한다.
`api`의 요청 인터셉터가 `useAuthStore.getState().token`을 읽어
`Authorization: Bearer {token}` 헤더를 자동으로 첨부하므로 별도 처리가 필요 없다.

**`_productIds` 파라미터:**
Toss 결제창은 팝업(별도 창)으로 열린다.
팝업에서 열린 `/checkout/success` 페이지는 원래 탭의 `sessionStorage`를 읽을 수 없다.
이를 대응하기 위해 checkout 페이지에서 `localStorage`에 `{ orderId, productIds }`를 저장하고,
success 페이지에서 읽어 confirm 요청에 함께 전달한다.
실제 백엔드는 `orderId`로 자체 DB를 조회하므로 이 필드를 무시한다.
MSW 핸들러는 이 값으로 `MOCK_ORDERS`를 복원한다.

---

### `app/checkout/page.tsx` — 결제 확인 / 요청 페이지

**handleOrder 핵심 흐름:**

```typescript
const handleOrder = async () => {
  // 1. 단건 / 장바구니 분기
  const orderParams = isSingle
    ? { productId: items[0].id }
    : { productIds: items.map((i) => i.id) };

  // 2. 주문 생성 → orderId 수령
  const { orderId } = await createOrder(orderParams);

  // 3. MSW 팝업 격리 대비: localStorage에 보존
  //    성공 페이지가 팝업에서 열려도 localStorage는 같은 origin 내 공유됨
  localStorage.setItem('_mock_pending_order',
    JSON.stringify({ orderId, productIds: items.map((i) => i.id) }));

  // 4. 장바구니 모드라면 장바구니 초기화
  if (!isSingle) clearCart();

  // 5. Toss SDK 초기화
  const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
  const payment = tossPayments.payment({ customerKey: user.id }); // user.id: Zustand

  // 6. 결제창 호출 — 이 이후 코드는 실행되지 않음 (브라우저가 리다이렉트)
  const orderName = isSingle
    ? items[0].title
    : `${items[0].title} 외 ${items.length - 1}건`;

  await payment.requestPayment({
    method: 'CARD',
    amount: { currency: 'KRW', value: total },
    orderId,
    orderName,
    successUrl: `${window.location.origin}/checkout/success`,
    failUrl:    `${window.location.origin}/checkout/fail`,
  });
};
```

**구조 특이사항:**
- `useSearchParams`를 사용하므로 `CheckoutContent`를 `Suspense`로 래핑
- `?id=` 쿼리 파라미터가 있으면 단건, 없으면 장바구니 모드
- 에러 발생 시 `setError`로 인라인 표시 (페이지 이동 없음)

---

### `app/checkout/success/page.tsx` — 결제 성공 콜백

Toss가 성공 후 리다이렉트하는 페이지. `confirmPayment`를 호출하고 결과에 따라 분기한다.

**상태 머신:**

```typescript
type ConfirmState =
  | { status: 'loading' }            // 초기값 — confirm 호출 중
  | { status: 'success' }            // confirm 성공 → /mypage 리다이렉트
  | { status: 'pay002'; message: string }  // 이미 결제된 주문 → [마이페이지로]
  | { status: 'error'; message: string }   // PG 오류 / 검증 실패 → [이전 페이지로]
```

**두 개의 useEffect 역할:**

```typescript
// Effect 1: confirm 호출 (마운트 1회)
useEffect(() => {
  if (!paymentKey || !orderId || !amount) {
    // amount === 0이면 !amount가 true → 무료 상품은 이 경로로 빠짐
    setState({ status: 'error', message: '잘못된 결제 정보입니다.' });
    return;
  }

  // localStorage에서 MSW용 productIds 복원
  const saved = localStorage.getItem('_mock_pending_order');
  const _productIds = saved ? JSON.parse(saved).productIds : undefined;
  localStorage.removeItem('_mock_pending_order'); // 사용 후 즉시 정리

  confirmPayment({ paymentKey, orderId, amount, _productIds })
    .then(() => setState({ status: 'success' }))
    .catch((e) => {
      const code = e?.response?.data?.code;
      if (code === 'PAY002') {
        setState({ status: 'pay002', message: e.response.data.message });
      } else {
        setState({ status: 'error', message: e?.response?.data?.message ?? '결제 확인 중 오류가 발생했습니다.' });
      }
    });
}, []);

// Effect 2: success 상태가 되면 마이페이지로 이동 (클라이언트 사이드 이동)
useEffect(() => {
  if (state.status === 'success') {
    router.replace('/mypage?tab=purchased');
  }
}, [state, router]);
```

**주의:** `amount === 0`이면 `!amount`가 `true`가 된다.
무료 상품은 Toss 결제창을 거치지 않는 별도 처리가 필요하다.

---

### `app/checkout/fail/page.tsx` — 결제 실패 콜백

Toss PG 수준의 실패(사용자 취소, 카드 거절 등)를 담당한다.
confirm API 오류(PAY002/PAY003/V001)는 이 페이지가 아닌 **success 페이지**에서 처리한다.

```typescript
// Toss가 failUrl로 전달하는 파라미터
const code    = searchParams.get('code');    // e.g. 'PAY_PROCESS_CANCELED'
const message = searchParams.get('message'); // e.g. '결제를 취소하였습니다.'

// 취소와 그 외 실패를 구분
const description = code === 'PAY_PROCESS_CANCELED'
  ? '결제를 취소했어요.'
  : message;
```

[다시 시도] 버튼 → `router.back()`

---

## 3. MSW 핸들러 변경 내용

### `mocks/handlers/orders.ts`

**Before (구 스펙):**
```typescript
// productIds 복수만 처리, 응답에 totalAmount, products 포함
const body = { productIds?: string[] };
return ok({ orderId, totalAmount, products }, 201);
```

**After (현재):**
```typescript
// 단건 / 장바구니 분기 처리
const body = { productId?: string; productIds?: string[] };
const ids = body.productId ? [body.productId] : (body.productIds ?? []);

// 응답: orderId만 반환 (백엔드 실제 스펙 반영)
return ok({ orderId }, 201);
```

---

### `mocks/handlers/payments.ts`

**Before (구 스펙):**
```typescript
// 이전: productIds를 직접 받아 즉시 결제 처리 (Toss PG 없는 직결 방식)
const body = { productIds?: string[] };
return ok({ paymentId, orderId, totalAmount, status: 'paid' }, 201);
```

**After (현재):**
```typescript
const body = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  _productIds?: string[]; // MSW 전용
};

// 에러 시뮬레이션 (orderId prefix 규칙)
if (orderId.startsWith('sim-pay002')) return err('PAY002', '이미 결제된 주문입니다.', 400);
if (orderId.startsWith('sim-pay003')) return err('PAY003', 'PG사 처리 중 오류가 발생했습니다.', 400);

// MOCK_ORDERS 복원 (SW 재시작 또는 팝업 격리로 상태가 소실된 경우)
if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
const alreadyExists = MOCK_ORDERS[userId].some(o => o.orderId === orderId);
if (!alreadyExists && _productIds?.length) {
  _productIds.forEach(productId => {
    MOCK_ORDERS[userId].push({ orderId, productId, purchasedAt: now });
  });
}

return ok({ paymentId }, 201); // paymentId만 반환
```

---

## 4. API 스펙

### POST /api/v1/orders

| | 단건 | 장바구니 |
|--|------|---------|
| Request Body | `{ "productId": "..." }` | `{ "productIds": ["...", "..."] }` |
| Response | `{ "success": true, "data": { "orderId": "..." }, "message": "success" }` | ← 동일 |

### POST /api/v1/payments/confirm

**Request:**
```json
{ "paymentKey": "...", "orderId": "...", "amount": 15000 }
```

**성공 Response:**
```json
{ "success": true, "data": { "paymentId": "550e8400-..." }, "message": "success" }
```

**실패 Response:**
```json
{ "success": false, "data": null, "message": "...", "code": "PAY002" }
```

### 에러 코드 처리

| 코드 | 의미 | 처리 위치 | UI |
|------|------|----------|----|
| `PAY002` | 이미 결제된 주문 | success 페이지 인라인 | "마이페이지에서 확인해보세요" + [마이페이지로] 버튼 |
| `PAY003` | PG사 처리 오류 | success 페이지 인라인 | 에러 메시지 + [이전 페이지로] 버튼 |
| `V001` | 검증 오류 (버그) | success 페이지 인라인 | 에러 메시지 + [이전 페이지로] 버튼 |

---

## 5. 환경 변수

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...   # Toss 개발자 콘솔에서 발급
```

---

## 6. 테스트 가이드

### Layer 1 — MSW 에러 케이스 시뮬레이션

브라우저에서 URL을 직접 입력해 에러 화면을 확인한다.

| 시나리오 | URL |
|---------|-----|
| PAY002 (이미 결제됨) | `http://localhost:3000/checkout/success?paymentKey=test&orderId=sim-pay002-xxx&amount=1000` |
| PAY003 (PG 오류) | `http://localhost:3000/checkout/success?paymentKey=test&orderId=sim-pay003-xxx&amount=1000` |

### Layer 2 — Toss 결제창 End-to-End

1. 로그인: `buyer@prompthub.kr` / `password123`
2. `http://localhost:3000/checkout?id=11111111-1111-1111-1111-111111111111` 접속
3. "결제하기" 클릭 → Toss 테스트 결제창에서 결제 완료
4. `/mypage?tab=purchased`로 자동 이동 → 구매 내역 확인

---

## 7. 주의사항

| 항목 | 내용 |
|------|------|
| SDK 실행 환경 | 브라우저 전용 → `'use client'` 필수. SSR 컨텍스트에서 호출 금지 |
| `amount` 타입 | `number` 타입 필수. `string` 전달 시 Toss SDK 에러 |
| `orderId` 형식 | 영문/숫자/`-`/`_`만 허용, 최대 64자 |
| `customerKey` | `useAuthStore.getState().user.id` 사용. 비로그인 상태면 결제 진입 전 차단 필요 |
| `Suspense` 래핑 | success, fail 페이지 모두 `useSearchParams` 사용 → `Suspense` 필수 |
| `localStorage` 키 | `_mock_pending_order` — MSW 전용. success 페이지 로드 시 즉시 삭제됨 |
| 무료 상품 처리 | `amount === 0`이면 success 페이지에서 `!amount` 조건으로 에러 처리됨. Toss SDK 우회 로직 필요 |

---

## 8. 커밋 히스토리

| 커밋 메시지 | 내용 |
|------------|------|
| `feat: @tosspayments/tosspayments-sdk v2.7.1 설치` | SDK 패키지 추가 |
| `feat: lib/payments.ts — 주문 생성 / 결제 확인 API 레이어 추가` | createOrder, confirmPayment 함수 |
| `feat: checkout — handleOrder를 토스 결제창 연동으로 교체` | 결제 요청 플로우 구현 |
| `feat: checkout/success, checkout/fail 페이지 추가` | 결제 결과 처리 페이지 |
| `fix: MSW handlers — 주문/결제 확인 스펙 업데이트 및 에러 시뮬레이션 추가` | orders.ts, payments.ts 수정 |
| `fix: MSW SW 재시작 시 MOCK_ORDERS 소실 문제 해결 — sessionStorage 브릿지 추가` | 1차 수정 |
| `fix: MSW 주문 복원 브릿지를 sessionStorage → localStorage로 교체` | 팝업 격리 대응 최종 수정 |
