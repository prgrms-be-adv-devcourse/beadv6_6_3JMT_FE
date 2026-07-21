# POST /api/v2/sellers/products — 판매자 이름 배치 조회 API 스펙

- 작성일: 2026-07-20
- 담당: user-service
- 배경: `/browse`(상품 목록 조회) 프론트 명세 변경. Client가 `GET /products` 응답에서 `sellerId` 목록을 추출한 뒤, User 서비스에 2차로 판매자 이름을 배치 조회한다.
- 수정: `sellerId` 타입을 정수 → UUID string으로 정정 (실제 도메인 모델(`user.user_id`, `SellerInfoResult.sellerId`, gRPC 배치 조회)이 전부 UUID string이라는 점을 user-service 담당자가 확인함. 최초 문서의 `[1, 2, 3]` 예시는 그릴링 다이어그램의 단순 placeholder였음).
- 수정(2026-07-21): 엔드포인트 경로를 `POST /sellers/batch` → `POST /sellers/products`로 변경 (API 명칭 변경).

## 시퀀스 (waterfall)

```
Client -> GET /api/v2/products (요청 데이터 없음)
       <- productList [{ productId, salesCount, sellerId, onSale, productDetail, ... }]
          (Product 서비스는 내부적으로 review 서비스에서 average review를 받아 병합)

Client -> POST /api/v2/sellers/products (productList에서 추출한 sellerId 목록)
       <- sellerName 목록
```

`/products` 응답이 온 뒤에만 `/sellers/products`를 호출한다(순차 호출, 병렬 아님). Product가 sellerName을 비정규화해서 들고 있는 방식은 검토했으나 채택하지 않음 — 이 구조를 그대로 확정.

## 엔드포인트

```
POST /api/v2/sellers/products
```

기존 `POST /seller`(판매자 등록), `GET /sellers/apply-status`(신청 상태 조회, 인증 필요)와 이름이 겹치지 않도록 `/sellers/products`로 경로를 분리했다.

### 인증

불필요. `/browse`는 비로그인 사용자도 접근하는 공개 페이지이므로 이 엔드포인트도 인증 없이 호출 가능해야 한다.

### 요청

```json
{
  "sellerIds": ["3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f", "8a1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e"]
}
```

`sellerId`는 정수가 아니라 **UUID string**이다 (`user.user_id`, `SellerInfoResult.sellerId`, gRPC 배치 조회 파라미터가 전부 UUID string 기반인 기존 도메인 모델과 동일하게 맞춘다). 그릴링 당시 다이어그램 예시가 `[1, 2, 3]`처럼 단순 정수였던 건 표기 편의상 placeholder였을 뿐, 실제 식별자 타입을 바꾸는 결정이 아니었다.

- 최상위를 배열로 두지 않고 객체로 래핑한다 (향후 필드 확장 대비, 일부 미들웨어의 최상위 배열 처리 이슈 회피).
- **배치 상한: 최대 30개.** 초과 시 400.
- **중복 sellerId는 서버가 dedupe** 처리한다. 클라이언트에 dedupe 책임을 지우지 않는다.
- **입력 검증(형식)은 엄격하게 처리한다**: 빈 배열, UUID 형식이 아닌 값(문자열이 아니거나 UUID 포맷에 맞지 않는 값) 등 형식이 잘못된 요청은 400으로 명확히 거부한다. (반대로 "형식은 맞지만 존재하지 않는 sellerId"는 아래 응답 섹션대로 관대하게 처리 — 이 둘은 성격이 다른 문제이므로 구분한다.)

### 응답 (200)

기존 v2 API와 동일하게 `{ data: ... }` 봉투로 감싼다.

```json
{
  "data": {
    "sellers": [
      { "sellerId": "3f2b6c1a-9d4e-4b8a-9c3f-1a2b3c4d5e6f", "sellerName": "김철수" },
      { "sellerId": "8a1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e", "sellerName": null }
    ]
  }
}
```

- `sellerName` 필드 하나만 내려준다. User 서비스가 갖고 있는 다른 개인정보(이메일, 전화번호, 가입일 등)는 절대 포함하지 않는다.
- 문자열 배열(순서 매칭 방식)은 채택하지 않는다 — 중복/누락 sellerId가 섞이면 순서가 깨져 클라이언트가 엉뚱한 이름을 엉뚱한 상품에 매칭할 위험이 있다.
- 요청한 sellerId가 존재하지 않는 경우(탈퇴/삭제 등) 해당 항목은 응답에서 빠지지 않고 `sellerName: null`로 포함한다. 이 경우 때문에 전체 요청을 실패 처리하지 않는다 — Product 서비스가 이미 상품 목록을 내려준 상태에서 판매자 이름 하나 때문에 `/browse` 전체가 깨지면 안 된다.

### 에러 응답 (400)

빈 배열, UUID 형식이 아닌 값, 30개 초과 시 User 서비스의 기존 에러 포맷을 그대로 따른다 (별도 스키마 신설 없음).

## 캐싱

없음. DB 직접 조회로 시작하고, 트래픽을 보고 필요 시 재검토한다.

- HTTP 레벨 캐싱(CDN/브라우저)은 이 엔드포인트에 적용하기 어렵다 — 매 요청마다 sellerId 조합이 달라(검색/정렬/페이지에 따라 상품 목록이 바뀜) 캐시 히트가 거의 발생하지 않는다.
- 향후 캐싱이 필요해지면 개별 sellerId 단위 애플리케이션 레벨 캐시(Redis 등)로 접근해야 한다 — HTTP 메서드(GET/POST)와 무관한 문제.

## 버전

User 서비스의 다른 라우트와 동일하게 `v2` 프리픽스를 사용한다.

## 확정되지 않은 사항 / 후속 확인 필요

- `/products` 한 페이지당 실제 상품 수 상한(=sellerId 후보 수 상한)은 Product 서비스 쪽에 정확한 값을 확인하지 않은 채 "30개"로 잡음. 실제 페이지 크기가 이보다 크면 상한을 재조정해야 한다.
