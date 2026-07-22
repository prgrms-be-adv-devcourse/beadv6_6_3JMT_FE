# /admin — 어드민

## 역할
관리자 전용 대시보드. 판매자 신청 승인, 주문/상품/유저/정산 관리 기능 제공.
`components/admin/*` (SectionCard, DataTable, Badge) 공통 컴포넌트 이미 적용 완료.

## 서브 라우트

| 경로 | 페이지 |
|------|--------|
| `/admin` | 대시보드 (통계 + 최근 판매 + 신청 목록) |
| `/admin/login` | 어드민 로그인 |
| `/admin/orders` | 주문 관리 |
| `/admin/settlements` | 정산 관리 (`/admin/payments`는 호환 리다이렉트) |
| `/admin/products` | 상품 관리 |
| `/admin/sellers` | 판매자 신청 관리 |
| `/admin/users` | 회원 관리 |

---

## 리팩토링 플랜 — `/admin` 대시보드 (`app/admin/page.tsx`, 415줄)

### 인라인 컴포넌트 처리

| 컴포넌트 | 현위치 | 처리 | 이동 대상 |
|----------|--------|------|-----------|
| `StatCard` | page.tsx line 86 | 분리 | `app/admin/_components/StatCard.tsx` |
| `SalesBarChart` | page.tsx line 137 | 분리 | `app/admin/_components/SalesBarChart.tsx` |
| `RowBtn` | page.tsx line 186 | **공통 추출** | `components/admin/RowBtn.tsx` (settlements 액션 버튼과 통합 검토) |
| `AdminEmpty` | page.tsx line 215 | **공통 추출** | `components/admin/AdminEmpty.tsx` (여러 어드민 페이지에서 활용 가능) |
| `CategoryIcon` | page.tsx line 227 | **공통 추출** | `components/admin/CategoryIcon.tsx` (products에도 동일 컴포넌트 중복) |

### 인라인 함수/상수 처리

| 항목 | 처리 |
|------|------|
| `won(n)` (line 63) | `lib/utils.ts`의 `won()`으로 대체 (`import { won } from '@/lib/utils'`) |
| `wonShort(n)` (line 64) | 대시보드 전용 → `app/admin/_components/StatCard.tsx` 내부로 이동 |
| `mmdd(iso)` (line 79) | 어드민 전용 날짜 포맷 → `app/admin/utils.ts` 또는 `lib/utils.ts`에 추가 |
| `CATEGORY_LABEL` (line 70) | `admin/sellers/page.tsx`와 중복 → `lib/constants.ts`의 `CATEGORIES`에서 파생 |

```ts
// CATEGORY_LABEL 파생 방법
import { CATEGORIES } from '@/lib/constants'
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map(c => [c.id, c.label]))
```

### 인라인 스타일 처리

| 현재 | 처리 |
|------|------|
| `style={{ height: 230, padding: '8px 4px 0' }}` (SalesBarChart 컨테이너) | `h-[230px] pt-2 px-1` — 고정 수치이므로 Tailwind 임의값으로 교체 |
| `style={{ width: '100%', maxWidth: 46, height: \`${h}%\`, ... }}` (막대 바) | 동적 height 포함 → 인라인 유지 (`height`만 동적) |
| `style={{ borderTop: i ? '1px solid var(--ph-border)' : 'none' }}` (행 구분선) | 조건부 className으로 교체: `className={i ? 'border-t border-ph-border' : ''}` |
| `style={{ background: 'var(--ph-secondary)', border: '1px solid var(--ph-primary)' }}` (범례) | `className="bg-ph-secondary border border-ph-primary"` |
| `style={{ width: 19, height: 19 }}` (CategoryIcon 크기) | `className="size-[19px]"` 또는 `width={19} height={19}` prop으로 전달 |

### 섹션 분리 대상 → `app/admin/_components/`

| 컴포넌트 | 책임 |
|----------|------|
| `StatCard.tsx` | KPI 통계 카드 (아이콘·수치·델타 표시) + `wonShort` 유틸 포함 |
| `SalesBarChart.tsx` | 최근 7일 거래량 막대그래프 (`hover` 상태 관리 포함) |
| `SellerApplyList.tsx` | 최근 판매자 신청 목록 + 승인/반려 버튼 |
| `ReviewProductList.tsx` | 검수 대기 상품 목록 |

### 주의 사항
- `RowBtn`을 `components/admin/RowBtn.tsx`로 공통 추출하면 `settlements`의 액션 버튼도 함께 교체
- `CategoryIcon`을 공통 추출하면 `products/page.tsx`도 함께 교체
- 어드민 공통 컴포넌트 변경 시 `docs/design-tokens.md` 동기화 필수 (CLAUDE.md 규칙)

---

## 리팩토링 플랜 — 어드민 레이아웃 (`app/admin/layout.tsx`, 266줄)

### 현황
- 사이드바(고정) + 상단바(sticky) + 메인 콘텐츠 영역 구조
- `/admin/login` 진입 시 레이아웃 없이 `{children}`만 렌더링
- 스타일은 대부분 이미 Tailwind + `--ph-*` 토큰으로 작성됨 — 인라인 스타일 없음

### 인라인 상수/타입 처리

| 항목 | 처리 |
|------|------|
| `NAV` 배열 (line 37) | `app/admin/constants.ts`로 분리 |
| `PAGE_META` 객체 (line 48) | `app/admin/constants.ts`로 분리 |
| `BadgeKey`, `NavEntry` 타입 (line 24~34) | `app/admin/types.ts`로 분리 또는 constants 파일에 함께 |

### 섹션 분리 대상 → `app/admin/_components/`

| 컴포넌트 | 책임 | 비고 |
|----------|------|------|
| `AdminSidebar.tsx` | 사이드바 전체 (로고 + 네비 + 하단 유저 영역) | `badges`, `sidebarOpen` 상태를 prop으로 받음 |
| `AdminHeader.tsx` | 상단바 (햄버거 버튼 + 페이지 타이틀 + 우측 아이콘) | `meta`, `pathname` 기반 타이틀 표시 |

### 최종 layout.tsx 책임
- 상태 관리 (`badges`, `sidebarOpen`)
- 뱃지 집계 API 호출 (`useEffect`)
- `AdminSidebar` + `AdminHeader` + `<main>` 조합만 담당

### 주의 사항
- 로그인 여부 체크 없음 — middleware에서 처리 (`middleware.ts`)
- `/admin/login` 분기 (`pathname === '/admin/login'`) 유지 필수 — 레이아웃을 적용하면 안 되는 페이지
- 뱃지 집계 실패는 무시 (`catch {}`) — 레이아웃 렌더링에 영향 없도록 유지
