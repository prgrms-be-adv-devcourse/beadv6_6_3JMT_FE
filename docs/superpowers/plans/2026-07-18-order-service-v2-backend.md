# Order Service v2 Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** order-service의 HTTP API를 모두 v2로 전환하고, 역할 인가는 Gateway에 위임하여 order-service의 `X-User-Role` 의존성을 제거한다.

**Architecture:** Gateway가 JWT와 사용자 상태를 검증하고 경로별 최소 권한을 판정한다. Gateway를 통과한 요청에서 order-service는 `X-User-Id`만 사용자 식별값으로 사용하며 `X-User-Role`은 읽거나 요구하지 않는다. 주문·장바구니·환불 접수·관리자 계약은 order-service v2로 고정하고 결제 내역 조회는 Payment Service로 이전한 뒤, FE 전환 검증 후 Gateway의 order-service v1 라우트를 제거한다.

**Tech Stack:** Java, Spring Boot, Spring MVC, Spring Cloud Gateway, Spring Security OAuth2 Resource Server, Spring Data JPA, Eureka, gRPC, Gradle, JUnit 5, MockMvc

## Global Constraints

- 구현 대상 저장소는 `beadv6_6_3JMT_BE`이다.
- order-service의 외부 HTTP 계약은 `/api/v2`만 최종 지원한다.
- FE와의 전환이 끝나기 전까지 Gateway의 order-service 버전 설정은 `[v1, v2]`로 유지하고, 완료 후 `[v2]`로 축소한다.
- order-service는 `X-User-Role`을 읽거나 필수 헤더로 선언하지 않는다.
- 구매자·판매자·관리자 권한 판정은 Gateway `RoutePolicyResolver`가 담당한다.
- order-service는 외부에 직접 노출하지 않고 Gateway를 통해서만 접근할 수 있어야 한다.
- order-service의 사용자 소유권 검증에는 Gateway가 주입한 `X-User-Id`를 계속 사용한다.
- Gateway의 `X-User-Role` 전역 전달 제거는 settlement-service 등 다른 소비자 마이그레이션이 필요하므로 이번 범위에 포함하지 않는다. 대신 order-service는 해당 헤더가 있거나 없어도 동일하게 동작해야 한다.
- 주문 생성 v2 요청은 `products: Array<{ productId; productTitle }>` 형식이다.
- 주문 생성 v2 응답의 주문 ID는 `data.order.orderId`에 있다.
- `GET /api/v1/orders/payments`와 order-service의 v2 대체 API는 제거한다. 결제 내역은 Payment Service의 `GET /api/v2/payments`가 제공한다.
- `POST /api/v1/orders/{orderId}/payment-ready`는 제거하고 v2 대체 API를 만들지 않는다. 결제 준비·승인 검증은 Payment Service가 소유한다.
- 환불 접수는 `POST /api/v2/orders/refunds`가 `paymentId + orderProductIds`를 받고 202 Accepted를 반환한다.
- `DELETE /api/v2/cart` 전체 삭제 API는 이번 v2 계약에 포함하지 않는다.

---

## 1. 현재 상태와 변경 요약

현재 `feat/#392-seller-admin-settlement` 기준으로 `POST /api/v2/orders`만 v2이며 다음 항목은 아직 v1이다.

| 영역 | 현재 경로 | 목표 경로 |
| --- | --- | --- |
| 장바구니 | `/api/v1/cart/**` | `/api/v2/cart/**` |
| 주문 생성 | `/api/v2/orders` | 유지 |
| 주문 상세 | `/api/v1/orders/{orderId}` | `/api/v2/orders/{orderId}` |
| 결제 준비 검증 | `/api/v1/orders/{orderId}/payment-ready` | 제거, Payment Service 책임 |
| 콘텐츠 열람 | `/api/v1/orders/{orderId}/content/{orderProductId}` | `/api/v2/orders/{orderId}/content/{orderProductId}` |
| 주문 목록 | `/api/v1/orders` | `/api/v2/orders` |
| 결제 내역 | order-service 변경 브랜치에서 제거됨 | Payment Service `GET /api/v2/payments` |
| 환불 접수 | FE가 Payment Service 환불 API를 직접 호출 | `POST /api/v2/orders/refunds` |
| 다운로드 확정 | `/api/v1/orders/{orderId}/products/{orderProductId}/download` | `/api/v2/orders/{orderId}/products/{orderProductId}/download` |
| 관리자 주문 | `/api/v1/admin/orders/**` | `/api/v2/admin/orders/**` |

현재 인증 의존 지점:

- `OrderServiceAuthInterceptor`가 `X-User-Id`와 `X-User-Role=BUYER`를 모두 요구한다.
- `AdminAuthInterceptor`가 `X-User-Role=ADMIN`을 요구한다.
- `AdminOrderController`의 모든 메서드가 사용하지 않는 `userRole` 파라미터를 받는다.
- `WebConfig`에 v1 경로와 역할별 인터셉터가 등록되어 있다.
- Gateway는 이미 `/api/*/admin/**`를 ADMIN으로 판정할 수 있다.

## 2. 최종 인증 흐름

```text
Browser
  Authorization: Bearer <access-token>
      |
      v
API Gateway
  1. JWT 검증
  2. user-service authorize 호출로 ACTIVE 상태와 role 확인
  3. RoutePolicyResolver로 요청 경로의 최소 권한 확인
  4. X-User-Id 주입
      |
      v
order-service
  1. X-User-Id 존재 여부 확인
  2. buyerId와 주문·장바구니 소유권 확인
  3. X-User-Role은 읽지 않음
```

관리자 API의 ADMIN 판정은 Gateway의 `/api/*/admin/**` catch-all 정책으로 수행한다. order-service의 관리자 컨트롤러는 역할 헤더를 받지 않지만, 공통 인증 인터셉터가 `X-User-Id` 존재 여부를 검사하여 Gateway를 거친 인증 요청임을 확인한다.

