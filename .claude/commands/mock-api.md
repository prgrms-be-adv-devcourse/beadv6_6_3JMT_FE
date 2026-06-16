# /mock-api — MSW Mock API 구축

MSW(Mock Service Worker)를 사용해 백엔드 없이 프론트가 완전히 동작하도록 Mock API를 구축한다.
API 명세 확정 후 Axios 실제 호출로 교체하는 것이 최종 목표다.

---

## 전제 조건

- Next.js (App Router) + TypeScript 프로젝트
- `lib/api.ts`에 Axios 인스턴스 구성 완료
- `NEXT_PUBLIC_API_URL` 환경변수 사용

---

## 파일 구조

```
mocks/
├── browser.ts              # setupWorker + 전체 핸들러 연결
├── handlers/
│   ├── index.ts            # 핸들러 집합 export
│   ├── auth.ts             # POST /api/v1/auth/{login,signup,logout}
│   ├── products.ts         # GET·POST·PUT·DELETE /api/v1/products
│   ├── users.ts            # GET·PUT /api/v1/users/me + orders, wishlist
│   ├── wishlist.ts         # POST·DELETE /api/v1/wishlist/:productId
│   ├── sellers.ts          # /api/v1/sellers/* (apply, stats, payments)
│   ├── orders.ts           # POST /api/v1/orders
│   └── notifications.ts    # GET·POST /api/v1/notifications
├── data/
│   ├── products.ts         # 12개 mock 상품 데이터 + 버전 이력
│   └── users.ts            # mock 유저, 주문, 찜, 알림 데이터
└── utils.ts                # ok(), ERR.*, paginate(), extractToken()
```

`components/providers/MockProvider.tsx` — `useEffect`에서 워커 start
`app/layout.tsx` — `<MockProvider>` 주입

---

## 설치 및 초기화

```bash
npm install msw --save-dev

# Node.js ≥ v20.12.0
npx msw init public/ --save

# Node.js < v20.12.0 (수동 복사)
cp node_modules/msw/lib/mockServiceWorker.js public/mockServiceWorker.js
```

## 환경변수 (.env.local)

```
NEXT_PUBLIC_API_MOCKING=enabled
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 응답 규칙

### 성공 (단건)

```json
{ "success": true, "data": { ... }, "message": "success" }
```

### 성공 (목록 / 페이지네이션)

```json
{
  "success": true,
  "data": [],
  "message": "success",
  "meta": { "page": 1, "size": 20, "total": 128, "hasNext": true }
}
```

utils.ts 헬퍼:
- `ok(data, status?)` — 단건 성공 응답
- `okList(items, page, size, status?)` — 페이지네이션 응답 (`meta` 포함)

### 에러 케이스

| 상황 | status | code |
|------|--------|------|
| 토큰 없음 / 만료 | 401 | `UNAUTHORIZED` |
| 권한 부족 (buyer→seller 전용 API) | 403 | `FORBIDDEN` |
| 리소스 없음 | 404 | `NOT_FOUND` |
| 입력값 검증 실패 | 422 | `VALIDATION_ERROR` |
| 서버 오류 시뮬레이션 | 500 | `SERVER_ERROR` |

에러 응답 body:
```json
{ "success": false, "data": null, "message": "프로덕트가 없습니다.", "code": "NOT_FOUND" }
```

---

## 인증 토큰 형식

Mock 전용 토큰: `"mock-token::{userId}"`

- `extractToken(request)` → Authorization 헤더에서 Bearer 토큰 추출
- `getUserIdFromToken(token)` → `"::"` 뒤의 userId 파싱

실제 백엔드 교체 시 이 두 함수만 제거하면 된다.

---

## MockProvider 패턴

```tsx
// components/providers/MockProvider.tsx
'use client';
import { useEffect } from 'react';

export default function MockProvider({ children }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return;
    import('../../mocks/browser').then(({ worker }) => {
      worker.start({ onUnhandledRequest: 'bypass' });
    });
  }, []);
  return <>{children}</>;
}
```

`onUnhandledRequest: 'bypass'` — MSW가 처리하지 않는 요청(Next.js 내부, CDN 등)은 그대로 통과.

---

## API 엔드포인트 목록

전체 명세는 `docs/api-spec.md` 참고.

| 도메인 | 메서드 | 경로 | 인증 |
|--------|--------|------|------|
| Auth | POST | `/api/v1/auth/login` | - |
| Auth | POST | `/api/v1/auth/signup` | - |
| Auth | POST | `/api/v1/auth/logout` | Bearer |
| Products | GET | `/api/v1/products` | - |
| Products | GET | `/api/v1/products/:id` | - |
| Products | GET | `/api/v1/products/:id/related` | - |
| Products | POST | `/api/v1/products` | Bearer (seller) |
| Products | PUT | `/api/v1/products/:id` | Bearer (seller) |
| Products | DELETE | `/api/v1/products/:id` | Bearer (seller) |
| Users | GET | `/api/v1/users/me` | Bearer |
| Users | PUT | `/api/v1/users/me` | Bearer |
| Users | GET | `/api/v1/users/me/orders` | Bearer |
| Users | GET | `/api/v1/users/me/wishlist` | Bearer |
| Wishlist | POST | `/api/v1/wishlist/:productId` | Bearer |
| Wishlist | DELETE | `/api/v1/wishlist/:productId` | Bearer |
| Sellers | POST | `/api/v1/sellers/apply` | Bearer |
| Sellers | GET | `/api/v1/sellers/apply-status` | Bearer |
| Sellers | GET | `/api/v1/sellers/me/products` | Bearer (seller) |
| Sellers | GET | `/api/v1/sellers/me/stats` | Bearer (seller) |
| Sellers | GET | `/api/v1/sellers/me/payments` | Bearer (seller) |
| Orders | POST | `/api/v1/orders` | Bearer |
| Notifications | GET | `/api/v1/notifications` | Bearer |
| Notifications | POST | `/api/v1/notifications/:id/read` | Bearer |

---

## Axios 실제 호출로 교체 시 체크리스트

1. `.env.local`에서 `NEXT_PUBLIC_API_MOCKING=enabled` 제거 또는 `disabled`로 변경
2. `NEXT_PUBLIC_API_URL`을 실제 서버 주소로 교체
3. `lib/api.ts`의 인터셉터에서 `mock-token::` 형식을 실제 JWT로 교체
4. 페이지에서 로컬 mock 상수 대신 `api.get('/api/v1/products')` 호출로 교체
5. `mocks/` 디렉토리와 `components/providers/MockProvider.tsx` 삭제


## 실제 API 교체 시
1. app/layout.tsx에서 MSW 초기화 제거
2. lib/api.ts baseURL을 실제 서버로 변경
3. 각 페이지 fetch 로직은 그대로 유지