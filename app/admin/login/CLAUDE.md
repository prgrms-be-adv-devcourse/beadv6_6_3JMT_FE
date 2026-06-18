# app/admin/login — 리팩토링 플랜

## 현황
- 전체 약 167줄, 구조는 단순 (로그인 폼 1개)
- 공통 컴포넌트를 사용하지 않고 raw `<input>` / `<button>` 직접 사용
- `style={{ background: 'linear-gradient(...)' }}` — 그라데이션 배경 (인라인 허용)
- `style={{ lineHeight: 1.12 }}` — Tailwind로 대체 가능 (`leading-tight` 또는 `leading-none`)

## 인라인 스타일 처리 방침

| 현재 코드 | 처리 | 대체 |
|-----------|------|------|
| `style={{ background: 'linear-gradient(...)' }}` | 유지 | 그라데이션은 토큰 없음 → 인라인 허용 |
| `style={{ lineHeight: 1.12 }}` | 교체 | `leading-none` (Tailwind 1.0) 근사치 |
| `style={{ width: 21, height: 21 }}` | 교체 | `size-[21px]` 또는 `w-[21px] h-[21px]` |

## 리팩토링 대상

### 1. `<input>` 재사용 검토
이메일·비밀번호 input 두 개가 동일한 구조(아이콘 + input). 현재는 이 페이지에만 쓰이므로 inline 허용.
공통 `FormField` 컴포넌트(`components/ui/FormField`)로 교체 가능하나 아이콘 leading이 필요해 확인 필요.

### 2. `px-8 py-[22px]` → spacing 규칙 적용
- `py-[22px]` → Tailwind 소수점 스케일이 없으므로 `py-[22px]` 그대로 유지 (허용)

### 3. 데모 안내 블록 분리 불필요
`process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'` 조건부 블록 — 로직이 단순해 분리 불필요

## 주의 사항
- 이 페이지는 어드민 레이아웃(`app/admin/layout.tsx`)을 상속받지 않음
- `useAuthStore`로 이미 로그인한 admin 재방문 시 자동 리다이렉트 처리됨
