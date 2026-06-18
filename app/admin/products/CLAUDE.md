# app/admin/products — 리팩토링 플랜

## 현황
- 약 373줄, 목록 + 미리보기 2패널 레이아웃
- 페이지 내부에 `CategoryIcon`, `Meta`, `Field` 컴포넌트 선언
- `won()`, `CATEGORY_LABEL`, `ICON_MAP` 인라인 선언

## 인라인 컴포넌트 처리

### 1. `CategoryIcon` → `_components/CategoryIcon.tsx`
카테고리 아이콘 렌더러. products 전용 lucide 매핑.
```
app/admin/products/_components/CategoryIcon.tsx
```

### 2. `Meta` → `_components/Meta.tsx`
```tsx
function Meta({ label, value }: { label: string; value: string })
```
미리보기 메타 정보 표시. products 전용.

### 3. `Field` → `_components/Field.tsx`
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode })
```
미리보기 섹션 레이블 래퍼. products 전용.

## 인라인 함수/상수 처리

| 항목 | 처리 |
|------|------|
| `won(amount)` | `lib/utils.ts`의 `won()` import로 대체 |
| `CATEGORY_LABEL` | 어드민 전용 표시용 → `app/admin/products/constants.ts` 또는 공유 `lib/constants.ts`의 CATEGORIES에서 파생 |
| `ICON_MAP` | 어드민 전용 → `app/admin/products/constants.ts` |
| `STATUS_KEY` | products 전용 상태 매핑 → `app/admin/products/constants.ts` |

## 섹션 분리 대상

| 섹션 | 분리 위치 |
|------|-----------|
| 목록 패널 (탭 + 상품 목록) | `_components/ProductList.tsx` |
| 미리보기 패널 (head + meta + Field들 + action bar) | `_components/ProductPreview.tsx` |

## 인라인 스타일 처리

| 현재 | 처리 |
|------|------|
| `style={{ borderTop: ..., borderLeft: ..., background: ... }}` (목록 아이템 선택 상태) | 조건부 className으로 교체하거나 CSS 변수 참조로 유지 |
| `onMouseEnter/Leave` 핸들러로 직접 style 변경 | CSS `hover:` 클래스로 교체 |
| `[grid-template-columns:minmax(360px,420px)_1fr]` | 유지 — 임의 그리드 |

## 주의 사항
- `useEffect`가 `list` 변경 시 선택 항목을 자동 조정하는 로직 있음 → 분리 시 state 전달 구조 주의
