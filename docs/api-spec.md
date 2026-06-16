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
  "password": "password123"
}
```

**Response 200** — 로그인과 동일한 형식

---

### POST /api/v1/auth/logout

인증 필요.

**Response 200**
```json
{ "success": true, "data": { "message": "로그아웃 되었습니다." }, "message": "success" }
```

---

## Products

### GET /api/v1/products

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
      "cat": "image",
      "icon": "image",
      "model": "Midjourney v6",
      "price": 5900,
      "originalPrice": null,
      "rating": 4.9,
      "sales": 1240,
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

### GET /api/v1/products/:id

**Response 200**
```json
{
  "data": {
    "id": 1,
    "title": "사진 같은 제품 목업 생성기",
    "cat": "image",
    "icon": "image",
    "model": "Midjourney v6",
    "price": 5900,
    "rating": 4.9,
    "sales": 1240,
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

### GET /api/v1/products/:id/related

**Query Parameters**: `limit` (default: 4)

**Response 200** — 동일 카테고리의 상품 배열 (products 배열과 동일한 item 형식)

---

### POST /api/v1/products (인증 필요, seller 전용)

**Request**
```json
{
  "title": "새 프롬프트 제목",
  "cat": "coding",
  "model": "Claude 3.5",
  "desc": "설명",
  "price": 5000,
  "content": "실제 프롬프트 내용"
}
```

**Response 201** — 생성된 product 객체

---

### PUT /api/v1/products/:id (인증 필요, 본인 상품만)

**Request** — 수정할 필드만 포함 (partial update)

**Response 200** — 업데이트된 product 객체

---

### DELETE /api/v1/products/:id (인증 필요, 본인 상품만)

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
{ "name": "새이름", "email": "new@example.com" }
```

**Response 200** — 업데이트된 user 객체 (공통 단건 형식)

---

### GET /api/v1/users/me/orders (인증 필요)

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

### GET /api/v1/users/me/wishlist (인증 필요)

**Response 200** — 공통 단건 형식, `data`는 product 객체 배열

---

## Wishlist

### POST /api/v1/wishlist/:productId (인증 필요)

**Response 200**
```json
{ "success": true, "data": { "message": "찜 목록에 추가되었습니다." }, "message": "success" }
```

---

### DELETE /api/v1/wishlist/:productId (인증 필요)

**Response 200**
```json
{ "success": true, "data": { "message": "찜 목록에서 제거되었습니다." }, "message": "success" }
```

---

## Sellers

### POST /api/v1/sellers/apply (인증 필요)

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

**Response 200** — 공통 단건 형식, `data`는 본인이 등록한 product 배열

---

### GET /api/v1/sellers/me/stats (인증 필요, seller 전용)

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalSales": 2110,
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

## Orders

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
    "totalPrice": 14700,
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
  cat: 'image' | 'writing' | 'coding' | 'marketing' | 'chatbot' | 'data';
  icon: string;
  model: string;
  price: number;
  originalPrice?: number;
  rating: number;
  sales: number;
  seller: string;
  sellerId: string;
  badge?: string;
  desc: string;
  thumbnail_url: string | null;
  content?: string;       // 구매자에게만 노출
  createdAt: string;      // ISO 8601
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
