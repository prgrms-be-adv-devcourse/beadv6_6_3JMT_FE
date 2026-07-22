# 주문 내역 상품 선택 환불 백엔드 변경 요구사항

## 1. 목적

마이페이지 주문 내역에서 구매자가 한 주문의 환불 가능한 상품을 선택하고, 선택한 상품만 한 번에 환불 신청할 수 있도록 백엔드 계약과 상태 처리를 보완한다.

프론트엔드는 다음 정보를 필요로 한다.

- 주문상품별 결제 당시 금액
- 주문상품별 환불 상태와 환불 가능 여부
- 주문과 연결된 결제 ID 및 결제 상태
- 선택한 주문상품 ID 목록을 받는 부분 환불 접수 API

## 2. 영향 서비스

| 서비스 | 변경 또는 확인 사항 |
| --- | --- |
| Order Service | 주문상품 금액 스냅샷 조회, 선택 환불 검증, 상태 변경, Outbox 저장 |
| Payment Service | 선택 상품 금액만 환불, 결제 상태 전이 및 결제 내역 상태 노출 |
| Gateway | 기존 `/api/v2/orders`, `/api/v2/orders/refunds`, `/api/v2/payments` 라우팅과 인증 헤더 전달 확인 |
| OpenAPI 문서 | 응답 필드, 요청 DTO, 상태 코드, enum 문서화 |

## 3. 필수 API 변경

### 3.1 주문 목록에 상품별 결제 금액 추가

```http
GET /api/v2/orders
Authorization: Bearer {accessToken}
```

각 주문상품 응답에 `amount`를 필수로 포함한다.

```json
{
  "success": true,
  "data": [
    {
      "orderId": "5ae4ad23-a910-4ad8-a406-ef8198682531",
      "orderProductId": "f7f8a8e9-bc24-4ca0-aed2-2a57228c2322",
      "productId": "d46491a9-4b4c-4bb7-a57f-7660e8926a36",
      "amount": 6000,
      "orderStatus": "COMPLETED",
      "orderProductStatus": "PAID",
      "downloaded": false,
      "isRefundable": true,
      "productType": "PROMPT",
      "title": "Spring Boot 코드 리뷰",
      "model": "GPT",
      "rating": 4.8,
      "paidAt": "2026-07-22T10:00:00",
      "createdAt": "2026-07-22T09:58:00"
    }
  ],
  "message": "success"
}
```

`amount` 계약은 다음과 같다.

- 타입은 음수가 아닌 정수다. 무료 상품은 `0`이다.
- 상품의 현재 판매가가 아니라 주문 생성 시 저장한 상품별 확정 금액이다.
- 상품 가격이 변경되거나 상품이 삭제되어도 기존 주문의 값은 변하지 않는다.
- 전체 결제 금액을 상품 수로 나누거나 현재 Product Service 가격으로 대신 계산하지 않는다.
- 필드 누락 또는 `null`을 허용하지 않는다.

Order Service의 주문상품 엔티티에 금액 스냅샷이 이미 있다면 해당 값을 DTO에 매핑한다. 없다면 주문 생성 시 금액을 저장하는 컬럼과 마이그레이션이 필요하다. 기존 주문 데이터도 프론트 배포 전에 신뢰 가능한 주문·결제 원장에서 결제 당시 금액으로 채워야 한다. 신뢰할 수 있는 과거 금액을 복원할 수 없다면 현재 상품가로 임의 보정하지 말고 해당 데이터의 처리 정책을 확정할 때까지 프론트 배포를 차단한다.

### 3.2 선택 상품 환불 접수

```http
POST /api/v2/orders/refunds
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "paymentId": "f305e6e0-c85d-4369-bbe6-7255b202a6ec",
  "orderProductIds": [
    "f7f8a8e9-bc24-4ca0-aed2-2a57228c2322",
    "c43f3323-f6e8-4017-b9a8-e89e6cfc4868"
  ]
}
```

요청 DTO 예시:

```java
public record OrderRefundRequest(
    @NotNull UUID paymentId,
    @NotEmpty List<@NotNull UUID> orderProductIds
) {
}
```

성공 응답은 `202 Accepted`와 빈 body를 사용한다. 이는 환불 완료가 아니라 비동기 접수 성공을 의미한다.

기존 프론트에 남아 있는 `POST /api/v2/orders/{orderId}/refund` 형태를 새 UI에서 사용하지 않는다. 기준 계약은 `POST /api/v2/orders/refunds`와 `paymentId + orderProductIds`다.

### 3.3 결제 내역 상태

```http
GET /api/v2/payments?page=1&size=20
Authorization: Bearer {accessToken}
```

Payment Service는 한 결제당 한 행을 반환하고 다음 상태를 노출한다.

