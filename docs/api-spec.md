# PromptHub API 명세

Base URL: `http://localhost:3000/api/v1` (MSW Mock)
인증: `Authorization: Bearer {token}`

---

## 공통 응답 형식

### 성공 (단건)
```json
{
  "success": true,
  "data": { ... },
  "message": "success"
}
```

### 성공 (목록 / 페이지네이션)
```json
{
  "success": true,
  "data": [],
  "message": "success",
  "meta": {
    "page": 1,
    "size": 20,
    "total": 128,
    "hasNext": true
  }
}
```

### 에러
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "code": "에러코드"
}
```

| code | status | 설명 |
|------|--------|------|
| `UNAUTHORIZED` | 401 | 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 권한 없음 (buyer → seller 전용 API 등) |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 422 | 입력값 오류 |
| `SERVER_ERROR` | 500 | 서버 내부 오류 |

---

## Auth

### POST /api/v1/auth/login

**Request**
```json
{
  "email": "kms12782@nangman.cloud",
  "password": "password123"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1",
      "name": "김민서",
      "email": "kms12782@nangman.cloud",
      "role": "buyer"
    },
    "token": "mock-token::user-1"
  },
  "message": "success"
}
```

> 역할 결정 규칙: 이메일에 `seller` 포함 또는 `@prompthub.kr` 도메인 → `seller`, 그 외 → `buyer`

---

### POST /api/v1/auth/signup

**Request**
```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "serviceAgree": true
}
```

> `serviceAgree` — 서비스 이용약관 및 개인정보 처리방침 동의 여부 (필수, `true`만 허용)

**Response 200** — 로그인과 동일한 형식

---

### POST /api/v1/auth/logout

인증 필요.

**Response 200**
```json
{ "success": true, "data": { "message": "로그아웃 되었습니다." }, "message": "success" }
```

---

### PUT /api/v1/auth/password (인증 필요)

비밀번호 변경.

**Request**
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

> `newPassword` — 8자 이상 필수. 현재 비밀번호와 동일 불가.

**Response 200**
```json
{ "success": true, "data": { "message": "비밀번호가 변경되었습니다." }, "message": "success" }
```

**에러 케이스**

| 상황 | code | status |
|------|------|--------|
| 토큰 없음 | `UNAUTHORIZED` | 401 |
| 현재 비밀번호 불일치 | `VALIDATION_ERROR` | 422 |
| 새 비밀번호 8자 미만 | `VALIDATION_ERROR` | 422 |
| 현재·새 비밀번호 동일 | `VALIDATION_ERROR` | 422 |

---

### POST /api/v1/auth/oauth/kakao

Kakao authorization code를 서버가 처리하여 앱 토큰을 발급한다.

클라이언트는 Kakao OAuth 인증 페이지로 리다이렉트 후 받은 `code`를 이 엔드포인트로 전달한다.

**Kakao 인증 URL**
```
https://kauth.kakao.com/oauth/authorize
  ?client_id={KAKAO_CLIENT_ID}
  &redirect_uri={origin}/auth/kakao/callback
  &response_type=code
```

**Request**
```json
{ "code": "authorization-code-from-kakao" }
```

**Response 200** — 로그인과 동일한 형식
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-kakao-1718500000000",
      "name": "카카오사용자",
      "email": "kakao@user.com",
      "role": "buyer"
    },
    "token": "mock-token::user-kakao-1718500000000"
  },
  "message": "success"
}
```

> Kakao OAuth 플로우: 버튼 클릭 → Kakao 인증 페이지 → `/auth/kakao/callback?code=...` 콜백 → 이 API 호출 → 로그인 완료

---

## Products

### GET /api/v1/product

