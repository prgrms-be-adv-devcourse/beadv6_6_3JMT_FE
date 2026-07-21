# GET /api/v2/sellers/product — 상품 상세용 판매자 정보 단건 조회 API 스펙

- 작성일: 2026-07-21
- 담당: user-service
- 배경: `/detail/[id]`(상품 상세) 페이지에서 판매자 카드를 표시하기 위한 명세. Client가 `GET /products/{productId}` 응답의 `sellerId`를 그대로 전달해 판매자 이름/프로필 이미지를 조회한다.
- 이 문서는 [`2026-07-20-sellers-batch-api-spec.md`](./2026-07-20-sellers-batch-api-spec.md)(배치 조회, `/browse`용)와 목적이 다르다 — 이쪽은 **단건 조회**다. 라우트 이름이 `sellers/product`(단수)/`sellers/products`(복수)로 한 글자 차이라 혼동 소지가 있으니 주의.

## 시퀀스

```
Client -> GET /api/v2/products/{productId} (요청 데이터 없음)
       <- productList [{ productId, salesCount, sellerId, onSale, productDetail, ... }]

Client -> GET /api/v2/sellers/product?sellerId={sellerId}
       <- sellerName, profileImageUrl
```

`/products/{productId}` 응답이 온 뒤, 그 안의 `sellerId`를 그대로 넘겨서 호출한다. User 서비스가 productId로 sellerId를 역으로 알아내는 방식은 채택하지 않음 — Product 소유 데이터(상품→판매자 매핑)에 User가 의존하게 되는 걸 피하기 위함.

## 엔드포인트

```
GET /api/v2/sellers/product
```

### 메서드: GET (POST 아님)

단건 조회라 같은 `sellerId`면 항상 같은 응답이 나온다 — 배치 조회(`/sellers/products`)와 달리 요청 조합이 매번 바뀌지 않으므로 HTTP 캐싱 이득을 실제로 볼 수 있다. 최초 다이어그램은 POST로 그려졌으나, 백엔드 구현 전 단계였으므로 GET으로 변경.

### 인증

불필요. `/detail/[id]`는 비로그인 사용자도 접근하는 공개 페이지다. **인증 미들웨어(헤더에서 userId 추출)를 이 라우트에 적용하면 안 된다** — 헤더의 userId는 "요청자가 누구인지"이고, 이 엔드포인트가 필요로 하는 sellerId는 "조회 대상이 누구인지"라 서로 다른 개념이다. 요청자와 조회 대상(판매자)은 보통 다른 사람이다.

### 요청

```
GET /api/v2/sellers/product?sellerId=3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f
```

- `sellerId`는 UUID string (쿼리 파라미터).
- `sellerId`가 없거나 UUID 형식이 아니면 `400`.

### 응답 (200)

기존 v2 API와 동일하게 `{ data: ... }` 봉투로 감싼다.

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
- 판매자 소개/뱃지/등록 상품 개수("seller info") 등은 이번 스코프에서 제외됐다. 필요해지면 별도 논의.

### 존재하지 않는 sellerId (404)

`sellerId` 형식은 유효하지만 실제로 존재하지 않는 판매자면 `404`. (형식 오류는 `400`, 존재 여부는 `404`로 구분 — 배치 조회 스펙과 같은 원칙.)

## 캐싱

`Cache-Control: public, max-age=300` — 같은 sellerId는 항상 같은 응답이라 CDN/브라우저 캐시가 실제로 유효하다.

## 라우트 네이밍

`POST /seller`(등록), `GET /sellers/apply-status`(신청 상태), `POST /sellers/products`(배치 조회, `/browse`용)와 별개의 라우트다. `sellers/product` vs `sellers/products` 한 글자 차이는 프론트와 이미 합의된 이름이라 그대로 유지 — 재조율 비용이 이름 개선 이득보다 크다고 판단.

## 버전

User 서비스의 다른 라우트와 동일하게 `v2` 프리픽스를 사용한다.