| 상태 | 의미 |
| --- | --- |
| `PAID` | 환불 접수 전 결제 완료 |
| `REFUNDING` | 하나 이상의 주문상품 환불 처리 중 |
| `PARTIAL_REFUNDED` | 일부 상품 환불 완료, 환불되지 않은 상품 존재 |
| `ALL_REFUNDED` | 결제에 포함된 모든 유료 상품 환불 완료 |

`amount`는 해당 결제의 최초 승인 전체 금액을 유지한다. 누적 환불 후 남은 금액으로 덮어쓰지 않는다.

## 4. 환불 접수 검증 규칙

Order Service는 상태 변경이나 Outbox 저장 전에 요청 전체를 검증한다.

1. `orderProductIds`가 비어 있지 않아야 한다.
2. 중복된 주문상품 ID가 없어야 한다.
3. 모든 주문상품이 존재해야 한다.
4. 모든 주문상품이 같은 주문에 속해야 한다.
5. 모든 주문상품의 주문이 요청의 `paymentId`와 연결돼 있어야 한다.
6. 모든 주문상품의 구매자가 Gateway가 주입한 `X-User-Id`와 일치해야 한다.
7. 각 주문상품 상태가 `PAID`여야 한다.
8. 각 주문상품이 다운로드되지 않았어야 한다.
9. 각 주문상품의 `isRefundable` 계산 결과가 true여야 한다.

하나라도 실패하면 요청 전체를 거절하고 어떤 주문상품 상태나 Outbox도 변경하지 않는다. 부분 성공은 허용하지 않는다.

## 5. 상태 전이와 트랜잭션

### 5.1 접수 시점

`POST /api/v2/orders/refunds`의 단일 트랜잭션에서 다음을 수행한다.

1. 요청 전체를 검증한다.
2. 선택된 주문상품만 `PAID -> REFUND_REQUESTED`로 변경한다.
3. 선택된 주문상품별 환불 금액을 주문 당시 `amount`에서 가져온다.
4. 환불 처리에 필요한 Outbox 이벤트를 저장한다.
5. 모든 변경이 성공한 뒤 `202 Accepted`를 반환한다.

선택하지 않은 주문상품의 상태와 환불 가능 여부는 바꾸지 않는다. 따라서 첫 번째 환불이 처리 중이어도 같은 주문의 남은 `PAID` 상품을 후속 요청으로 접수할 수 있어야 한다.

### 5.2 처리 완료 시점

Payment Service의 처리 결과에 따라 상태를 갱신한다.

- 처리 중: 결제 `REFUNDING`, 대상 주문상품 `REFUND_REQUESTED`
- 일부 완료: 결제 `PARTIAL_REFUNDED`, 완료 상품 `REFUNDED`, 나머지 상품은 기존 상태 유지
- 전체 완료: 결제 `ALL_REFUNDED`, 결제에 포함된 모든 환불 대상 주문상품 `REFUNDED`
- PG 실패: 실패한 대상 주문상품을 `PAID`로 복구하고 다운로드 여부 등 조건을 다시 계산해 `isRefundable`을 결정한다. 다른 상품의 성공 상태는 되돌리지 않는다.

Order Service와 Payment Service 간 이벤트 처리는 `paymentId + orderProductId`를 멱등 키로 사용해 중복 소비가 중복 환불을 만들지 않게 한다.

## 6. 동시 요청 정책

프론트는 한 주문에서 요청 중인 버튼을 잠그지만, 네트워크 재시도나 여러 탭에서 동일 요청이 들어올 수 있으므로 서버 검증이 최종 기준이다.

- 동일 주문상품을 다시 요청하면 이미 `REFUND_REQUESTED` 또는 `REFUNDED`이므로 `409 Conflict`를 반환한다.
- 첫 요청에 포함되지 않은 `PAID` 상품은 같은 결제의 다른 상품이 `REFUND_REQUESTED` 상태여도 후속 환불 접수를 허용한다.
- 같은 주문상품에 대한 동시 요청은 행 잠금 또는 낙관적 잠금으로 하나만 성공시킨다.
- Outbox 저장과 주문상품 상태 변경은 같은 트랜잭션에 포함한다.
- Payment Service는 부분 환불 금액의 누적 합계가 최초 승인 금액을 초과하지 않도록 원자적으로 검증한다.

## 7. 상태 코드와 오류 계약