## 3. 최종 v2 엔드포인트

| Method | Path | 인증/권한 | 응답 |
| --- | --- | --- | --- |
| GET | `/api/v2/cart/products` | 인증 사용자, 최소 BUYER | `ApiResult<CartResponse>` |
| POST | `/api/v2/cart/products` | 인증 사용자, 최소 BUYER | `ApiResult<AddCartProductResponse>` |
| DELETE | `/api/v2/cart/products/{cartProductId}` | 인증 사용자, 최소 BUYER | `ApiResult<Void>` |
| POST | `/api/v2/orders` | 인증 사용자, 최소 BUYER | `ApiResult<CreateOrderResponse>` |
| GET | `/api/v2/orders` | 인증 사용자, 최소 BUYER | `PageResponse<OrderListResponse>` |
| GET | `/api/v2/orders/{orderId}` | 인증 사용자, 최소 BUYER | `ApiResult<OrderDetailResponse>` |
| GET | `/api/v2/orders/{orderId}/content/{orderProductId}` | 인증 사용자, 최소 BUYER | `ApiResult<OrderContentResponse>` |
| PATCH | `/api/v2/orders/{orderId}/products/{orderProductId}/download` | 인증 사용자, 최소 BUYER | `ApiResult<OrderProductDownloadResponse>` |
| POST | `/api/v2/orders/refunds` | 인증 사용자, 최소 BUYER | 202 Accepted, body 없음 |
| GET | `/api/v2/admin/orders` | ADMIN | `PageResponse<AdminOrderListResponse>` |
| GET | `/api/v2/admin/orders/month` | ADMIN | `ApiResult<AdminMonthlyTradeAmountResponse>` |
| GET | `/api/v2/admin/orders/weekend` | ADMIN | `ApiResult<AdminWeeklyTransactionResponse>` |

연계되는 Payment Service v2 endpoint:

| Method | Path | 인증/권한 | 응답 |
| --- | --- | --- | --- |
| POST | `/api/v2/payments/confirm` | 인증 사용자, 최소 BUYER | `ApiResult<ConfirmPaymentResponse>` |
| GET | `/api/v2/payments` | 인증 사용자, 최소 BUYER | `PageResponse<PaymentHistoryResponse>` |

order-service의 `/orders/payments`와 `/orders/{orderId}/payment-ready`는 v2에서 404여야 한다.

## 4. 확정 v2 DTO

### 4.1 주문 생성 요청

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

검증 규칙:

- `products`는 비어 있을 수 없다.
- 각 원소와 `productId`는 null일 수 없다.
- `productId`는 요청 안에서 중복될 수 없다.
- `productTitle`은 blank일 수 없고 최대 200자이다.

### 4.2 주문 생성 응답

```json
{
  "success": true,
  "data": {
    "totalAmount": 45000,
    "order": {
      "orderId": "9f1c2a7e-4b8d-4e2a-9c11-2d3e4f5a1111",
      "orderNumber": "ORD-20260718-000001",
      "buyerId": "7c2f6e91-2c1b-4a3b-9f99-3f527f7d1234",
      "orderStatus": "CREATED",
      "orderAmount": 45000,
      "products": [
        {
          "orderProductId": "72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa",
          "productId": "00000000-0000-0000-0000-000000000201",
          "sellerId": "8f2c6e91-2c1b-4a3b-9f99-3f527f7d5678",
          "productTitle": "면접 준비 프롬프트",
          "productAmount": 45000,
          "orderProductStatus": "PENDING"
        }
      ],
      "createdAt": "2026-07-18T10:00:00"
    }
  }
}
```

### 4.3 주문 목록 응답 필수 필드

```java
public record OrderListResponse(
    UUID orderId,
    UUID orderProductId,
    UUID productId,
    OrderStatus orderStatus,
    OrderProductStatus orderProductStatus,
    boolean downloaded,
    boolean isRefundable,
    String productType,
    String title,
    String model,
    Double rating,
    LocalDateTime paidAt,
    LocalDateTime createdAt
) {
}
```

`orderProductStatus`는 부분 환불 주문에서 환불된 상품을 구매 목록에서 제외하는 데 필요하다. `downloaded`는 FE의 환불 불가 안내와 구매 콘텐츠 상태에 필요하므로 두 필드 모두 v2 응답에 반드시 포함한다.

### 4.4 Payment Service 결제 내역 응답

```java
public record PaymentHistoryResponse(
    UUID paymentId,
    UUID orderId,
    PaymentStatus paymentStatus,
    int amount,
    OffsetDateTime paidAt
) {
}
```

- Payment Service가 소유하는 DTO이며 order-service에 결제 조회 DTO를 다시 만들지 않는다.
- 한 결제 ID당 한 행을 반환한다.
- `amount`는 해당 결제의 전체 승인 금액이다.
- `userId`가 Gateway의 `X-User-Id`와 일치하는 결제만 반환한다.
- 조회 대상 상태는 `PAID`, `PARTIAL_REFUNDED`, `ALL_REFUNDED`다.
- 상품명·주문상품 ID·다운로드·환불 가능 여부는 FE가 order-service 주문 목록과 `orderId`로 조합한다.

### 4.5 다건 환불 접수 요청

```java
public record OrderRefundRequest(
    @NotNull UUID paymentId,
    @NotEmpty List<@NotNull UUID> orderProductIds
) {
}
```

- `orderProductIds`는 중복을 허용하지 않는다.
- 모든 주문상품의 구매자가 `X-User-Id`와 일치해야 한다.
- 모든 상품이 `PAID`이고 다운로드되지 않았으며 환불 가능한 상태여야 한다.
- 성공 시 환불 완료가 아니라 비동기 접수 의미의 202 Accepted와 빈 body를 반환한다.

