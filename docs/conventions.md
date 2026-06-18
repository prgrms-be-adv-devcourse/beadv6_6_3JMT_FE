# 코딩 컨벤션

> 새 코드를 작성하거나 기존 코드를 수정하기 전에 이 문서를 먼저 확인한다.
> 리팩토링 대상 분석은 각 라우트 폴더의 `CLAUDE.md`를 참고한다.

---

## 0. 새 코드 작성 전 조회 순서

새 함수·상수·컴포넌트를 작성하기 **전에** 반드시 아래 순서로 이미 있는지 확인한다.
확인 없이 인라인 선언하면 중복이 쌓인다.

```
1. lib/utils.ts      — won(), nextVer() 등 공통 유틸
2. lib/constants.ts  — CATEGORIES 등 공유 상수
3. components/ui/    — 공통 UI 컴포넌트
4. components/admin/ — 어드민 전용 공통 컴포넌트 (어드민 페이지 작업 시)
5. 없으면 추가, 있으면 import
```

**이미 있는 것을 재선언하는 것은 금지한다.**

```ts
// ❌ 금지 — won()을 페이지 내부에 재선언
const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`

// ✅ 권장 — lib/utils.ts에서 import
import { won } from '@/lib/utils'
```

---

## 1. 상수 (Constants)

### 공유 상수 위치: `lib/constants.ts`

여러 페이지에서 동일하게 쓰이는 데이터는 **반드시 `lib/constants.ts`에 정의**한다.
페이지 파일 내부에 선언하면 변경 시 모든 파일을 수동으로 찾아야 한다.

```ts
// lib/constants.ts
export const CATEGORIES = [
  { id: 'image',     label: '이미지 생성', icon: 'image',          desc: '광고컷·일러스트·목업' },
  { id: 'writing',   label: '글쓰기',      icon: 'pen-line',       desc: '카피·블로그·이메일'   },
  { id: 'coding',    label: '코딩',        icon: 'code-xml',       desc: '리팩터링·디버깅·테스트' },
  { id: 'marketing', label: '마케팅',      icon: 'megaphone',      desc: 'SNS·광고·전략'        },
  { id: 'chatbot',   label: '챗봇',        icon: 'message-circle', desc: '페르소나·상담'         },
  { id: 'data',      label: '데이터 분석', icon: 'bar-chart-3',    desc: '요약·인사이트'         },
] as const;
```

**현재 공유 대상 상수** (리팩토링 전 각 페이지에 중복 선언 중):

| 상수 | 이동 위치 | 현재 중복 위치 |
|------|-----------|---------------|
| `CATEGORIES` | `lib/constants.ts` | apply, browse, home, sell, edit, reader (6곳) |

**페이지 전용 상수**는 해당 라우트의 `constants.ts`에 위치한다.
예: `app/apply/constants.ts` (STEPS), `app/mypage/constants.ts` (NOTIF_ROWS, NAV)

### 유틸 함수 위치: `lib/utils.ts`

여러 파일에서 쓰이는 유틸 함수는 `lib/utils.ts`에 추가한다.
현재 `won()` 함수가 여기에 있다.

**이동 예정 유틸** (현재 각 페이지에 인라인 선언):

| 함수 | 현위치 | 이동 위치 |
|------|--------|-----------|
| `buildPromptText(p)` | `reader/[id]/page.tsx` | `lib/promptBuilder.ts` |
| `nextVer(latest, type)` | `edit/[id]/page.tsx` | `lib/utils.ts` |
| `triggerBlob(blob, name)` | `reader/[id]/page.tsx` | `lib/download.ts` |

---

## 2. 컴포넌트 (Components)

### 새 컴포넌트 만들기 전 체크리스트

1. `components/ui/`에 이미 있는가? → 있으면 재사용
2. 여러 페이지에서 쓰일 것인가? → `components/ui/`에 추가
3. 해당 라우트에서만 쓰이는가? → `app/[route]/_components/`에 추가
4. 페이지 파일 내부에 직접 선언하지 않는다

### `components/ui/` — 공통 UI 컴포넌트

| 컴포넌트 | import | 주요 props |
|----------|--------|------------|
| `Button` | `@/components/ui/Button` | `variant` (solid\|secondary), `size` (sm\|md\|lg), `fullWidth`, `disabled` |
| `Card` | `@/components/ui/Card` | `padding`, `style` |
| `Tag` | `@/components/ui/Tag` | `selected`, `onClick` |
| `Label` | `@/components/ui/Label` | `hint` |
| `FormField` | `@/components/ui/FormField` | `label`, `hint`, `type`, `value`, `onChange`, `rows`, `leading` |
| `ImageUpload` | `@/components/ui/ImageUpload` | `value`, `onChange`, `height`, `placeholder` |
| `ImageCarousel` | `@/components/ui/ImageCarousel` | `slides`, `thumbnailUrl` |
| `PromptCard` | `@/components/ui/PromptCard` | `p`, `showActions`, `showStatus`, `onOpen`, `onClick` |
| `PaymentTable` | `@/components/ui/PaymentTable` | `payments`, `showRefundColumn`, `onRefund` |
| `StarRate` | `@/components/ui/StarRate` | `value`, `onRate`, `disabled` |
| `Toast` | `@/components/ui/Toast` | — (useToast 훅으로 사용) |
| `Logo` | `@/components/ui/Logo` | — |

**리팩토링 후 추가 예정** (현재 각 page.tsx에 중복 선언):

| 컴포넌트 | 중복 위치 |
|----------|-----------|
| `Avatar` | apply, detail/[id], reader/[id] (3곳) |
| `Input` (포커스 border 포함) | apply, sell (2곳) |
| `Switch` | mypage (1곳, 공통 가치 있음) |
| `EmptyState` | mypage (1곳, 공통 가치 있음) |

### `components/admin/` — 어드민 전용 공통 컴포넌트

| 컴포넌트 | import | 비고 |
|----------|--------|------|
| `SectionCard`, `LinkAction` | `@/components/admin/SectionCard` | 어드민 카드 레이아웃 |
| `Table`, `Th`, `Td`, `Tr`, `Identity` | `@/components/admin/DataTable` | 어드민 테이블 |
| `Badge`, `StatusBadge` | `@/components/admin/Badge` | 어드민 상태 뱃지 |

### `components/modals/` — 모달

| 모달 | import |
|------|--------|
| `LoginModal` | `@/components/modals/LoginModal` |
| `ConfirmDialog` | `@/components/modals/ConfirmDialog` |
| `EmailChangeModal` | `@/components/modals/EmailChangeModal` |

**리팩토링 후 추가 예정**:

| 모달 | 현위치 |
|------|--------|
| `PasswordChangeModal` | mypage/page.tsx 내부 선언 |

### 페이지 내부 컴포넌트 선언 금지 기준

아래 중 하나라도 해당하면 파일 분리:
- 다른 페이지·컴포넌트에서도 쓸 수 있는 UI (Avatar, Input 등)
- 100줄 이상의 JSX 블록
- 독립적인 상태(`useState`)를 가진 섹션

---

## 3. TypeScript 타입 / 인터페이스 위치

| 타입 범위 | 위치 |
|-----------|------|
| 해당 라우트에서만 쓰이는 API 응답 타입 | 해당 `page.tsx` 인라인 또는 `app/[route]/types.ts` |
| 여러 라우트·컴포넌트에서 공유하는 타입 | `lib/types.ts` |
| 어드민 전용 공유 타입 | `app/admin/types.ts` |

**결정 기준**: 2개 이상의 파일에서 import하면 `lib/types.ts` 또는 `app/admin/types.ts`로 이동한다.

---

## 4. 스타일링 (Styling)

### 인라인 스타일 `style={{}}` 사용 금지

`style={{}}` 인라인 스타일 대신 Tailwind 클래스를 사용한다.
단, 동적으로 계산되는 값(예: `width: size * 0.4`, `height: \`${pct}%\``)은 인라인 스타일 허용.

