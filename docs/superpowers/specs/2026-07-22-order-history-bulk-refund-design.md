# 주문 내역 상품 선택 환불 UI 설계

## 배경

마이페이지의 주문 내역은 현재 주문 단위 아코디언과 상품별 환불 버튼을 제공한다. 새 목업 `order_list_1.html`은 상품별 버튼 대신 환불 가능한 상품을 체크박스로 선택하고, 주문 하단에서 선택 개수와 금액 합계를 확인한 뒤 한 번에 환불을 신청하는 흐름을 제시한다.

이 변경은 기존 결제 내역과 주문상품 목록을 조합하는 구조를 유지하면서, 화면 모델을 별도 순수 어댑터에서 만들고 상품 선택형 부분 환불을 지원한다.

## 목표

- 주문 행을 펼쳐 환불 가능한 상품을 하나 이상 선택할 수 있다.
- 선택한 상품의 개수와 결제 당시 금액 합계를 표시한다.
- 선택한 `orderProductIds`만 한 번의 환불 요청에 포함한다.
- 환불 불가, 진행 중, 완료 상품을 명확히 구분하고 선택하지 못하게 한다.
- 기존 로딩, 빈 상태, 페이지네이션, 확인 모달, 토스트 흐름을 유지한다.
- 결제 API 모델, 주문 API 모델, 화면 모델의 책임을 분리한다.

## 범위 밖

- 백엔드 저장소의 DTO와 비즈니스 로직 구현
- 환불 진행 상태 폴링 또는 실시간 이벤트 구독
- 마이페이지의 다른 탭이나 전체 레이아웃 개편
- 여러 주문에 속한 상품을 한 번에 환불하는 기능

## 선행 API 계약

`GET /api/v2/orders`의 주문상품 항목에 결제 당시 상품 금액을 필수 필드로 추가한다.

```ts
export interface OrderListItem {
  orderId: string
  orderProductId: string
  productId: string
  amount: number
  orderStatus: OrderStatus
  orderProductStatus: OrderProductStatus
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

`amount`는 현재 상품 가격이 아니라 주문 시 확정된 금액이다. 선택 금액 합계에는 이 값만 사용한다. 백엔드가 이 필드를 배포하기 전에는 새 UI의 금액 표시를 정확히 제공할 수 없으므로 프론트와 백엔드 배포 순서를 조율한다.

환불 접수 계약은 다음과 같이 고정한다.

```http
POST /api/v2/orders/refunds
Content-Type: application/json

{
  "paymentId": "payment-id",
  "orderProductIds": ["order-product-id-1", "order-product-id-2"]
}
```

성공 응답 `202 Accepted`는 환불 완료가 아니라 환불 신청 접수를 의미한다.

## 화면 모델과 어댑터

`lib/orderGrouping.ts`는 결제 목록과 주문상품 목록을 받아 주문 내역 화면 모델을 만드는 순수 함수만 담당한다.

```ts
interface OrderHistoryProduct {
  orderProductId: string
  productId: string
  title: string
  amount: number
  orderProductStatus: OrderProductStatus
  downloaded: boolean
  isRefundable: boolean
  selectable: boolean
}

