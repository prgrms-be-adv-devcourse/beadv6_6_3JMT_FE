# app/admin/sellers — 리팩토링 플랜

## 현황
- 약 241줄, 판매자 신청 목록 + 승인/반려 처리
- 구조는 단순: SectionCard > 탭 > 테이블
- `CATEGORY_LABEL` 상수 인라인 선언

## 인라인 상수 처리

### `CATEGORY_LABEL`
`admin/products/page.tsx`와 동일한 상수. 두 파일에 중복.
→ `app/admin/constants.ts` (어드민 공용) 또는 `lib/constants.ts`의 `CATEGORIES`에서 파생.

```ts
// lib/constants.ts의 CATEGORIES에서 파생하는 방법
import { CATEGORIES } from '@/lib/constants'
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))
```

## 인라인 스타일 처리

| 현재 | 처리 |
|------|------|
| `style={{ display: '-webkit-box', WebkitLineClamp: 2, ... }}` | 유지 — Tailwind `line-clamp-2` 클래스로 교체 가능 (`@tailwindcss/line-clamp` 플러그인 없어도 v3.3+에서 기본 지원) |
| `style={{ backgroundColor: '#fdeceb' }}` | 유지 — 에러 배경 하드코딩, 원본 값이므로 허용 |

### `line-clamp` 교체
```tsx
// 현재
style={{
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  lineHeight: 1.5,
}}

// 교체
className="line-clamp-2 leading-[1.5]"
```

## 필터 탭 인라인 스타일
선택 상태 분기 `style={{}}` → 조건부 `className`으로 교체:
```tsx
className={active
  ? 'bg-ph-secondary text-ph-primary'
  : 'text-ph-text-secondary hover:bg-ph-gray-50'}
```

## 분리 대상

| 섹션 | 분리 위치 |
|------|-----------|
| 필터 탭 | `_components/FilterTabs.tsx` (admin/orders의 FilterBar와 유사 패턴) |
| 처리 버튼 셀 (승인/반려) | 현재 규모가 작아 테이블 row 내 인라인 유지 가능 |
