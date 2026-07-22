# GET /api/v2/users/order-product — 구매한 프롬프트 리더용 판매자 정보 단건 조회 API 스펙

- 작성일: 2026-07-22
- 담당: user-service
- 배경: `/reader/[id]`(구매한 프롬프트 리더) 페이지의 판매자 카드에 판매자 이름·프로필 이미지를 표시하기 위한 명세. 현재 이 카드는 `sellerId`를 아예 모르는 상태라 `seller: 'PromptHub'` 하드코딩 placeholder를 표시하고 있다(`lib/orderAdapters.ts`의 `mapOrderToPrompt`).
- 이 문서는 [`2026-07-21-sellers-product-api-spec.md`](./2026-07-21-sellers-product-api-spec.md)(`/detail/[id]` 상품 상세용, 공개 페이지, 단건 조회)와 응답 스키마가 완전히 동일하지만, **호출 페이지가 로그인 필수 라우트(`/reader`)라 인증 요건이 다르다.** 그래서 `sellers/product`가 아니라 `users/order-product` 네임스페이스로 분리한다.

## 시퀀스 (전체 그림 — User 서비스는 이 중 세 번째 호출만 담당)

```
Client -> GET /api/v2/orders/products/{productId}  (Order 서비스 — 구매 소유권 확인, 다른 팀 담당)
       <- (Order/Product 서비스 스코프, 이 문서 범위 아님)

Client -> GET /api/v2/products/{productId}/orders  (Product 서비스 — 상품 상세 + sellerId, 다른 팀 담당)
       <- model, productType, title, content/notionUrl/fileUrl, thumbnailUrl, sellerId, averageRatingReview

Client -> GET /api/v2/users/order-product?sellerId={sellerId}   ← 이 문서의 범위
       <- sellerName, profileImageUrl
```

앞의 두 호출(Order 소유권 확인, Product 상세 조회)은 각각 Order/Product 서비스 담당이며 이 문서의 스코프가 아니다. User 서비스는 Product 응답에 담긴 `sellerId`를 그대로 받아 이름/프로필 이미지만 돌려준다 — Product·Order 도메인 데이터에 의존하지 않는다.

## 프론트 연동 범위 (참고)

- 오늘 스코프: 이 문서(스펙) + `lib/sellers.ts`의 `getOrderProductSellerProfile(sellerId)` 소비 함수만 추가한다.
- **reader 페이지 연동은 이번 스코프에서 제외.** 위 시퀀스의 앞 두 호출(Order/Product)이 아직 프론트에 연동되지 않아 reader 페이지가 `sellerId`를 얻을 방법이 없다 — 그 두 엔드포인트가 연동되는 후속 작업에서 reader 페이지 판매자 카드를 이 API로 교체한다.

## 엔드포인트

```
GET /api/v2/users/order-product
```

### 메서드: GET (POST 아님)

`/sellers/product`와 동일한 이유 — 단건 조회이고 같은 `sellerId`면 항상 같은 응답이 나온다.

### 인증

**필요.** `/reader`는 로그인 필수 라우트(middleware `AUTH_REQUIRED`)이므로 이 엔드포인트도 표준 인증 미들웨어(헤더에서 userId 추출, 유효하지 않으면 401)를 적용한다.

**단, `sellerId`에 대한 소유권 검증(요청자가 실제로 이 판매자에게서 구매했는지)은 하지 않는다.** 이유:
- 응답 필드(`sellerName`, `profileImageUrl`)는 `/sellers/product`로 누구나 조회 가능한 비민감 공개 정보라, 소유권 검증이 실질적인 보안 이득을 주지 않는다.
- 소유권 검증을 하려면 User 서비스가 Order 서비스(또는 그 데이터)에 의존해야 하는데, `sellers/product` 스펙에서 이미 확정한 "User가 다른 서비스의 소유 데이터에 의존하지 않는다" 원칙과 충돌한다.
- 구매 여부 자체는 이미 앞단 Order 서비스 호출에서 걸러진다 — User 서비스가 중복 검증할 필요가 없다.

### 요청

```
GET /api/v2/users/order-product?sellerId=3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f
Authorization: Bearer {accessToken}
```

- `sellerId`는 UUID string (쿼리 파라미터).
- `sellerId`가 없거나 UUID 형식이 아니면 `400`.
- `Authorization` 헤더가 없거나 유효하지 않으면 `401`.

### 응답 (200)

기존 v2 API와 동일하게 `{ data: ... }` 봉투로 감싼다. **`/sellers/product`와 응답 필드가 완전히 동일하다.**

```json
{
  "data": {
    "sellerName": "김철수",
    "profileImageUrl": "https://.../profile.png"
  }
}
```

- `sellerName`, `profileImageUrl` 두 필드만 내려준다.
- `profileImageUrl`을 등록하지 않은 판매자는 `null` (에러 아님).
- 별점 평균, 뱃지 등 다른 필드는 이번 스코프에서 제외.

### 존재하지 않는 sellerId (404)

`sellerId` 형식은 유효하지만 실제로 존재하지 않는 판매자면 `404`. (형식 오류는 `400`, 존재 여부는 `404`로 구분 — `sellers/product` 스펙과 동일한 원칙.)

## 캐싱

**없음.** reader 페이지는 이미 구매한 사용자가 자기 콘텐츠를 보는 저트래픽 경로라 캐싱 이득이 크지 않고, 인증이 필요한 응답을 공유 캐시(`public`)로 열어두면 안 되므로 처음부터 캐시 헤더 없이 DB 직접 조회로 시작한다. 트래픽을 보고 필요 시 재검토(`private, max-age=...` 등).

## 라우트 네이밍

`POST /users/order-products`(배치, 마이페이지 구매 탭용, 이미 존재)와 짝을 맞춰 `order-product`(단수)로 명명한다 — `sellers/product`(단수) vs `sellers/products`(복수) 관계와 동일한 패턴.

## 버전

User 서비스의 다른 라우트와 동일하게 `v2` 프리픽스를 사용한다.

## 확정되지 않은 사항 / 후속 확인 필요

- reader 페이지가 `sellerId`를 얻을 경로(Order 소유권 확인 `GET /orders/products/{productId}`, Product 상세 `GET /products/{productId}/orders`)는 각각 Order/Product 서비스 담당자가 별도로 연동한다. 그 연동이 끝나면 reader 페이지 판매자 카드를 이 API로 교체하는 후속 작업이 필요하다.
