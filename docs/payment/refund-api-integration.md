# 환불 요청 API 연동 계획

## API 스펙 요약

### GET /api/v1/orders/payments — 결제 내역 목록 조회

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `size` | number | 20 | 페이지당 항목 수 |

**응답 예시**

```json
{
  "success": true,
  "data": [
    {
      "orderId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111",
      "paymentId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1234",
      "paymentStatus": "PAID",
      "isRefundable": true,
      "productType": "PROMPT",
      "title": "면접 답변 프롬프트 외 1건",
      "amount": 3800,
      "paidAt": "2026-06-18T10:45:00"
    }
  ],
  "message": "success",
  "meta": {
    "page": 1,
    "size": 20,
    "total": 15,
    "hasNext": false
  }
}
```

> 장바구니 다건 결제는 `paymentId` 단위로 1개 row만 반환한다. `title`은 첫 상품명 기준으로 `외 N건`을 붙이고, `amount`와 `meta.total`은 품목 수가 아니라 결제 건 기준이다. `orderProductId`는 1:1 매핑이 아니므로 제거되거나 optional/null일 수 있다.

**paymentStatus enum** (프론트에 반환되는 값만)

| 값 | 의미 |
|----|------|
| `PAID` | 결제 완료 |
| `REFUNDING` | 환불 처리 중 |
| `REFUNDED` | 환불 완료 |

**isRefundable**: `true`이면 환불 버튼 노출 가능. `PAID && isRefundable === true` 조건 모두 충족 시에만 환불 버튼 표시.

---

### POST /api/v1/payments/{paymentId}/refund — 환불 요청

**제약 조건**
- 요청 주체: `BUYER`, `SELLER`만 가능 (관리자 불가)
- 환불 가능 상태: `PAID`만 가능
- 전체 환불만 지원

**처리 흐름**
1. 202 반환 → Payment 상태 `PAID → REFUNDING` 전환
2. 이후 PG사 환불 완료 → `REFUNDING → REFUNDED`
3. PG 실패 시 → `REFUNDING → PAID` 복원 (클라이언트에 별도 알림 없음)

> 클라이언트는 202 수신 후 로컬 상태를 `REFUNDING`으로 업데이트한다.
> 실패 복원 여부는 다음 페이지 진입 시 API 재조회로 반영된다. (실시간 폴링 없음)

**응답**

| 상태 코드 | 설명 | 에러 코드 |
|---------|------|---------|
| `202` | 환불 요청 접수 완료 | — |
| `400` | 환불 불가 상태 (`PAID`가 아님) | `PAY004` |
| `401` | 토큰 만료 | `A003` |
| `403` | 권한 없음 (역할) | `A004` |
| `403` | 본인 결제 건이 아님 | `PAY006` |
| `404` | 결제 건 없음 | `PAY005` |

---

## 구현 계획

### Step 1 — `lib/payments.ts` 타입 및 함수 추가

```ts
export type PaymentStatus = 'PAID' | 'REFUNDING' | 'REFUNDED';

export interface PaymentItem {
  orderId: string;
  orderProductId?: string | null;
  paymentId: string;
  paymentStatus: PaymentStatus;
  isRefundable: boolean;
  productType: string;
  title: string;
  amount: number;
  paidAt: string;
}

export interface PaymentMeta {
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}

// GET /api/v1/orders/payments
export async function getPayments(page = 1, size = 20): Promise<{ data: PaymentItem[]; meta: PaymentMeta }>

// POST /api/v1/payments/{paymentId}/refund
export async function requestRefund(paymentId: string): Promise<void>
```

---

### Step 2 — MSW Mock 핸들러 추가 (`mocks/handlers/`)

추가할 핸들러:
- `GET /api/v1/orders/payments` — 결제 목록 반환, `meta.hasNext` 포함
- `POST /api/v1/payments/:paymentId/refund` — 202 반환 + 해당 건 `paymentStatus → REFUNDING`

기존 `PUT /api/v1/orders/:id/refund` (admin 전용)는 수정하지 않는다.

---

### Step 3 — `components/ui/PaymentTable.tsx` 타입 교체

**Payment 인터페이스 변경**

