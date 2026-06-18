# app/admin/payments — 리팩토링 플랜

## 현황
- 약 341줄, 정산 상태머신 + 필터 탭 + 요약 카드 + 테이블 구조
- 페이지 내부에 `RowBtn`, `won()`, `fmtPeriod()` 인라인 선언

## 인라인 컴포넌트/함수 처리

### 1. `RowBtn` → `_components/RowBtn.tsx`
정산 액션 버튼 (승인/보류/지급 등). 이 페이지에서만 사용하므로:
```
app/admin/payments/_components/RowBtn.tsx
```
`tone: 'solid' | 'neutral' | 'danger'` 기반 스타일 분기 유지.

### 2. `won()` → `lib/utils.ts`
```ts
// 현재 payments/page.tsx 내부
const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`

// 이동: lib/utils.ts 에 이미 있는 won() 함수와 통합
export function won(n: number): string {
  return '₩' + n.toLocaleString('ko-KR');
}
```
payments 페이지의 `won()` 제거 후 `import { won } from '@/lib/utils'` 사용.

### 3. `fmtPeriod()` 위치
정산 기간 포맷 유틸. payments 전용 포맷이므로:
- 옵션 A: `app/admin/payments/_components/` 내 분리 (권장)
- 옵션 B: page 내 유지 (짧은 함수라 허용 가능)

## 섹션 분리 대상

| 섹션 | 분리 위치 |
|------|-----------|
| 요약 카드 4개 (`summary.map`) | `_components/SummaryCards.tsx` |
| 필터 탭 바 | `_components/SettlementFilterTabs.tsx` |
| 테이블 행 액션 셀 | `_components/ActionCell.tsx` (RowBtn 포함) |

## 인라인 스타일 처리

| 현재 | 처리 |
|------|------|
| `style={{ fontVariantNumeric: 'tabular-nums' }}` | 유지 — Tailwind에 `tabular-nums` 클래스 존재 (`font-variant-numeric: tabular-nums`) → `tabular-nums` 클래스로 교체 |
| `className="grid ... [grid-template-columns:...]"` | 유지 — 임의 그리드 레이아웃, Tailwind로 표현 불가 |

## 상태머신 로직
`actionsFor(status)` 함수와 `ACTION_META`는 비즈니스 로직이므로 page 또는 별도 `lib/settlement.ts`에 유지.
