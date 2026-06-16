# /app 디렉토리 규칙

## 페이지 파일 원칙
- 각 라우트는 app/라우트명/page.tsx 로 생성
- page.tsx는 기본적으로 Server Component 유지
- 데이터 페칭 없이 UI만 있는 경우 Server Component로 충분
- useState/useEffect/이벤트 핸들러 필요 시에만 'use client' 추가

## 라우트 목록
- / → app/page.tsx (Home)
- /browse → app/browse/page.tsx
- /detail/[id] → app/detail/[id]/page.tsx
- /sell → app/sell/page.tsx
- /shop → app/shop/page.tsx
- /mypage → app/mypage/page.tsx
- /reader/[id] → app/reader/[id]/page.tsx
- /edit/[id] → app/edit/[id]/page.tsx
- /apply → app/apply/page.tsx

## 작업 순서
한 번에 하나의 페이지만 작업한다.
이전 페이지 확인 완료 후 다음 페이지로 넘어간다.

## middleware.ts 규칙
- 루트 레벨에 생성 (prompthub/middleware.ts)
- 권한별 라우팅 보호 기준:
    - 비로그인 접근 금지: /sell, /shop, /mypage, /reader/[id], /edit/[id], /apply
    - 판매자만 접근 가능: /sell, /shop, /edit/[id]
    - 비로그인 접근 시 → /로 리다이렉트
    - 비판매자가 판매자 페이지 접근 시 → /mypage로 리다이렉트