**Query Parameters**

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `q` | string | `""` | 제목/설명 검색 |
| `category` | string | `"all"` | `all\|image\|writing\|coding\|marketing\|chatbot\|data` |
| `sort` | string | `"popular"` | `popular\|rating\|price-asc\|price-desc` |
| `page` | number | `1` | 페이지 번호 |
| `size` | number | `20` | 페이지당 항목 수 |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "사진 같은 제품 목업 생성기",
      "category": "image",
      "icon": "image",
      "model": "Midjourney v6",
      "amount": 5900,
      "originalAmount": null,
      "rating": 4.9,
      "salesCount": 1240,
      "seller": "비주얼랩",
      "sellerId": "seller-1",
      "badge": "신규",
      "desc": "...",
      "thumbnail_url": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "message": "success",
  "meta": {
    "page": 1,
    "size": 20,
    "total": 12,
    "hasNext": false
  }
}
```

---

### GET /api/v1/product/:id

**Response 200**
```json
{
  "data": {
    "id": 1,
    "title": "사진 같은 제품 목업 생성기",
    "category": "image",
    "icon": "image",
    "model": "Midjourney v6",
    "amount": 5900,
    "rating": 4.9,
    "salesCount": 1240,
    "seller": "비주얼랩",
    "sellerId": "seller-1",
    "badge": "신규",
    "desc": "...",
    "thumbnail_url": null,
    "content": "[상품명]\n\n전체 내용은 구매 후 확인...",
    "versions": [
      { "ver": "v1.3", "date": "2026-06-01", "note": "조명 프리셋 3종 추가" },
      { "ver": "v1.2", "date": "2026-05-10", "note": "배경 제거 옵션 개선" }
    ],
    "features": ["고해상도 출력 지원", "상업적 이용 가능", "버전 업데이트 무료 제공"],
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-06-01T00:00:00.000Z"
  }
}
```

**Response 404** — 존재하지 않는 id

---

### GET /api/v1/product/:id/related

**Query Parameters**: `limit` (default: 4)

**Response 200** — 동일 카테고리의 상품 배열 (product 배열과 동일한 item 형식)

---

### GET /api/v1/product/:id/rating (인증 필요)

내 별점 조회

**Response 200**
```json
{ "success": true, "data": { "rating": 4 }, "message": "success" }
```
- `rating` 0이면 미평가 상태

---

### POST /api/v1/product/:id/rating (인증 필요)

별점 등록 / 수정 (재평가 가능)

**Request**
```json
{ "rating": 4 }
```
- `rating` 1~5 정수

**Response 200**
```json
{ "success": true, "data": { "rating": 4 }, "message": "success" }
```

---

### POST /api/v1/product (인증 필요, seller 전용)

**Request**
```json
{
  "title": "새 프롬프트 제목",
  "category": "coding",
  "model": "Claude 3.5",
  "desc": "설명",
  "amount": 5000,
  "content": "실제 프롬프트 내용"
}
```

**Response 201** — 생성된 product 객체

---

### PUT /api/v1/product/:id (인증 필요, 본인 상품만)

**Request** — 수정할 필드만 포함 (partial update)

```json
{
  "title": "string (선택)",
  "category": "string (선택)",
  "model": "string (선택)",
  "amount": 4900,
  "desc": "string (선택)",
  "content": "string (선택)",
  "versionType": "PATCH | MAJOR",
  "changeReason": "string (최대 500자, 필수)"
}
```

**버전 계산 규칙**

| versionType | 버전 변경 | status 변경 |
|-------------|---------|------------|
| `PATCH` | patch +1 (예: v1.3 → v1.4) | 변경 없음 — 즉시 적용 |
| `MAJOR` | major +1, patch = 0 (예: v1.3 → v2.0) | `review`로 전환 — 관리자 검수 후 적용 |

**Response 200** — 업데이트된 product 객체 (versions 배열 포함)

**에러 케이스**

| 상황 | code | status |
|------|------|--------|
| 비로그인 | `UNAUTHORIZED` | 401 |
| 타인의 상품 수정 시도 | `FORBIDDEN` | 403 |
| 검수 중(`status: 'review'`) 상품 수정 시도 | `CONFLICT` | 409 |

---

### DELETE /api/v1/product/:id (인증 필요, 본인 상품만)

판매 중단 처리. 중단된 상품은 재등록할 수 없습니다.

**Response 200**
```json
{ "success": true, "data": { "message": "삭제되었습니다." }, "message": "success" }
```

---

## Users

### GET /api/v1/users/me (인증 필요)

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "user-1",
    "name": "김민서",
    "email": "kms12782@nangman.cloud",
    "role": "buyer"
  },
  "message": "success"
}
```

---

### PUT /api/v1/users/me (인증 필요)

**Request** — 수정할 필드만 포함
```json
{ "name": "새이름", "email": "new@example.com", "password": "password" }
```

**Response 200** — 업데이트된 user 객체 (공통 단건 형식)

---

### DELETE /api/v1/users/me (인증 필요)

회원 탈퇴. 탈퇴 후 계정 및 모든 데이터에 접근 불가.

**Response 200**
```json
{ "success": true, "data": { "message": "회원 탈퇴가 완료됐어요." }, "message": "success" }
```

**에러 케이스**

| 상황 | code | status |
|------|------|--------|
| 토큰 없음 | `UNAUTHORIZED` | 401 |

---

## Wishlist

### POST /api/v1/wishlists (인증 필요)

**Request**
```json
{ "productId": "uuid" }
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "wishlistId": "wl-1718500000000",
    "productId": 1,
    "createdAt": "2026-06-17T10:00:00"
  },
  "message": "success"
}
```

**에러 케이스**

