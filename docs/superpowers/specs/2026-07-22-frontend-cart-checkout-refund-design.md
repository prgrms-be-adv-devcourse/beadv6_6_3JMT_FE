# Frontend Cart, Checkout, and Refund Design

## Goal

프런트엔드만 수정해 장바구니 빈 상태를 안정적으로 처리하고, 유료 주문 생성 전에 Toss SDK 준비 상태를 검증하며, 환불 요청을 현재 주문 API 계약에 맞춘다.

## Scope

- 장바구니 API 경로는 `/api/v2/cart`와 `/api/v2/cart/{cartProductId}`를 유지한다.
- 장바구니 조회의 404 응답은 빈 장바구니 `[]`로 정규화한다.
- `payment-ready` API는 추가하거나 호출하지 않는다.
- 유료 상품은 Toss 클라이언트 키와 SDK를 먼저 확인한 뒤 주문을 생성한다.
- 무료 상품은 Toss SDK 없이 기존처럼 주문을 생성하고 완료 화면으로 이동한다.
- 환불은 `POST /api/v2/orders/{orderId}/refund`와 `{ orderProductIds }` 본문을 사용한다.
- 주문 및 주문상품 상태 타입에 `REFUND_REQUESTED`를 추가한다.

## Design

### Cart

`lib/cart.ts`의 경로는 변경하지 않는다. Axios 오류의 상태 코드를 판별하는 작은 순수 함수를 두고, 장바구니 조회가 404이면 빈 배열을 반환한다. 그 외 오류는 기존처럼 호출자에게 전달한다.

### Checkout

Toss SDK 준비 로직을 테스트 가능한 순수 오케스트레이션 함수로 분리한다. 기존 SDK 인스턴스가 있으면 재사용하고, 없으면 공개 클라이언트 키를 검증한 뒤 SDK를 로드한다. 키 누락과 SDK 로드 실패는 서로 다른 사용자 메시지로 유지한다.

유료 주문 흐름은 `SDK 준비 → 주문 생성 → Toss 결제창 호출` 순서다. 무료 주문은 `주문 생성 → 구매 완료 화면 이동` 순서를 유지한다. `payment-ready` 요청은 존재하지 않는다.

### Refund

환불 API 함수는 `orderId`와 `orderProductIds`를 입력으로 받는다. URL의 주문 ID와 본문의 주문상품 ID만 전송하며 `paymentId`는 전송하지 않는다. 마이페이지는 선택한 결제 항목의 `orderId`를 전달한다.

### Types

실제 환불 처리 중 상태를 표현하도록 `OrderStatus`와 `OrderProductStatus`에 `REFUND_REQUESTED`를 추가한다.

## Error Handling

- 장바구니 조회 404: `[]`
- Toss 키 누락: `결제 설정이 완료되지 않았습니다.`
- Toss SDK 로드 실패: `결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`
- 주문 API 실패: 기존 백엔드 응답 메시지 처리 유지
- 환불 실패: 기존 HTTP 상태별 사용자 메시지 유지

## Testing

- 장바구니 404 판별 함수의 404/비404 테스트
- Toss 키 누락 시 SDK와 주문 생성이 호출되지 않는 테스트
- Toss SDK 로드 실패 시 주문 생성이 호출되지 않는 테스트
- Toss SDK 준비 후에만 주문 생성이 호출되는 순서 테스트
- 환불 경로와 본문에 `paymentId`가 포함되지 않는 계약 테스트
- 관련 Node 테스트, ESLint, TypeScript 빌드 검증

## Non-goals

- 백엔드 Controller, Gateway 또는 배포 설정 수정
- `payment-ready` API 연동
- Toss 클라이언트 키 하드코딩
- 주문·결제 도메인의 구조 변경
