# /components 디렉토리 규칙

> 새 컴포넌트를 만들기 전에 `docs/conventions.md` 2번 섹션을 먼저 확인한다.

## 컴포넌트 생성 원칙
- `'use client'`는 useState / useEffect / 이벤트 핸들러 사용 시에만 추가
- 이미지는 `<img>` 금지 → Next.js `<Image>` 컴포넌트만 사용
- thumbnail_url이 null이면 `/images/promy-default.png` 사용
- 스타일: `--ph-*` 토큰 기반 Tailwind 클래스 우선, `style={{}}` 인라인 금지 (동적 계산값 제외)

## 디렉토리 구조

```
components/
├── ui/        공통 UI 컴포넌트 (여러 페이지에서 재사용)
├── admin/     어드민 전용 공통 컴포넌트
├── modals/    모달 컴포넌트
├── layout/    레이아웃 (Header 등)
└── providers/ 전역 Provider 래퍼
```

## `components/ui/` — 현재 목록

| 컴포넌트 | 주요 props |
|----------|------------|
| `Button` | `variant` (solid\|secondary), `size` (sm\|md\|lg), `fullWidth`, `disabled` |
| `Card` | `padding`, `style` |
| `Tag` | `selected`, `onClick` |
| `Label` | `hint` |
| `FormField` | `label`, `hint`, `type`, `value`, `onChange`, `rows`, `leading` |
| `ImageUpload` | `value`, `onChange`, `height`, `placeholder` |
| `ImageCarousel` | `slides`, `thumbnailUrl` |
| `PromptCard` | `p`, `showActions`, `showStatus`, `onOpen`, `onClick` |
| `OrderList` | `payments`, `onRefund` |
| `StarRate` | `value`, `onRate`, `disabled` |
| `Toast` | — (useToast 훅으로 사용) |
| `Logo` | — |

**리팩토링 후 추가 예정** (현재 각 page.tsx에 중복 선언):

| 컴포넌트 | 중복 위치 |
|----------|-----------|
| `Avatar` | apply, detail/[id], reader/[id] (3곳) |
| `Input` | apply, sell (2곳) |
| `Switch` | mypage |
| `EmptyState` | mypage |

## `components/admin/` — 현재 목록

| 컴포넌트 | import | 비고 |
|----------|--------|------|
| `SectionCard`, `LinkAction` | `@/components/admin/SectionCard` | 어드민 카드 레이아웃 |
| `Table`, `Th`, `Td`, `Tr`, `Identity` | `@/components/admin/DataTable` | 어드민 테이블 |
| `Badge`, `StatusBadge` | `@/components/admin/Badge` | 어드민 상태 뱃지 |

**리팩토링 후 추가 예정** (현재 page.tsx에 중복 선언):

| 컴포넌트 | 중복 위치 |
|----------|-----------|
| `RowBtn` | admin/page.tsx, admin/payments/page.tsx (2곳) |
| `AdminEmpty` | admin/page.tsx (빈 상태 UI) |
| `CategoryIcon` | admin/page.tsx, admin/products/page.tsx (2곳) |

## `components/modals/` — 현재 목록

| 모달 | import |
|------|--------|
| `LoginModal` | `@/components/modals/LoginModal` |
| `ConfirmDialog` | `@/components/modals/ConfirmDialog` |
| `EmailChangeModal` | `@/components/modals/EmailChangeModal` |

**리팩토링 후 추가 예정**:

| 모달 | 현위치 |
|------|--------|
| `PasswordChangeModal` | mypage/page.tsx 내부 선언 |