```ts
// Before
interface Payment {
  id: string;
  title: string;
  amount: number;
  status: 'paid' | 'requested' | 'refunded';
  paidAt: string;
}

// After
interface Payment {
  paymentId: string;
  title: string;
  amount: number;
  paymentStatus: 'PAID' | 'REFUNDING' | 'REFUNDED';
  isRefundable: boolean;
  paidAt: string;
}
```

**STATUS_MAP 변경**

```ts
const STATUS_MAP = {
  PAID:      { label: '결제완료',      color: 'var(--ph-primary)',  bg: 'var(--ph-secondary)' },
  REFUNDING: { label: '환불 신청 중', color: 'var(--ph-red)',      bg: 'rgba(217,45,32,0.10)' },
  REFUNDED:  { label: '환불 완료',    color: 'var(--ph-gray-600)', bg: 'var(--ph-gray-100)' },
};
```

**환불 버튼 노출 조건**

```ts
const canRefund = paymentStatus === 'PAID' && isRefundable;
```

---

### Step 4 — `app/mypage/page.tsx` 수정

**현재 문제**
- `GET /api/v1/orders` 하나로 구매 탭 + 결제 탭 데이터를 동시에 처리하고 있음
- `requestRefund(id)` 함수가 로컬 state만 업데이트하고 실제 API 호출 없음

**변경 사항**

1. **결제 탭 state 분리**
   - `payments: PaymentItem[]` — 결제 내역 (구매 탭의 `purchased`와 별도)
   - `paymentsPage: number` — 현재 페이지
   - `paymentsHasNext: boolean` — 다음 페이지 존재 여부
   - `loadingPayments: boolean`

2. **데이터 페칭 분리**
   - `purchased` — 기존 `GET /api/v1/orders` 유지 (구매 탭)
   - `payments` — `GET /api/v1/orders/payments` 신규 호출 (결제 탭)

3. **환불 요청 연동**
   ```ts
   const handleRefund = async (paymentId: string) => {
     await requestRefund(paymentId);  // POST /api/v1/payments/{paymentId}/refund
     // 202 성공 시 로컬 상태 업데이트
     setPayments(prev =>
       prev.map(p => p.paymentId === paymentId ? { ...p, paymentStatus: 'REFUNDING', isRefundable: false } : p)
     );
   };
   ```

4. **에러 처리**

   | 에러 코드 | 표시 메시지 |
   |---------|------------|
   | `PAY004` (400) | "이미 환불 처리된 결제예요" |
   | `PAY006` (403) | "본인 결제 건이 아니에요" |
   | `PAY005` (404) | "결제 정보를 찾을 수 없어요" |
   | 기타 | "환불 신청에 실패했어요. 다시 시도해주세요" |

5. **페이지네이션 — "더 보기" 방식**
   - `hasNext === true`일 때 목록 하단에 "더 보기" 버튼 노출
   - 클릭 시 `page + 1` 호출 후 기존 목록에 append

---

## 작업 순서

| 순서 | 파일 | 작업 |
|------|------|------|
| 1 | `lib/payments.ts` | `PaymentItem`, `PaymentMeta` 타입 추가, `getPayments()`, `requestRefund()` 함수 추가 |
| 2 | `mocks/handlers/` | `GET /api/v1/orders/payments`, `POST /api/v1/payments/:paymentId/refund` mock 추가 |
| 3 | `components/ui/PaymentTable.tsx` | Payment 인터페이스 교체, STATUS_MAP 수정, canRefund 조건 수정 |
| 4 | `app/mypage/page.tsx` | payments state 분리, API 연동, 환불 호출 교체, 페이지네이션 추가 |

---

## 테스트 계획

### Claude가 수행하는 테스트

구현 완료 후 자동으로 실행. 브라우저 없이 코드 레벨에서 검증 가능한 항목.

