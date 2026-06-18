# app/admin/orders — 리팩토링 플랜

## 현황
- 약 124줄, 어드민 공통 컴포넌트(SectionCard, Table, StatusBadge) 잘 활용
- `filterBar` JSX 변수가 page 함수 내부에 선언되어 있음

## 인라인 스타일 처리 방침

| 현재 코드 | 처리 | 대체 |
|-----------|------|------|
| `style={ filter === opt.value ? { backgroundColor: 'var(--ph-primary)', ... } : ... }` | 교체 | 조건부 className으로 대체 |

```tsx
// 현재
style={filter === opt.value
  ? { backgroundColor: 'var(--ph-primary)', color: 'var(--ph-on-accent)' }
  : { backgroundColor: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)' }}

// 개선
className={filter === opt.value
  ? 'bg-ph-primary text-ph-on-accent'
  : 'bg-ph-gray-100 text-ph-gray-600'}
```

## 리팩토링 대상

### 1. `filterBar` 변수 → `_components/FilterBar.tsx`
현재 `AdminOrdersPage` 함수 내부에 `const filterBar = (...)` JSX 변수로 선언.
options와 selected 상태를 prop으로 받는 `FilterBar` 컴포넌트로 분리.

```
app/admin/orders/_components/FilterBar.tsx
```

### 2. `FILTER_OPTIONS` 상수
주문 상태 필터 옵션 — 이 페이지 전용. `app/admin/orders/constants.ts`에 분리하거나 page에 유지.
admin/payments의 TABS와 유사하나 다른 타입이므로 공유 불필요.

### 3. 스켈레톤 로딩 row
`Array.from({ length: 6 }).map(...)` 패턴이 반복됨. 별도 `<SkeletonRows>` 컴포넌트로 분리 가능.

## Td inline style
`<Td align="right" style={{ fontWeight: 600 }}>` → `font-semibold` 클래스로 대체 (`Td` props에 `bold` 추가하거나 className 전달).