| HTTP | 조건 | 프론트 표시 |
| --- | --- | --- |
| `202` | 환불 접수 성공 | 상품을 `환불 신청 중`으로 갱신 |
| `400` | 빈 목록, 중복 ID, 서로 다른 주문 혼합, payment 매핑 불일치 | 환불할 상품을 다시 확인해 주세요. |
| `401` | 인증 토큰 없음 또는 만료 | 공통 인증 처리 |
| `403` | 다른 사용자의 주문 또는 권한 없음 | 본인이 구매한 상품만 환불할 수 있어요. |
| `404` | 결제 또는 주문상품이 존재하지 않음 | 주문 상품을 찾을 수 없어요. |
| `409` | 다운로드됨, 환불 불가 상태, 이미 접수·완료됨, 동시 요청 충돌 | 이미 다운로드했거나 환불할 수 없는 상품이에요. |

구체적인 에러 코드는 기존 공통 에러 코드 규칙을 따르되, 같은 조건은 모든 인스턴스에서 동일한 HTTP 상태를 반환해야 한다.

## 8. 데이터와 이벤트 요구사항

환불 이벤트 또는 명령에는 최소한 다음 정보가 필요하다.

```json
{
  "eventId": "unique-event-id",
  "paymentId": "payment-id",
  "orderId": "order-id",
  "orderProductId": "order-product-id",
  "buyerId": "buyer-id",
  "refundAmount": 6000,
  "occurredAt": "2026-07-22T10:30:00Z"
}
```

- `refundAmount`는 주문상품의 결제 당시 `amount`와 같아야 한다.
- 여러 상품을 선택하면 각 상품을 독립적으로 추적할 수 있어야 한다.
- 이벤트 재처리 시 이미 완료된 상품을 다시 환불하지 않아야 한다.
- 로그에는 `paymentId`, `orderId`, `orderProductId`, `eventId`를 남기되 토큰이나 개인정보는 기록하지 않는다.

## 9. 테스트 요구사항

### Order Service

- 주문 생성 시 상품별 확정 금액을 저장한다.
- 상품 가격 변경 후에도 기존 주문 조회의 `amount`가 변하지 않는다.
- 단일·다중 주문상품 선택 환불이 `202`를 반환한다.
- 선택한 상품만 `REFUND_REQUESTED`가 되고 선택하지 않은 상품은 `PAID`를 유지한다.
- 요청에 잘못된 상품이 하나라도 있으면 전체가 롤백된다.
- 다운로드된 상품, 환불 진행 상품, 환불 완료 상품은 `409`를 반환한다.
- 중복 ID와 서로 다른 주문의 ID 혼합은 `400`을 반환한다.
- 다른 구매자의 주문상품은 `403`을 반환한다.
- 같은 상품의 동시 요청은 한 요청만 성공한다.
- 첫 환불 처리 중에도 선택하지 않았던 다른 `PAID` 상품은 후속 접수할 수 있다.
- 상태 변경과 Outbox 저장이 하나의 트랜잭션으로 롤백된다.

### Payment Service

- 선택 상품의 금액만 PG 부분 환불 요청에 포함한다.
- 부분 환불 완료 후 `PARTIAL_REFUNDED`를 반환한다.
- 모든 유료 상품 환불 완료 후 `ALL_REFUNDED`를 반환한다.
- 처리 중 `REFUNDING`을 반환한다.
- 중복 이벤트를 받아도 환불 금액이 중복 반영되지 않는다.
- 누적 환불액이 최초 승인 금액을 초과하지 않는다.
- PG 실패 시 해당 상품만 재시도 가능한 상태로 복구한다.

### API 통합

1. 다건 주문을 결제한다.
2. `GET /api/v2/orders`에서 각 주문상품의 `amount`를 확인한다.
3. 일부 주문상품 ID로 환불을 접수한다.
4. 즉시 주문상품이 `REFUND_REQUESTED`인지 확인한다.
5. 처리 중 결제 상태가 `REFUNDING`인지 확인한다.
6. 완료 후 결제 상태가 `PARTIAL_REFUNDED`인지 확인한다.
7. 남은 상품을 추가 환불한다.
8. 최종 결제 상태가 `ALL_REFUNDED`인지 확인한다.

## 10. 문서와 배포 순서

1. DB에 주문상품 금액 스냅샷이 없다면 스키마와 데이터 마이그레이션을 먼저 배포한다.
2. Order Service가 `amount` 응답과 선택 환불 접수를 지원하도록 배포한다.
3. Payment Service가 부분 환불과 네 가지 결제 상태 조회를 지원하도록 배포한다.
4. Gateway 라우팅과 인증 전달을 검증한다.
5. OpenAPI 문서와 서비스 간 이벤트 스키마를 갱신한다.
6. 백엔드 통합 테스트가 통과한 뒤 프론트 주문 내역 UI를 배포한다.

프론트 배포 완료 기준은 `GET /api/v2/orders`의 모든 주문상품에 정확한 `amount`가 존재하고, `POST /api/v2/orders/refunds`가 선택 상품 목록을 원자적으로 접수하며, `GET /api/v2/payments`가 환불 진행 및 완료 상태를 반환하는 것이다.