### 4.6 관리자 주문 응답

```java
public record AdminOrderListResponse(
    UUID orderId,
    int sellerCount,
    List<SellerSummary> sellers,
    String productTitle,
    int totalOrderCount,
    int totalOrderAmount,
    OrderStatus orderStatus,
    LocalDateTime createdAt
) {
}
```

## 5. 파일 변경 맵

### API Gateway

| 파일 | 책임 |
| --- | --- |
| `config/src/main/resources/configs/application.yml` | order/cart/payment 최소 권한과 활성 API 버전 설정 |
| `apigateway/src/main/java/com/prompthub/apigateway/filter/RoutePolicyResolver.java` | 관리자 catch-all 및 경로 정책 해석 |
| `apigateway/src/test/java/com/prompthub/apigateway/filter/RoutePolicyResolverTest.java` | v2 order/cart/admin 권한 정책 테스트 |
| `apigateway/src/main/java/com/prompthub/apigateway/filter/ForwardAuthFilter.java` | JWT·사용자 상태 검증과 내부 사용자 ID 전달 |
| `apigateway/src/test/java/com/prompthub/apigateway/filter/ForwardAuthFilterTest.java` | 권한 부족, 인증 실패, 사용자 ID 전달 테스트 |
| `apigateway/src/main/java/com/prompthub/apigateway/route/VersionedServiceRoute.java` | order-service v2 경로 라우팅 |
| `apigateway/src/test/java/com/prompthub/apigateway/route/VersionedRouteDefinitionLocatorTest.java` | v2 라우트와 v1 제거 테스트 |

### order-service

| 파일 | 책임 |
| --- | --- |
| `order-service/src/main/java/com/prompthub/order/global/web/WebConfig.java` | v2 경로에 사용자 ID 인터셉터 등록 |
| `order-service/src/main/java/com/prompthub/order/global/web/OrderServiceAuthInterceptor.java` | `X-User-Id` 존재 여부만 검증 |
| `order-service/src/main/java/com/prompthub/order/global/web/AdminAuthInterceptor.java` | 삭제 대상: 역할 헤더 기반 관리자 판정 |
| `order-service/src/main/java/com/prompthub/order/global/web/AuthHeaderRoles.java` | 삭제 대상: 역할 헤더 파싱 |
| `order-service/src/main/java/com/prompthub/order/global/web/AuthHeaders.java` | `USER_ID`만 유지 |
| `order-service/src/main/java/com/prompthub/order/global/exception/GlobalExceptionHandler.java` | `USER_ROLE` 참조 제거 |
| `order-service/src/main/java/com/prompthub/order/presentation/CartController.java` | 장바구니 v2 API |
| `order-service/src/main/java/com/prompthub/order/presentation/OrderController.java` | 주문 조회·콘텐츠·다운로드·환불 접수 v2 API |
| `order-service/src/main/java/com/prompthub/order/presentation/AdminOrderController.java` | 역할 헤더 파라미터가 없는 관리자 v2 API |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/request/CreateOrderRequest.java` | v2 주문 생성 요청 검증 |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/response/CreateOrderResponse.java` | 중첩 주문 생성 응답 |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderListResponse.java` | 다운로드 상태가 포함된 주문 목록 |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/request/OrderRefundRequest.java` | 결제 ID와 주문상품 ID 목록 검증 |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/request/OrderPaymentValidationRequest.java` | 삭제 대상: v1 payment-ready 전용 DTO |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderPaymentValidationResponse.java` | 삭제 대상: v1 payment-ready 전용 DTO |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderPaymentListResponse.java` | 삭제 상태 유지: Payment Service로 책임 이전 |
| `order-service/src/main/java/com/prompthub/order/presentation/dto/response/AdminOrderListResponse.java` | 다중 판매자 관리자 주문 응답 |
| `order-service/src/main/java/com/prompthub/order/application/usecase/OrderQueryUseCase.java` | 목록·상세·콘텐츠 조회 계약, payment-ready 제거 |
| `order-service/src/main/java/com/prompthub/order/application/service/order/OrderQueryService.java` | 주문 목록·상세 응답 조립 |
| `order-service/src/main/java/com/prompthub/order/application/usecase/OrderRefundUseCase.java` | 비동기 환불 접수 유스케이스 |
| `order-service/src/main/java/com/prompthub/order/application/service/refund/OrderRefundService.java` | 소유권·상태·다운로드 검증과 환불 Outbox 저장 |
| `order-service/src/main/java/com/prompthub/order/domain/repository/OrderRepository.java` | 주문·주문상품 조회 및 잠금 |
| `order-service/src/main/java/com/prompthub/order/infra/persistence/order/OrderAdapter.java` | 주문 저장소 포트 구현 |

### payment-service

| 파일 | 책임 |
| --- | --- |
| `payment-service/src/main/java/com/prompthub/paymentservice/presentation/PaymentController.java` | v2 결제 승인과 사용자 결제 내역 조회 |
| `payment-service/src/main/java/com/prompthub/paymentservice/presentation/dto/response/PaymentHistoryResponse.java` | 결제 ID·주문 ID·상태·금액·승인 시각 응답 |
| `payment-service/src/main/java/com/prompthub/paymentservice/application/usecase/GetPaymentsUseCase.java` | 사용자별 결제 내역 조회 계약 |
| `payment-service/src/main/java/com/prompthub/paymentservice/application/service/GetPaymentsService.java` | 사용자별 결제 내역 pagination |
| `payment-service/src/main/java/com/prompthub/paymentservice/domain/repository/PaymentRepository.java` | userId·상태별 결제 조회 포트 |
| `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/persistence/PaymentJpaRepository.java` | Spring Data 조회 계약 |
| `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/persistence/PaymentRepositoryAdapter.java` | 결제 조회 포트 구현 |

---

### Task 1: Gateway에 주문·장바구니·결제 권한 정책 명시

**Files:**

- Modify: `config/src/main/resources/configs/application.yml`
- Modify: `apigateway/src/test/java/com/prompthub/apigateway/filter/RoutePolicyResolverTest.java`
- Verify: `apigateway/src/main/java/com/prompthub/apigateway/filter/ForwardAuthFilter.java`

**Interfaces:**

- Consumes: JWT subject, user-service의 status/role
- Produces: 권한 검증을 통과한 요청과 `X-User-Id`

- [ ] **Step 1: order/cart/payment 최소 권한 정책 테스트를 작성한다**

```java
assertThat(RoutePolicyResolver.requiredRole(
    "/api/v2/orders", properties
)).contains(GatewayRole.BUYER);