| 상황 | code | status |
|------|------|--------|
| 이미 찜한 상품 | `VALIDATION_ERROR` | 409 |

---

### DELETE /api/v1/wishlists/:wishlistId (인증 필요)

**Response 204** — No Content

**에러 케이스**

| 상황 | code | status |
|------|------|--------|
| 본인 찜 아님 | `FORBIDDEN` | 403 |
| 존재하지 않는 wishlistId | `NOT_FOUND` | 404 |

---

### GET /api/v1/wishlists (인증 필요)

**Query Parameters**: `page` (default: 0), `size` (default: 20)

**Response 200**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "wishlistId": "wl-1",
        "productId": 3,
        "createdAt": "2026-06-01T00:00:00.000Z",
        "product": { }
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2
  },
  "message": "success"
}
```

---

### GET /api/v1/wishlists/exists (인증 필요)

상품 상세 진입 시 하트 버튼 활성화 여부 판단용.

**Query Parameters**: `productId` (required)

**Response 200**
```json
{ "success": true, "data": { "wished": true }, "message": "success" }
```

---

## Sellers

### POST /api/v1/seller (인증 필요)

**Request**
```json
{
  "selectedCategories": ["image", "writing"],
  "introduction": "안녕하세요, 판매자입니다.",
  "portfolioLink": "https://portfolio.example.com",
  "agreedToTerms": true
}
```

**Response 201**
```json
{ "success": true, "data": { "status": "pending", "message": "신청이 접수되었습니다. 검토 후 승인됩니다." }, "message": "success" }
```

---

### GET /api/v1/sellers/apply-status (인증 필요)

**Response 200**
```json
{ "success": true, "data": { "status": "pending" }, "message": "success" }
```

> status 값: `not_applied | pending | approved | rejected`

---

### GET /api/v1/sellers/me/products (인증 필요, seller 전용)

**Response 200** — 공통 단건 형식, `data`는 본인이 등록한 product 배열 (`status` 필드 포함)

---

### GET /api/v1/sellers/me/stats (인증 필요, seller 전용)

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalSalesCount": 2110,
    "totalRevenue": 11890000,
    "rating": 4.8
  },
  "message": "success"
}
```

---

### GET /api/v1/sellers/me/payments (인증 필요, seller 전용)

**Query Parameters**: `status` — `paid | requested | refunded` (생략 시 전체)

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "pay-1",
      "productId": 1,
      "amount": 5900,
      "status": "paid",
      "paidAt": "2026-06-10T00:00:00.000Z"
    }
  ],
  "message": "success"
}
```

---

## Payments

### POST /api/v1/payments/confirm (인증 필요)

결제 처리 + 주문 생성을 단일 호출로 수행. `productIds`는 반드시 `number[]`로 전송.

**Request**
```json
{ "productIds": [1, 2] }
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-1718500000000",
    "orderId": "order-1718500000000",
    "totalAmount": 14700,
    "status": "paid"
  },
  "message": "success"
}
```

> Mock 동작: 즉시 결제 완료 처리. Toss PG 연동 후(Phase 11) 실제 결제 흐름으로 교체 예정.

---

## Orders

### GET /api/v1/orders (인증 필요)

내 주문 목록 조회. JWT 기반으로 본인 주문만 반환.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order-101",
      "purchasedAt": "2026-06-01T00:00:00.000Z",
      "product": { }
    }
  ],
  "message": "success"
}
```

---

### POST /api/v1/orders (인증 필요)

**Request**
```json
{ "productIds": [1, 2, 4] }
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "orderId": "order-1718500000000",
    "totalAmount": 14700,
    "products": []
  },
  "message": "success"
}
```

---

## Notifications

### GET /api/v1/notifications (인증 필요)

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "icon": "🛒",
      "text": "새 상품이 출시되었습니다.",
      "timestamp": "2026-06-16T09:00:00.000Z",
      "read": false
    }
  ],
  "message": "success"
}
```

---

### POST /api/v1/notifications/:id/read (인증 필요)

**Response 200** — 업데이트된 notification 객체

---

## 타입 정의

### Product
```typescript
type Product = {
  id: number;
  title: string;
  category: 'image' | 'writing' | 'coding' | 'marketing' | 'chatbot' | 'data';
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number;
  salesCount: number;
  seller: string;
  sellerId: string;
  badge?: string;
  desc: string;
  thumbnail_url: string | null;
  content?: string;                    // 구매자에게만 노출
  status?: 'active' | 'review';       // 판매중(기본) | 검수 대기
  createdAt: string;                   // ISO 8601
  updatedAt: string;
};
```

### User
```typescript
type User = {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller';
};
```

### Order
```typescript
type Order = {
  orderId: string;
  purchasedAt: string;
  product: Product;
};
```