```tsx
// ❌ 금지
<div style={{ display: 'flex', gap: 8, color: 'var(--ph-primary)' }}>

// ✅ 권장
<div className="flex gap-ph-8 text-ph-primary">
```

### 조건부 스타일 처리

조건에 따라 스타일이 달라지는 경우도 `style={{}}` 대신 조건부 `className`을 사용한다.

```tsx
// ❌ 금지
<span style={active
  ? { color: 'var(--ph-primary)', background: 'var(--ph-secondary)' }
  : { color: 'var(--ph-text-secondary)' }}
>

// ✅ 권장
<span className={active
  ? 'text-ph-primary bg-ph-secondary'
  : 'text-ph-text-secondary'}
>
```

행 구분선처럼 첫 번째 항목만 예외인 패턴:

```tsx
// ❌ 금지
style={{ borderTop: i ? '1px solid var(--ph-border)' : 'none' }}

// ✅ 권장
className={i ? 'border-t border-ph-border' : ''}
```

### 클래스 우선순위

**색상·타이포·radius**: `--ph-*` 토큰 클래스만 사용한다.

```
text-ph-primary  bg-ph-secondary  border-ph-border
rounded-ph-md    font-ph          text-ph-body-sm
```

**간격** (gap, padding, margin, width, height):
1. `--ph-*` 토큰 클래스 — `gap-ph-8`, `p-ph-16`, `gap-ph-xs`
2. Tailwind 소수점 스케일 — `gap-2.5`(≈10px), `p-3.5`(≈14px)
3. px 임의값 — `gap-[10px]` (위 둘로 표현 불가한 경우만)

**폰트 크기**:
1. `--ph-*` 토큰 클래스 — `text-ph-caption`(13px), `text-ph-body-sm`(14px), `text-ph-body-md`(15px)
2. px 임의값 — `text-[13.5px]` (토큰 미정의 크기)

> rem 임의값(`text-[0.84375rem]`)은 가독성이 낮아 사용하지 않는다.

### 자주 쓰는 토큰 → 클래스 매핑

| 용도 | 클래스 |
|------|--------|
| 브랜드 파란색 | `text-ph-primary` `bg-ph-primary` |
| 연파랑 배경 | `bg-ph-secondary` |
| 경계선 | `border border-ph-border` |
| 기본 텍스트 | `text-ph-text` |
| 보조 텍스트 | `text-ph-text-secondary` |
| 흐린 텍스트 | `text-ph-text-muted` |
| 에러 | `text-ph-error` |
| 카드 표면 | `bg-ph-surface` |
| 연한 배경 | `bg-ph-gray-50` |
| 13px 텍스트 | `text-ph-caption` |
| 14px 텍스트 | `text-ph-body-sm` |
| 15px 텍스트 | `text-ph-body-md` |
| gap 6px | `gap-ph-2xs` |
| gap 8px | `gap-ph-8` |
| gap 10px | `gap-ph-xs` |
| gap 12px | `gap-ph-12` |
| gap 16px | `gap-ph-16` |

### Tailwind v4 spacing 단위

기본 단위 `--spacing: 0.25rem` → 소수점 스케일 클래스가 동작한다.
`gap-2.5` = 2.5 × 0.25rem = 0.625rem ≈ 10px