assertThat(RoutePolicyResolver.requiredRole(
    "/api/v2/cart/products", properties
)).contains(GatewayRole.BUYER);

assertThat(RoutePolicyResolver.requiredRole(
    "/api/v2/payments", properties
)).contains(GatewayRole.BUYER);

assertThat(RoutePolicyResolver.requiredRole(
    "/api/v2/admin/orders", properties
)).contains(GatewayRole.ADMIN);
```

- [ ] **Step 2: 테스트가 order/cart 정책 부재로 실패하는지 확인한다**

Run:

```bash
./gradlew :apigateway:test --tests '*RoutePolicyResolverTest'
```

Expected: order, cart 또는 payment의 required role이 empty여서 FAIL.

- [ ] **Step 3: Gateway 공통 설정에 정책을 추가한다**

```yaml
gateway:
  route-policies:
    /api/*/orders/**: BUYER
    /api/*/cart/**: BUYER
    /api/*/payments/**: BUYER
    /api/*/sellers/me/**: SELLER
```

관리자 경로는 `RoutePolicyResolver`의 `/api/*/admin/**` catch-all이 ADMIN을 강제한다.

- [ ] **Step 4: Gateway 테스트를 통과시킨다**

Run:

```bash
./gradlew :apigateway:test --tests '*RoutePolicyResolverTest' --tests '*ForwardAuthFilterTest'
```

Expected: order/cart/payment BUYER, admin ADMIN, 비활성 사용자 403, authorize 장애 503 테스트 PASS.

---

### Task 2: order-service의 `X-User-Role` 의존성 제거

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/global/web/OrderServiceAuthInterceptor.java`
- Modify: `order-service/src/main/java/com/prompthub/order/global/web/WebConfig.java`
- Modify: `order-service/src/main/java/com/prompthub/order/global/web/AuthHeaders.java`
- Modify: `order-service/src/main/java/com/prompthub/order/global/exception/GlobalExceptionHandler.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/AdminOrderController.java`
- Delete: `order-service/src/main/java/com/prompthub/order/global/web/AdminAuthInterceptor.java`
- Delete: `order-service/src/main/java/com/prompthub/order/global/web/AuthHeaderRoles.java`
- Delete: `order-service/src/test/java/com/prompthub/order/presentation/AuthHeaderRolesTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/global/web/OrderV2WebConfigTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/global/web/OrderWebConfigTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/AdminOrderControllerTest.java`

**Interfaces:**

- Consumes: Gateway가 검증 후 주입한 `X-User-Id`
- Produces: 역할 헤더 없이 인증된 order-service 요청

- [ ] **Step 1: 역할 헤더 없이 성공하는 WebConfig 테스트를 작성한다**

검증 케이스:

1. `X-User-Id`만 있는 `/api/v2/orders` 요청은 인터셉터를 통과한다.
2. `X-User-Id`만 있는 `/api/v2/cart/products` 요청은 인터셉터를 통과한다.
3. `X-User-Id`만 있는 `/api/v2/admin/orders` 요청은 order-service 인터셉터를 통과한다.
4. `X-User-Id`가 없는 요청은 `A003`으로 실패한다.
5. `X-User-Role` 값이 없거나 잘못되어도 결과에 영향을 주지 않는다.

- [ ] **Step 2: 기존 인터셉터가 역할 헤더를 요구해 테스트가 실패하는지 확인한다**

Run:

```bash
./gradlew :order-service:test --tests '*OrderV2WebConfigTest' --tests '*OrderWebConfigTest'
```

Expected: `X-User-Role` 누락으로 인증 실패하여 신규 성공 케이스 FAIL.

- [ ] **Step 3: 인터셉터를 사용자 ID 검증만 수행하도록 변경한다**

```java
@Component
public class OrderServiceAuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        String userId = request.getHeader(AuthHeaders.USER_ID);
        if (userId == null || userId.isBlank()) {
            throw new OrderException(ErrorCode.INVALID_AUTHENTICATION);
        }
        return true;
    }
}
```

- [ ] **Step 4: 모든 v2 경로에 단일 인터셉터를 등록한다**

```java
registry.addInterceptor(orderServiceAuthInterceptor)
    .addPathPatterns(
        "/api/v2/orders/**",
        "/api/v2/cart/**",
        "/api/v2/admin/orders/**"
    );
```

- [ ] **Step 5: 역할 헤더 기반 클래스를 삭제하고 상수·예외 로그 참조를 정리한다**

`AuthHeaders`에는 다음 값만 남긴다.

```java
public static final String USER_ID = "X-User-Id";
```

- [ ] **Step 6: 관리자 Controller에서 `userRole` 파라미터와 Swagger header 선언을 제거한다**

```java
public PageResponse<AdminOrderListResponse> getAdminOrders(
    @ModelAttribute AdminOrderSearchCondition condition
) {
    // existing use-case call
}
```

월간·주간 API도 인자 없는 메서드로 변경한다.

- [ ] **Step 7: 저장소 전체에서 order-service 역할 헤더 의존성이 사라졌는지 확인한다**

Run:

```bash
git grep -n -E 'X-User-Role|USER_ROLE|AuthHeaderRoles|userRole' -- order-service/src
```

Expected: 검색 결과 없음.

- [ ] **Step 8: 인증 관련 테스트를 통과시킨다**

Run:

```bash
./gradlew :order-service:test \
  --tests '*OrderV2WebConfigTest' \
  --tests '*OrderWebConfigTest' \
  --tests '*AdminOrderControllerTest'
```

Expected: 역할 헤더 없는 성공 케이스와 사용자 ID 누락 실패 케이스 PASS.

---

### Task 3: 모든 Controller 경로를 v2로 전환

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/CartController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/OrderController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/AdminOrderController.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/CartControllerTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/AdminOrderControllerTest.java`

**Interfaces:**

- Consumes: `/api/v2` Gateway 요청
- Produces: 3절의 v2 endpoint matrix

- [ ] **Step 1: Controller 테스트의 모든 요청 경로를 v2로 변경한다**

- [ ] **Step 2: Controller base mapping을 v2로 통일한다**

```java
@RequestMapping("/api/v2/cart")
public class CartController { }

@RequestMapping("/api/v2/admin/orders")
public class AdminOrderController { }
```

`OrderController`의 모든 method mapping도 `/api/v2/orders...`로 변경한다.

- [ ] **Step 3: v2 endpoint 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test \
  --tests '*CartControllerTest' \
  --tests '*OrderControllerTest' \
  --tests '*OrderControllerCreateTest' \
  --tests '*AdminOrderControllerTest'
```

Expected: v2 성공·검증·권한·not-found 케이스 PASS.

- [ ] **Step 4: order-service main source에 v1 경로가 없는지 확인한다**

Run:

```bash
git grep -n '/api/v1' -- order-service/src/main
```

Expected: 검색 결과 없음.

---

### Task 4: 주문 생성 v2 계약 완료

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/request/CreateOrderRequest.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/CreateOrderResponse.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerCreateTest.java`
- Verify: `order-service/src/test/java/com/prompthub/order/application/service/order/OrderCreationTransactionIntegrationTest.java`
- Verify: `order-service/src/test/java/com/prompthub/order/application/service/order/OrderCreationResilienceIntegrationTest.java`

**Interfaces:**

- Consumes: `products[{productId, productTitle}]`
- Produces: `totalAmount`와 중첩 `order`

- [ ] **Step 1: 4.1절 검증 규칙에 대한 Controller 테스트를 유지·보강한다**

필수 케이스:

- 빈 `products`는 400.
- null 상품 또는 null `productId`는 400.
- 중복 `productId`는 400.
- blank 제목과 201자 제목은 400.
- 정상 다건 요청은 하나의 order와 여러 order products를 반환.

- [ ] **Step 2: 응답 JSON path를 중첩 구조로 검증한다**

```java
andExpect(jsonPath("$.data.totalAmount").value(45000))
andExpect(jsonPath("$.data.order.orderId").value(ORDER_ID.toString()))
andExpect(jsonPath("$.data.order.products[0].productTitle").value("면접 준비 프롬프트"));
```

- [ ] **Step 3: 주문 생성 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*OrderControllerCreateTest' --tests '*OrderCreation*IntegrationTest'
```

Expected: DTO validation, transaction rollback, product-service 장애 매핑 테스트 PASS.

---

### Task 5: 장바구니 API를 v2로 전환

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/CartController.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/CartControllerTest.java`
- Verify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/CartResponse.java`
- Verify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/CartProductResponse.java`

**Interfaces:**

- Consumes: 상품 추가 `{ productId }`
- Produces: `CartResponse.products[]`

- [ ] **Step 1: 조회·추가·개별 삭제 테스트를 `/api/v2/cart/products`로 변경한다**

- [ ] **Step 2: Controller base path를 `/api/v2/cart`로 변경한다**

- [ ] **Step 3: `DELETE /api/v2/cart`는 추가하지 않는다**

전체 장바구니 삭제 클라이언트는 사용되지 않으며 FE 계획에서 제거한다. 주문 성공 또는 실패 보상에 필요한 장바구니 정리는 application use case 내부 동작으로 검증한다.

- [ ] **Step 4: 장바구니 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*CartControllerTest' --tests '*CartServiceTest'
```

Expected: 조회·추가·개별 삭제와 소유권 검증 PASS.

---

### Task 6: 주문 목록·상세 v2 계약과 제거 API 정리

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/OrderController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderListResponse.java`
- Delete: `order-service/src/main/java/com/prompthub/order/presentation/dto/request/OrderPaymentValidationRequest.java`
- Delete: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderPaymentValidationResponse.java`
- Modify: `order-service/src/main/java/com/prompthub/order/application/usecase/OrderQueryUseCase.java`
- Modify: `order-service/src/main/java/com/prompthub/order/application/service/order/OrderQueryService.java`
- Modify: `order-service/src/test/java/com/prompthub/order/application/service/order/OrderQueryServiceTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerTest.java`

**Interfaces:**

- Consumes: buyerId, page, size, orderId, orderProductId
- Produces: 주문 상품 단위 목록과 주문 상세; 결제 조회·준비 API는 제공하지 않음

- [ ] **Step 1: 주문 목록 응답에 `orderProductStatus`와 `downloaded`를 추가하는 실패 테스트를 작성한다**

```java
assertThat(response.orderProductStatus()).isEqualTo(OrderProductStatus.PAID);
assertThat(response.downloaded()).isTrue();
assertThat(response.isRefundable()).isFalse();
```

- [ ] **Step 2: 주문 목록 projection과 DTO 조립에 주문상품 상태와 다운로드 상태를 연결한다**

- [ ] **Step 3: `payment-ready` 메서드와 전용 DTO를 제거한다**

다음 항목을 함께 제거한다.

- `OrderController.validatePaymentReady`
- `OrderQueryUseCase.validatePaymentReady`
- `OrderQueryService.validatePaymentReady`
- `OrderPaymentValidationRequest`
- `OrderPaymentValidationResponse`
- 해당 Controller·service 테스트

- [ ] **Step 4: order-service 결제 내역 코드가 삭제된 상태를 유지한다**

Run:

```bash
git grep -n -E 'OrderPayment|orders/payments|getOrderPayments' -- order-service/src
```

Expected: 검색 결과 없음.

- [ ] **Step 5: 제거된 API가 v2에서 404인지 테스트한다**

```java
mockMvc.perform(get("/api/v2/orders/payments")
        .header(USER_ID, BUYER_ID))
    .andExpect(status().isNotFound());

mockMvc.perform(post("/api/v2/orders/{orderId}/payment-ready", ORDER_ID)
        .header(USER_ID, BUYER_ID)
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"amount\":15000}"))
    .andExpect(status().isNotFound());
```

- [ ] **Step 6: 주문 조회 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*OrderQueryServiceTest' --tests '*OrderControllerTest'
```

Expected: 목록·상세·콘텐츠·다운로드 테스트와 제거 API 404 테스트 PASS.

---

### Task 7: Payment Service에 v2 결제 내역 조회 추가

**Files:**

- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/presentation/PaymentController.java`
- Create: `payment-service/src/main/java/com/prompthub/paymentservice/presentation/dto/response/PaymentHistoryResponse.java`
- Create: `payment-service/src/main/java/com/prompthub/paymentservice/application/usecase/GetPaymentsUseCase.java`
- Create: `payment-service/src/main/java/com/prompthub/paymentservice/application/service/GetPaymentsService.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/domain/repository/PaymentRepository.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/persistence/PaymentJpaRepository.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/persistence/PaymentRepositoryAdapter.java`
- Create: `payment-service/src/test/java/com/prompthub/paymentservice/application/service/GetPaymentsServiceTest.java`
- Modify: `payment-service/src/test/java/com/prompthub/paymentservice/presentation/PaymentControllerTest.java`

**Interfaces:**

- Consumes: Gateway `X-User-Id`, page, size
- Produces: `PageResponse<PaymentHistoryResponse>`

- [ ] **Step 1: 다른 사용자의 결제가 노출되지 않는 service 테스트를 작성한다**

```java
Page<PaymentHistoryResponse> result = getPaymentsService.getPayments(USER_ID, request);

assertThat(result.getContent()).allMatch(item ->
    item.orderId().equals(OWN_ORDER_ID)
);
```

- [ ] **Step 2: Payment repository에 사용자·상태·페이지 조회 계약을 추가한다**

```java
Page<Payment> findByUserIdAndStatusIn(
    UUID userId,
    Collection<PaymentStatus> statuses,
    Pageable pageable
);
```

조회 상태는 `PAID`, `PARTIAL_REFUNDED`, `ALL_REFUNDED`로 제한하고 승인 시각 내림차순으로 반환한다.

- [ ] **Step 3: `GET /api/v2/payments`를 구현한다**

```java
@GetMapping
public PageResponse<PaymentHistoryResponse> getPayments(
    @RequestHeader("X-User-Id") UUID userId,
    @Valid @ModelAttribute PaymentPageRequest request
) {
    Page<PaymentHistoryResponse> payments = getPaymentsUseCase.getPayments(userId, request);
    return PageResponse.success(
        payments.getContent(),
        request.page(),
        request.size(),
        payments.getTotalElements(),
        payments.hasNext()
    );
}
```

- [ ] **Step 4: 결제 내역 Controller와 service 테스트를 실행한다**

Run:

```bash
./gradlew :payment-service:test --tests '*GetPaymentsServiceTest' --tests '*PaymentControllerTest'
```

Expected: 본인 결제 pagination, 상태 filter, 타 사용자 격리, 인증 누락 테스트 PASS.

---

### Task 8: order-service 다건 환불 접수 API 추가

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/OrderController.java`
- Create: `order-service/src/main/java/com/prompthub/order/presentation/dto/request/OrderRefundRequest.java`
- Create: `order-service/src/main/java/com/prompthub/order/application/usecase/OrderRefundUseCase.java`
- Create: `order-service/src/main/java/com/prompthub/order/application/service/refund/OrderRefundService.java`
- Modify: `order-service/src/main/java/com/prompthub/order/global/exception/ErrorCode.java`
- Modify: `order-service/src/main/java/com/prompthub/order/infra/messaging/kafka/event/OrderEventType.java`
- Create: `order-service/src/main/java/com/prompthub/order/infra/messaging/kafka/event/OrderRefundRequestedPayload.java`
- Modify: `order-service/src/main/java/com/prompthub/order/application/service/event/OrderEventMessageFactory.java`
- Verify: `order-service/src/main/java/com/prompthub/order/application/service/event/outbox/OutboxEventAppender.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/messaging/dto/OrderRefundRequestedMessage.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/infrastructure/messaging/consumer/OrderEventConsumer.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/application/dto/command/ProcessRefundCommand.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/application/service/ProcessRefundService.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerTest.java`
- Create: `order-service/src/test/java/com/prompthub/order/application/service/refund/OrderRefundServiceTest.java`
- Modify: `payment-service/src/test/java/com/prompthub/paymentservice/OrderEventConsumerIntegrationTest.java`
- Modify: `payment-service/src/test/java/com/prompthub/paymentservice/application/service/ProcessRefundServiceTest.java`

**Interfaces:**

- Consumes: `{ paymentId, orderProductIds[] }`, buyerId
- Produces: 202 Accepted와 `ORDER_REFUND_REQUESTED` Outbox event

- [ ] **Step 1: 소유권·상태·다운로드 검증 실패 테스트를 작성한다**

필수 케이스:

- 빈 목록, null ID, 중복 주문상품 ID는 400.
- 다른 구매자의 주문상품은 403.
- 존재하지 않는 주문상품은 404.
- `PAID`가 아니거나 이미 다운로드한 상품은 409.

- [ ] **Step 2: `OrderRefundService`에서 대상 주문상품을 잠그고 검증한다**

Order Service는 `paymentId`와 주문상품 관계를 직접 검증하지 않는다. Payment Service가 Outbox event를 소비할 때 결제 소유권과 포함 관계를 검증한다.

- [ ] **Step 3: 환불 대상 주문상품마다 요청 Outbox를 같은 transaction에 저장한다**

각 event payload:

```json
{
  "paymentId": "UUID",
  "orderId": "UUID",
  "orderProductId": "UUID",
  "buyerId": "UUID",
  "refundAmount": 15000,
  "requestedAt": "2026-07-18T10:00:00"
}
```

`orderProductIds`가 두 개면 Outbox event도 두 개 저장하며, 하나라도 직렬화·저장에 실패하면 전체 접수를 rollback한다.

- [ ] **Step 4: Payment Service 소비 계약에 `paymentId`를 추가한다**

`OrderEventConsumer`는 `paymentId + orderId + orderProductId + buyerId + refundAmount`를 `ProcessRefundCommand`로 전달한다. `ProcessRefundService`는 paymentId의 소유자와 orderId 관계를 검증한 뒤 기존 부분환불 처리를 수행한다.

- [ ] **Step 5: Controller에서 202와 빈 body를 반환한다**

```java
@PostMapping("/api/v2/orders/refunds")
public ResponseEntity<Void> requestRefund(
    @RequestHeader(USER_ID) UUID buyerId,
    @Valid @RequestBody OrderRefundRequest request
) {
    orderRefundUseCase.request(buyerId, request.toCommand());
    return ResponseEntity.accepted().build();
}
```

- [ ] **Step 6: 환불 접수와 소비 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*OrderRefundServiceTest' --tests '*OrderControllerTest'
./gradlew :payment-service:test --tests '*ProcessRefundServiceTest' --tests '*OrderEventConsumerIntegrationTest'
```

Expected: 검증 실패, Outbox 원자성, paymentId 관계 검증, 202 응답 테스트 PASS.

---

### Task 9: 관리자 주문 v2 계약 적용

**Files:**

- Modify: `order-service/src/main/java/com/prompthub/order/presentation/AdminOrderController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/AdminOrderListResponse.java`
- Modify: `order-service/src/main/java/com/prompthub/order/application/service/admin/AdminOrderService.java`
- Modify: `order-service/src/main/java/com/prompthub/order/infra/persistence/order/AdminOrderQueryRepositoryImpl.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/AdminOrderControllerTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/application/service/admin/AdminOrderServiceTest.java`

**Interfaces:**

- Consumes: 상태·페이지 검색 조건
- Produces: 주문별 `sellerCount`, `sellers[]`, 상품 요약, 총액

- [ ] **Step 1: 판매자 1명과 여러 명인 주문 응답 테스트를 작성한다**

- [ ] **Step 2: 판매자별 상품 수와 금액을 `SellerSummary`로 집계한다**

- [ ] **Step 3: Controller 메서드에서 `X-User-Role` 파라미터 없이 use case를 호출한다**

- [ ] **Step 4: 관리자 주문 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*AdminOrderControllerTest' --tests '*AdminOrderServiceTest'
```

Expected: 다중 판매자 집계, 상태 filter, pagination, 월간·주간 통계 테스트 PASS.

---

### Task 10: 503 원인 분리와 가용성 검증

**Files:**

- Modify: `order-service/src/test/java/com/prompthub/order/application/service/order/OrderCreationResilienceIntegrationTest.java`
- Modify: `apigateway/src/test/java/com/prompthub/apigateway/route/VersionedRouteDefinitionLocatorTest.java`
- Verify: `order-service/src/main/resources/application.yml`
- Verify: `config/src/main/resources/configs/order-service.yml`
- Verify: `k8s/base/services/order/deployment.yaml`

**Interfaces:**

- Consumes: Gateway service discovery와 product-service gRPC 호출
- Produces: 원인을 구분할 수 있는 503 응답과 로그

- [ ] **Step 1: Gateway가 v2 cart/orders/admin/orders를 `lb://ORDER-SERVICE`로 라우팅하는지 테스트한다**

- [ ] **Step 2: order-service가 Eureka에 등록되고 readiness가 성공한 뒤 트래픽을 받도록 배포 설정을 검증한다**

- [ ] **Step 3: product-service gRPC 장애를 `SYS002` 503으로 매핑하는 테스트를 유지한다**

- [ ] **Step 4: Gateway 인스턴스 부재 503과 order-service 내부 `SYS002` 503을 로그에서 구분한다**

구분 기준:

- Gateway upstream 미발견: order-service access log가 없고 Gateway route/service discovery 로그가 존재.
- order-service 내부 연동 실패: order-service access log와 `SYS002` error code가 존재.

- [ ] **Step 5: resilience와 Gateway route 테스트를 실행한다**

Run:

```bash
./gradlew :order-service:test --tests '*OrderCreationResilienceIntegrationTest'
./gradlew :apigateway:test --tests '*VersionedRouteDefinitionLocatorTest'
```

Expected: 장애 매핑 및 v2 route 테스트 PASS.

---

### Task 11: OpenAPI와 v1 제거

**Files:**

- Modify: `config/src/main/resources/configs/application.yml`
- Modify: `apigateway/src/main/resources/application.yml`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/OrderController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/CartController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/AdminOrderController.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/request/CreateOrderRequest.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/request/OrderRefundRequest.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/CreateOrderResponse.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/OrderListResponse.java`
- Modify: `order-service/src/main/java/com/prompthub/order/presentation/dto/response/AdminOrderListResponse.java`
- Modify: `payment-service/src/main/java/com/prompthub/paymentservice/presentation/PaymentController.java`
- Create: `payment-service/src/main/java/com/prompthub/paymentservice/presentation/dto/response/PaymentHistoryResponse.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/OrderControllerCreateTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/CartControllerTest.java`
- Modify: `order-service/src/test/java/com/prompthub/order/presentation/AdminOrderControllerTest.java`
- Modify: `payment-service/src/test/java/com/prompthub/paymentservice/presentation/PaymentControllerTest.java`

**Interfaces:**

- Consumes: FE staging 검증 결과
- Produces: order-service v2-only Gateway 및 OpenAPI

- [ ] **Step 1: order-service와 Payment Service OpenAPI에 3절의 모든 v2 endpoint가 나타나는지 확인한다**

- [ ] **Step 2: OpenAPI request header에서 `X-User-Role`이 사라졌는지 확인한다**

- [ ] **Step 3: FE와 BE staging E2E가 통과한 뒤 order-service 버전을 v2만 남긴다**

```yaml
gateway:
  api-versions:
    order-service: [v2]
```

로컬 fallback 설정인 `apigateway/src/main/resources/application.yml`도 동일하게 변경한다.

- [ ] **Step 4: Gateway v1 라우트가 생성되지 않는 테스트를 추가한다**

- [ ] **Step 5: v1 경로 잔존 여부를 확인한다**

Run:

```bash
git grep -n '/api/v1' -- order-service
rg -n 'order-service:.*v1' \
  config/src/main/resources/configs/application.yml \
  apigateway/src/main/resources/application.yml
```

Expected: 두 명령 모두 검색 결과 없음. 다른 서비스의 v1 설정은 이 작업 범위에서 유지.

---

### Task 12: BE 전체 검증과 커밋

**Files:**

- Verify: 모든 변경 파일

**Interfaces:**

- Consumes: v2 API 계약과 Gateway 권한 정책
- Produces: v2-only order-service 배포 산출물

- [ ] **Step 1: order-service 전체 테스트를 실행한다**

```bash
./gradlew :order-service:test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 2: API Gateway 전체 테스트를 실행한다**

```bash
./gradlew :apigateway:test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 3: Payment Service 전체 테스트를 실행한다**

```bash
./gradlew :payment-service:test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 4: 전체 빌드를 실행한다**

```bash
./gradlew clean build
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: 역할 헤더와 v1 경로 제거를 정적 검증한다**

```bash
git grep -n -E 'X-User-Role|USER_ROLE|AuthHeaderRoles|userRole' -- order-service/src
git grep -n '/api/v1' -- order-service/src
```

Expected: 두 명령 모두 검색 결과 없음.

- [ ] **Step 6: 변경을 검토 가능한 단위로 커밋한다**

```bash
git add apigateway config
git commit -m "feat: enforce order v2 roles at gateway"

git add order-service/src/main/java/com/prompthub/order/global order-service/src/test/java/com/prompthub/order/global
git commit -m "refactor: remove order service role header dependency"

git add order-service
git commit -m "feat: migrate order service APIs to v2"

git add payment-service
git commit -m "feat: expose buyer payment history in v2"
```

---

## 6. 배포 순서

1. Gateway에 order/cart BUYER 정책을 먼저 배포한다.
2. Payment Service의 결제 내역 조회 계약을 배포한다.
3. v1과 v2 route를 모두 활성화한 상태로 order-service v2를 배포한다.
4. 역할 헤더 없이 v2 API가 동작하는 smoke test를 수행한다.
5. v2 계약을 반영한 FE를 배포한다.
6. 장바구니 → 주문 → 결제 → 결제 내역 → 환불 접수 → 콘텐츠 → 관리자 주문 E2E를 수행한다.
7. Gateway의 order-service 활성 버전을 `[v2]`로 축소한다.
8. v1 route와 제거된 order-service 결제 API가 404이고 v2 기능이 정상인지 최종 확인한다.

무중단 전환이 필요하면 신규 order-service가 기존 FE의 `{ productIds }` 요청을 짧은 배포 구간 동안 수용하는 임시 호환 DTO를 사용할 수 있다. 이 호환 필드는 FE v2 배포 직후 제거하고 최종 OpenAPI에는 포함하지 않는다.

## 7. BE 완료 조건

- [ ] order-service main source와 Controller 테스트에 `/api/v1` 경로가 없다.
- [ ] 3절의 모든 v2 endpoint가 OpenAPI와 Gateway route에 존재한다.
- [ ] order-service source에 `X-User-Role`, `USER_ROLE`, `AuthHeaderRoles`, `userRole` 참조가 없다.
- [ ] 역할 판정은 Gateway route policy가 수행한다.
- [ ] order-service는 `X-User-Id`로 인증 사용자와 리소스 소유권을 검증한다.
- [ ] 주문 목록 응답에 `orderProductStatus`, `downloaded`, `isRefundable`이 포함된다.
- [ ] order-service의 결제 내역·payment-ready API가 제거되어 404를 반환한다.
- [ ] Payment Service가 본인 결제 내역을 결제 ID당 한 행으로 반환한다.
- [ ] 환불 접수 API가 `paymentId + orderProductIds`를 검증하고 202를 반환한다.
- [ ] 관리자 주문 응답에 `sellerCount`와 `sellers[]`가 포함된다.
- [ ] Gateway upstream 부재 503과 order-service `SYS002` 503을 구분할 수 있다.
- [ ] `:order-service:test`, `:payment-service:test`, `:apigateway:test`, 전체 build가 통과한다.
- [ ] FE staging E2E 통과 후 Gateway의 order-service 활성 버전이 `[v2]`다.
