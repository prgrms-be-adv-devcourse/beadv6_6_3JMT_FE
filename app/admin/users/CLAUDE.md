# app/admin/users — 리팩토링 플랜

## 현황
- 약 167줄, 사용자 목록 + 유형/상태 변경
- `STATUS_OPTS`, `ROLE_LABEL` 인라인 상수
- 상태 버튼에 조건부 `style={{}}` 사용

## 인라인 상수 처리

### `ROLE_LABEL`
```ts
const ROLE_LABEL: Record<string, string> = {
  buyer: '구매자',
  seller: '판매자',
}
```
users 전용 표시 레이블. `app/admin/users/constants.ts`에 분리하거나 page 유지 (짧아서 허용 가능).

### `STATUS_OPTS`
사용자 상태 변경 옵션 배열. users 전용이므로 page 또는 `constants.ts`에 유지.

## 인라인 스타일 처리

### 상태 버튼 조건부 스타일
현재 `style={{ borderColor, color, background }}` 3중 조건 분기.

```tsx
// 현재
style={
  isActive
    ? { borderColor: 'var(--ph-primary)', color: 'var(--ph-primary)', background: 'var(--ph-secondary)' }
    : o.danger
      ? { borderColor: 'var(--ph-border)', color: 'var(--ph-error)', background: 'transparent' }
      : { borderColor: 'var(--ph-border)', color: 'var(--ph-text-secondary)', background: 'transparent' }
}

// 교체
className={
  isActive
    ? 'border-ph-primary text-ph-primary bg-ph-secondary'
    : o.danger
      ? 'border-ph-border text-ph-error bg-transparent'
      : 'border-ph-border text-ph-text-secondary bg-transparent'
}
```

### `fontVariantNumeric: 'tabular-nums'`
```tsx
// 현재
style={{ fontVariantNumeric: 'tabular-nums' }}

// 교체
className="tabular-nums"
```

## 분리 대상

| 섹션 | 분리 위치 |
|------|-----------|
| 상태 변경 버튼 그룹 | `_components/StatusButtons.tsx` (STATUS_OPTS 포함) |
| 유형 변경 select | 현재 규모가 작아 row 내 인라인 유지 |

## 주의 사항
- `handleRoleChange`는 `PATCH /api/v2/admin/users/:id/role`, `handleStatusChange`는 `PATCH /api/v2/admin/users/:id/status` — 서로 다른 서브 리소스 엔드포인트 사용 (스펙: `docs/specs/2026-07-21-admin-users-role-api-spec.md`)