| # | 항목 | 방법 |
|---|------|------|
| C1 | TypeScript 컴파일 오류 없음 | `tsc --noEmit` 실행 후 에러 0개 확인 |
| C2 | `getPayments()` 함수 시그니처 | 반환 타입이 `{ data: PaymentItem[]; meta: PaymentMeta }` 인지 확인 |
| C3 | `requestRefund()` 함수 시그니처 | `paymentId: string` 인자, `Promise<void>` 반환 확인 |
| C4 | MSW mock 응답 구조 | `GET /api/v1/orders/payments` 핸들러가 `data[]` + `meta` 구조를 반환하는지 코드 확인 |
| C5 | MSW mock 상태 전환 | `POST /api/v1/payments/:paymentId/refund` 핸들러가 202 반환하는지 코드 확인 |
| C6 | `PaymentTable` 타입 일치 | `mypage/page.tsx`에서 `payments` 데이터를 `PaymentTable`에 넘길 때 타입 오류 없음 |
| C7 | 환불 버튼 노출 조건 | `canRefund = paymentStatus === 'PAID' && isRefundable` 로직이 코드에 반영됐는지 확인 |

---

### 사용자가 직접 수행하는 테스트

브라우저에서 실제 UI와 상호작용이 필요한 항목. MSW mock 환경(`npm run dev`) 기준.

#### T1. 결제 내역 목록 조회

| 시나리오 | 확인 방법 | 기대 결과 |
|---------|----------|---------|
| 정상 조회 | 마이페이지 → 결제 내역 탭 진입 | 로딩 스켈레톤 표시 후 결제 항목 목록 렌더링 |
| 빈 목록 | — | EmptyState 표시 ("아직 결제 내역이 없어요") |
| 구매 탭과 데이터 분리 | 구매 탭 → 결제 탭 전환 후 브라우저 Network 탭 확인 | `/orders`와 `/orders/payments` 두 API가 각각 호출됨 |

#### T2. paymentStatus별 배지 렌더링

mock 데이터에 4가지 상태를 모두 포함시켜 한 화면에서 확인.

| paymentStatus | isRefundable | 기대 UI |
|--------------|---------|--------|
| `PAID` | `true` | "결제완료" 배지 + "환불 신청" 버튼 노출 |
| `PAID` | `false` | "결제완료" 배지 + 버튼 없음 |
| `REFUNDING` | — | "환불 신청 중" 배지 (빨간 계열) + 버튼 없음 |
| `REFUNDED` | — | "환불 완료" 배지 (회색 계열) + 버튼 없음 |

#### T3. 환불 요청 플로우

| 시나리오 | 확인 방법 | 기대 결과 |
|---------|----------|---------|
| 정상 환불 신청 | `PAID + isRefundable:true` 항목 → "환불 신청" 클릭 → 확인 모달 "확인" | 해당 항목 즉시 "환불 신청 중" 배지로 전환, 버튼 사라짐 |
| 모달 취소 | 확인 모달 "취소" 클릭 | 상태 변화 없음 |
| 환불 후 탭 재진입 | 환불 신청 후 다른 탭 이동 → 결제 탭 재진입 | API 재호출, `REFUNDING` 상태 유지 표시 |

#### T4. 에러 처리

MSW 핸들러를 임시로 수정해 에러 응답을 반환하도록 설정 후 확인.

| 에러 코드 | 기대 토스트 메시지 |
|---------|----------------|
| `400 PAY004` | "이미 환불 처리된 결제예요" |
| `403 PAY006` | "본인 결제 건이 아니에요" |
| `404 PAY005` | "결제 정보를 찾을 수 없어요" |
| 기타 (`500`) | "환불 신청에 실패했어요. 다시 시도해주세요" |

에러 발생 후 해당 항목의 상태가 변경되지 않았는지도 확인.

#### T5. 페이지네이션

| 시나리오 | 기대 결과 |
|---------|---------|
| `hasNext: true` | 목록 하단 "더 보기" 버튼 노출 |
| "더 보기" 클릭 | 기존 목록 아래로 다음 페이지 항목 append |
| `hasNext: false` (마지막 페이지) | "더 보기" 버튼 사라짐 |

#### T6. 회귀 확인

| 항목 | 기대 결과 |
|------|---------|
| 구매한 프롬프트 탭 | 기존과 동일하게 정상 표시 |
| 구매 탭 잠금 오버레이 | `REFUNDING/REFUNDED` 항목에 열람 잠금 오버레이 표시 |
| 찜 탭 | 영향 없음 |
