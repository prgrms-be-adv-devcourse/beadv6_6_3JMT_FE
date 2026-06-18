# /browse — 프롬프트 탐색

## 역할
카테고리 필터 + 검색어 + 정렬로 프롬프트 목록을 탐색하는 페이지.
`useSearchParams` 사용으로 `BrowseScreen`을 `Suspense`로 래핑하는 구조.

---

## 리팩토링 플랜

### 추출할 컴포넌트

| 현위치 | 이동 대상 | 비고 |
|--------|-----------|------|
| `CardGridSkeleton` (line 35) | `app/browse/_components/CardGridSkeleton.tsx` | 로딩 스켈레톤 |
| 검색 초기화 버튼 영역 | `app/browse/_components/FilterBar.tsx` | 쿼리 배지 + 정렬 버튼 |

### 이동할 상수 → `lib/constants.ts`

- `CATEGORIES` (id/label/icon/desc 배열) — 6개 페이지 중복

### 인라인 스타일 → Tailwind 전환

- 모든 `style={{}}` → `--ph-*` 토큰 기반 Tailwind 클래스
- `BrowseScreen` 내 그리드·flex 레이아웃 포함

### 패턴 유지

- `BrowseScreen` + `Suspense` 래핑 구조는 Next.js `useSearchParams` 요건이므로 유지.