interface OrderHistoryGroup {
  orderId: string
  paymentId: string
  paidAt: string
  amount: number
  paymentStatus: PaymentStatus
  items: OrderHistoryProduct[]
}
```

결합 규칙은 다음과 같다.

- 결제 목록의 순서를 유지해 페이지네이션 순서가 바뀌지 않게 한다.
- 같은 `orderId`의 주문상품을 해당 결제 아래에 배치한다.
- 주문 행 금액은 결제 API의 승인 금액을 사용한다.
- 상품 행과 선택 합계는 주문 API의 상품별 `amount`를 사용한다.
- 상품 선택 가능 여부는 `orderProductStatus === 'PAID' && isRefundable === true`일 때만 true다.
- 결제에 대응하는 주문상품이 없으면 주문 행은 표시하되 상세 상품과 환불 액션 바는 표시하지 않는다.

## 컴포넌트 책임

### `app/mypage/page.tsx`

- 결제 내역과 주문상품 목록을 조회한다.
- 순수 어댑터로 `OrderHistoryGroup[]`을 만든다.
- 환불 대상 payload와 요청 중 상태를 관리한다.
- 확인 모달을 열고 환불 API를 호출한다.
- 성공 시 주문상품, 결제, 구매 탭의 로컬 상태를 동기화한다.
- HTTP 상태에 맞는 오류 토스트를 표시한다.

### `components/ui/OrderList.tsx`

- `OrderHistoryGroup[]`을 렌더링한다.
- 한 번에 하나의 주문만 펼치는 상태를 관리한다.
- 주문별로 선택된 `orderProductId` 집합을 관리한다.
- 선택 개수와 상품 금액 합계를 계산해 액션 바에 표시한다.
- 환불 버튼 클릭 시 `paymentId`, `orderId`, `orderProductIds`를 상위로 전달한다.
- 새 화면 모델을 받을 때 더 이상 선택 가능하지 않은 상품 ID를 선택 집합에서 제거한다.
- 네트워크 호출과 서버 상태 갱신은 담당하지 않는다.

### `lib/payments.ts`와 `lib/refundContracts.ts`

- 환불 요청을 `/api/v2/orders/refunds`로 보낸다.
- 요청 본문을 `{ paymentId, orderProductIds }`로 직렬화한다.
- 화면 상태나 메시지는 알지 못한다.

## 상호작용

1. 주문 행을 클릭하거나 키보드로 활성화하면 상세 패널이 열린다.
2. 다른 주문을 열면 기존 주문은 닫히지만 주문별 선택은 유지된다.
3. 환불 가능한 상품만 체크박스를 선택할 수 있다.
4. 선택이 없으면 `환불할 상품을 선택하세요`를 표시하고 버튼을 비활성화한다.
5. 선택이 있으면 `{N}개 선택 · {합계 금액}`을 표시한다.
6. 환불 버튼을 누르면 기존 확인 모달에서 선택 개수와 합계를 안내한다.
7. 확인하면 `paymentId`와 선택한 `orderProductIds`를 전송한다.
8. 요청 중에는 해당 주문의 체크박스와 환불 버튼을 잠가 중복 요청을 막는다.
9. 성공하면 선택 상품을 `REFUND_REQUESTED`, `isRefundable: false`로 갱신하고 해당 주문의 선택을 해제한다.
10. 결제 상태는 즉시 `REFUNDING`으로 갱신해 주문 행에 `환불 신청 중`을 표시한다. 이후 재조회 결과에 따라 `PARTIAL_REFUNDED` 또는 `ALL_REFUNDED`를 표시한다.
11. 같은 주문에 남아 있는 `PAID && isRefundable` 상품은 계속 선택할 수 있다.
12. 구매한 프롬프트 탭에서도 선택한 주문상품에 대응하는 항목만 환불 신청 오버레이를 표시한다.

체크박스 클릭은 주문 행의 열기/닫기 동작을 발생시키지 않는다. 환불 실패 시 선택 상태를 보존해 사용자가 같은 대상으로 재시도할 수 있게 한다.

선택 상태는 `OrderList`가 소유하지만 성공 여부는 페이지가 소유한다. 성공 후 페이지가 갱신한 화면 모델에서 대상 상품의 `selectable`이 false가 되면 `OrderList`가 해당 ID를 선택 집합에서 제거한다. 실패하면 화면 모델이 바뀌지 않으므로 선택도 그대로 유지된다. 확인 모달에는 기존 `loading` 속성을 연결해 요청 중 확인·취소·바깥 영역 닫기를 차단한다.

## 상태 표시

주문 행은 결제 상태를 다음과 같이 표시한다.

| 결제 상태 | 표시 문구 |
| --- | --- |
| `PAID` | 결제완료 |
| `REFUNDING` | 환불 신청 중 |
| `PARTIAL_REFUNDED` | 부분 환불 |
| `ALL_REFUNDED` | 전체 환불 |

상품 행은 주문상품 상태를 다음과 같이 표시한다.

| 주문상품 상태 | 표시 문구 | 선택 |
| --- | --- | --- |
| `PAID` + `isRefundable: true` | 결제완료 | 가능 |
| `PAID` + `isRefundable: false` | 결제완료 | 불가 |
| `REFUND_REQUESTED` | 환불 신청 중 | 불가 |
| `REFUNDED` | 환불 완료 | 불가 |
| `PENDING` | 결제 대기 | 불가 |
| `FAILED` | 결제 실패 | 불가 |

## 오류와 비동기 상태

- `400`: `환불할 상품을 다시 확인해 주세요.`
- `403`: `본인이 구매한 상품만 환불할 수 있어요.`
- `404`: `주문 상품을 찾을 수 없어요.`
- `409`: `이미 다운로드했거나 환불할 수 없는 상품이에요.`
- 그 외: `환불 신청에 실패했어요. 다시 시도해주세요`

요청 실패 시 서버 상태를 낙관적으로 변경하지 않고 선택을 유지한다. 요청 성공 후에만 관련 로컬 상태를 갱신한다. 기존 주문 내역 로딩 스켈레톤, 빈 상태, 더 보기 버튼과 페이지네이션은 유지한다.

## UI와 접근성

- 목업의 5열 그리드, 상세 패널, 상태 배지, 체크박스, 하단 액션 바 구조를 기존 디자인 토큰으로 옮긴다.
- 주문 행은 `button` 또는 동등한 키보드 조작 요소로 만들고 `aria-expanded`와 상세 패널 연결 정보를 제공한다.
- 체크박스에는 상품명이 포함된 접근성 이름을 제공한다.
- 비활성 체크박스에는 다운로드됨, 환불 진행 중, 환불 완료 등 선택할 수 없는 이유를 접근 가능한 설명으로 제공한다.
- 요청 중 상태는 `aria-busy`와 비활성 컨트롤로 전달한다.
- 좁은 화면에서는 주문 목록 컨테이너만 가로 스크롤하고 표의 최소 너비를 유지한다.

## 테스트 계획

### 순수 함수 단위 테스트

- 결제와 같은 `orderId`의 주문상품이 한 그룹으로 결합되는지 확인한다.
- 결제 목록 순서와 상품 목록 순서가 유지되는지 확인한다.
- 주문 행 금액과 상품별 금액의 출처가 섞이지 않는지 확인한다.
- `PAID && isRefundable` 상품만 선택 가능한지 확인한다.
- 선택 상품 개수와 금액 합계를 정확히 계산하는지 확인한다.
- 대응 주문상품이 없는 결제가 안전한 빈 상세 그룹이 되는지 확인한다.
- 결제 상태와 주문상품 상태가 올바른 한글 문구로 매핑되는지 확인한다.
- 환불 성공 후 선택한 주문상품만 `REFUND_REQUESTED`로 바뀌는지 확인한다.

### 환불 계약 테스트

- 경로가 `/api/v2/orders/refunds`인지 확인한다.
- 본문이 `{ paymentId, orderProductIds }`인지 확인한다.
- 선택하지 않은 주문상품 ID가 본문에 포함되지 않는지 확인한다.

### 정적·빌드 검증

- 관련 Node 단위 테스트를 실행한다.
- `npm run lint`를 실행한다.
- `npm run build`를 실행한다.
- 마이페이지 주문 내역에서 펼침, 선택 유지, 합계, 요청 중 잠금, 성공·실패 상태를 직접 확인한다.

## 예상 변경 파일

- `types/api/orders.ts`
- `lib/orderGrouping.ts`
- `lib/orderGrouping.test.ts`
- `lib/refundContracts.ts`
- `lib/refundContracts.test.ts`
- `lib/payments.ts`
- `components/ui/OrderList.tsx`
- `app/mypage/page.tsx`
