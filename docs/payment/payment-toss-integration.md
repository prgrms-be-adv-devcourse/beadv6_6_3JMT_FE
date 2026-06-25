# 토스페이먼츠 결제 연동 계획

## 확정된 스펙 요약

| 항목 | 내용 |
|------|------|
| SDK | `@tosspayments/tosspayments-sdk` v2 |
| 주문 생성 | `POST /api/v1/orders` |
| 결제 확인 | `POST /api/v1/payments/confirm` |
| 성공 리다이렉트 | `/mypage?tab=purchased` |
| 실패 페이지 | `/checkout/fail` (별도 페이지) |

---

## 전체 결제 플로우

```
[/checkout] 결제하기 클릭
    ↓
POST /api/v1/orders { productId } or { productIds }
    ↓ orderId 수령
토스 결제창 호출 (orderId, amount, customerKey)
    ↓ 사용자 결제
         ↙ 성공                    ↘ 실패
/checkout/success              /checkout/fail
?paymentKey=...                ?code=...
&orderId=...                   &message=...
&amount=...                    &orderId=...
    ↓
POST /api/v1/payments/confirm
{ paymentKey, orderId, amount }
    ↓ 성공
/mypage?tab=purchased
```

---

## API 스펙

### 주문 생성

```
POST /api/v1/orders
```

단건 결제:
```json
{ "productId": "p1b55b60-..." }
```

장바구니 결제:
```json
{ "productIds": ["p1b55b60-...", "p2b55b60-..."] }
```

Response:
```json
{ "success": true, "data": { "orderId": "9f1c2a7e-..." }, "message": "success" }
```

### 결제 확인

```
POST /api/v1/payments/confirm
```

Request:
```json
{ "paymentKey": "...", "orderId": "...", "amount": 15000 }
```

Response:
```json
{ "success": true, "data": { "paymentId": "550e8400-..." }, "message": "success" }
```

> `paymentId`는 현재 사용처 없음 — 리다이렉트만 수행. 추후 영수증 조회 등에 활용 가능.

실패 응답 구조:
```json
{ "success": false, "data": null, "message": "...", "code": "PAY002" }
```

| 코드 | 메시지 | 처리 |
|------|--------|------|
| `PAY002` | 이미 결제된 주문 | "마이페이지에서 확인해보세요" + [마이페이지로] 버튼 |
| `PAY003` | PG사 처리 오류 | 에러 메시지 표시 + [이전 페이지로] 버튼 |
| `V001` | 검증 오류 (버그) | 에러 메시지 표시 + [이전 페이지로] 버튼 |

> confirm 실패는 `/checkout/fail`로 보내지 않고 `/checkout/success` 페이지 내에서 인라인으로 처리.
> PAY002는 실제 결제가 완료된 상태일 수 있어 "실패" 화면을 보여주면 혼란을 줄 수 있음.

---

## 구현 작업 목록

### Step 1 — 사전 준비
- [ ] `npm install @tosspayments/tosspayments-sdk`
- [ ] `.env.local`에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` 추가

### Step 2 — API 레이어 (`lib/payments.ts` 신규)
- [ ] `createOrder(params)` — 단건/장바구니 분기 처리
- [ ] `confirmPayment(params)` — 결제 확인 API 호출
- [ ] 모든 요청은 `lib/auth.ts`의 `api` 인스턴스 사용 (자동으로 `Authorization: Bearer {token}` 헤더 첨부)

### Step 3 — `/checkout` 수정
- [ ] `handleOrder` 교체:
  1. `createOrder` 호출 → `orderId` 수령
  2. 토스 결제창 호출 (`requestPayment`)
  - `customerKey`: `useAuthStore.getState().user.id`
  - `orderName`: 단건은 상품명, 장바구니는 `"${items[0].title} 외 N건"`
  - `successUrl`: `${window.location.origin}/checkout/success`
  - `failUrl`: `${window.location.origin}/checkout/fail`
- [ ] 기존 `done` / `loading` 상태 단순화 (결제 결과 처리는 success/fail 페이지로 이전)

### Step 4 — `/checkout/success` 신규
- `useSearchParams`로 `paymentKey`, `orderId`, `amount` 읽기
- `confirmPayment` 호출
- 성공 → `router.replace('/mypage?tab=purchased')`
- 에러 → 에러 메시지 표시 + "다시 시도" 버튼 (`router.back()`)
- `Suspense` 래핑 필수 (`useSearchParams` 사용)

### Step 5 — `/checkout/fail` 신규
- `useSearchParams`로 `code`, `message`, `orderId` 읽기
- 에러 코드별 안내 메시지 표시
- "다시 시도" 버튼 → `router.back()`
- `Suspense` 래핑 필수

### Step 6 — MSW 핸들러 수정
- `mocks/handlers/orders.ts`
  - `POST /api/v1/orders`: `{ productId }` 단건 케이스 추가 (현재 `productIds` 복수만 처리)
  - Response 포맷을 실제 스펙에 맞게 수정: `{ orderId }` 만 반환
- `mocks/handlers/payments.ts`
  - `POST /api/v1/payments/confirm`: body를 `{ paymentKey, orderId, amount }`로 변경
  - Response 포맷 수정: `{ paymentId }` 만 반환
  - PAY002 시뮬레이션 핸들러 추가 (테스트용 orderId 규칙으로 강제 에러 반환)
  - PAY003 시뮬레이션 핸들러 추가

---

## 파일 변경 범위

| 파일 | 작업 |
|------|------|
| `lib/payments.ts` | 신규 — 주문 생성 / 결제 확인 API 함수 |
| `app/checkout/page.tsx` | 수정 — handleOrder 교체 |
| `app/checkout/success/page.tsx` | 신규 — 결제 성공 처리 |
| `app/checkout/fail/page.tsx` | 신규 — 결제 실패 안내 |
| `mocks/handlers/orders.ts` | 수정 — 단건 케이스 추가, response 포맷 수정 |
| `mocks/handlers/payments.ts` | 수정 — 신규 스펙 반영, 에러 시뮬레이션 추가 |
| `.env.local` | 수정 — NEXT_PUBLIC_TOSS_CLIENT_KEY 추가 |

---

## 주의사항

- 토스 SDK는 브라우저 전용 — `'use client'` 필수, SSR에서 호출하면 안 됨
- `amount`는 `number` 타입으로 전달 (string이면 토스에서 에러)
- `orderId`는 영문/숫자/특수문자(`-`, `_`)만 허용, 최대 64자
- `customerKey`는 고객 식별자로 `user.id` 사용 (비로그인 상태면 결제 진입 전 차단)
- success/fail 페이지는 모두 `Suspense`로 래핑 (`useSearchParams` 사용 필수)
