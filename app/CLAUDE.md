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

---

## / (홈) — app/page.tsx 리팩토링 플랜

### 추출할 페이지 섹션 → `app/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `HeroSection.tsx` | 히어로 섹션 (ShaderBackground + 검색바 + 인기태그 + 목업 이미지) |
| `SearchBar.tsx` | 포커스 상태 관리 포함 검색 입력 폼 |
| `PopularTags.tsx` | 인기 검색어 태그 버튼 목록 |
| `PopularGrid.tsx` | 인기 프롬프트 그리드 섹션 |
| `CategorySection.tsx` | 카테고리별 탐색 그리드 섹션 |
| `WhySection.tsx` | "왜 PromptHub일까요?" 3열 카드 섹션 |
| `SellerCTA.tsx` | 판매자 유도 CTA 배너 섹션 |
| `SectionHead.tsx` | 섹션 헤더 (title + sub + 전체보기 버튼) |

### 이동할 상수 → `lib/constants.ts`

- `CATEGORIES` — 6개 페이지 중복
- `TAGS` (인기 검색 태그) — 홈 전용이므로 `app/_components/PopularTags.tsx` 내부에 유지 가능

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
- `PopularTags`의 `onMouseEnter/Leave` hover 효과 → Tailwind `hover:` 변형으로 전환

## middleware.ts 규칙
- 루트 레벨에 생성 (prompthub/middleware.ts)
- 권한별 라우팅 보호 기준:
    - 비로그인 접근 금지: /sell, /shop, /mypage, /reader/[id], /edit/[id], /apply
    - 판매자만 접근 가능: /sell, /shop, /edit/[id]
    - 비로그인 접근 시 → /로 리다이렉트
    - 비판매자가 판매자 페이지 접근 시 → /mypage로 리다이렉트