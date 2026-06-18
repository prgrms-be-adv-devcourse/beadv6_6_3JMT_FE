# 디자인 토큰 & 어드민 UI 치트시트

> 어드민 페이지를 **원본 HTML과 픽셀 단위로 동일하게** 이식하기 위한 참조 문서.
> 토큰 정의 원본: `app/globals.css` (= `origin/prompthub_admin_clean/assets/css/styles.css`와 100% 일치)
> 어드민 UI 스펙 원본: `origin/prompthub_admin_clean/assets/js/shared-admin-ui.js`, `design-system.js`

---

## 1. 토큰 사용 규칙

- 이 프로젝트는 **Tailwind v4** → `tailwind.config.ts` 없음. 토큰은 `app/globals.css`의 `:root`(원시값) + `@theme`(Tailwind 매핑) 2단 구조.
- **원본이 토큰(`var(--ph-*)`)으로 쓴 건 토큰으로, 인라인 리터럴(`#fdeceb` 등)로 쓴 건 그대로 인라인으로** 이식한다. (임의 토큰화 금지 — 원본과 달라짐)
- `app/globals.css`에 원본 어드민이 참조하는 `--ph-*` 토큰 24개가 **전부** 존재함. **추가할 토큰 없음.**

---

## 2. 색상 토큰 → Tailwind 클래스

| 토큰 (`var(--ph-*)`) | 값 | Tailwind 클래스 | 용도 |
|---|---|---|---|
| `--ph-white` | `#ffffff` | `bg-ph-white` `text-ph-white` | 사이드바/카드 배경 |
| `--ph-black` | `#000000` | `text-ph-black` | 기본 텍스트 |
| `--ph-blue` / `--ph-primary` | `#1b64da` | `bg-ph-primary` `text-ph-primary` | 브랜드/활성/링크 |
| `--ph-blue-pale` / `--ph-secondary` | `#e8f3ff` | `bg-ph-secondary` | 활성 메뉴 배경, soft 뱃지 |
| `--ph-blue-hover` | `#1957bd` | `bg-ph-blue-hover` | 버튼 hover |
| `--ph-gray-50` / `--ph-surface-muted` | `#f8f9fb` | `bg-ph-gray-50` | hover 배경, body 배경 |
| `--ph-gray-100` | `#f1f3f5` | `bg-ph-gray-100` | neutral 뱃지 배경 |
| `--ph-gray-400` / `--ph-text-muted` | `#8b95a1` | `text-ph-text-muted` | 부가 텍스트/플레이스홀더 |
| `--ph-gray-600` / `--ph-text-secondary` | `#4e5968` | `text-ph-text-secondary` | 보조 텍스트 |
| `--ph-gray-line` / `--ph-border` | `#e5e7eb` | `border-ph-border` | 모든 경계선/구분선 |
| `--ph-red` / `--ph-error` | `#d92d20` | `text-ph-error` `bg-ph-error` | 에러/반려/위험 |
| `--ph-surface` | `#ffffff` | `bg-ph-surface` | 카드/패널 표면 |
| `--ph-text` | `#000000` | `text-ph-text` | 본문 |
| `--ph-on-accent` | `#ffffff` | `text-ph-on-accent` | primary 위 텍스트 |

### 토큰화 안 된 인라인 리터럴 (원본도 인라인 — 그대로 사용)
| 색상 | 용도 | 위치 |
|---|---|---|
| `#fdeceb` | danger 버튼/로그아웃 hover 배경 | sidebar 로그아웃, danger 버튼 |
| `#f3f7fd`, `#e4eefb` | 로그인 페이지 배경 그라데이션 (`linear-gradient(180deg,#fff,#f3f7fd 45%,#e4eefb)`) | admin login |
| `#ff9b94` / `#7fb2ff` | 토스트 아이콘색 (danger / success) | Toast |
| `#FEE500` / `#191600` | 카카오 로그인 버튼 배경/텍스트 | admin login |

---

## 3. 타이포그래피 / 간격 / radius 토큰

**폰트**: `--ph-font-family` (Pretendard Variable) — `font-ph`
**가중치**: regular 400 / semibold 600 / bold 700

| radius | 값 | 클래스 | 용도 |
|---|---|---|---|
| `--ph-radius-sm` | 4px | `rounded-ph-sm` | 보조 버튼, 아이콘 버튼 |
| `--ph-radius-md` | 7px | `rounded-ph-md` | 기본 버튼, 사이드바 메뉴, 토픽바 아이콘 |
| `--ph-radius-lg` | 8px | `rounded-ph-lg` | 카드/패널(SectionCard) |
| `--ph-radius-xl` | 16px | `rounded-ph-xl` | 큰 미디어/패널 |
| `--ph-radius-full` | 9999px | `rounded-ph-full` | 뱃지/pill |

간격 토큰: `--ph-space-*` → `*-ph-8`(8px) `*-ph-16`(16px) `*-ph-24`(24px) `*-ph-40`(40px) 등.

---

## 4. 어드민 레이아웃 스펙 (원본 정확 치수)

### 사이드바 `<aside>` — `shared-admin-ui.js:38`
- `position: fixed; top/left/bottom: 0; width: 248px; z-index: 30`
- 배경 **흰색** `var(--ph-white)`, 우측 경계 `1px solid var(--ph-border)`
- **로고 영역**(`padding: 22px 22px 18px`): 32×32 `rounded-[9px]` `bg-ph-primary` 박스 + Lucide `sparkles`(18px, 흰색) / "Prompt**Hub**"(18px/700, Hub만 primary) + "ADMIN CONSOLE"(11.5px/600 muted, letter-spacing 0.04em)
- **nav**(`padding: 4px 14px 14px; gap: 2px`)
  - 그룹 헤더 "운영 관리": 11.5px/700, muted, uppercase, letter-spacing 0.06em, `padding: 16px 10px 7px`
  - 메뉴 버튼: `padding: 10px 12px; gap: 11px; rounded-ph-md; fontSize 14.5`
    - 활성: `bg-ph-secondary` + `text-ph-primary` + 700
    - 비활성: `text-ph-text-secondary` + 500, hover 시 `bg-ph-gray-50`
    - 아이콘: Lucide 19×19
    - 뱃지(count>0): minWidth 20, h20, `rounded-full`, 12px/700 — 활성 `bg-ph-primary text-white` / 비활성 `bg-ph-secondary text-ph-primary`
- **하단 유저**(`padding: 14px`, 상단 border): Avatar 36 + "운영 관리자"(14/700) + email(12 muted) + 로그아웃 아이콘버튼(34×34, `rounded-ph-sm`, border, hover시 `bg #fdeceb`/`border·text ph-error`, Lucide `log-out` 17px)

### 사이드바 메뉴 (NAV) — 5항목
| id | label | Lucide icon | 뱃지 key |
|---|---|---|---|
| dashboard | 대시보드 홈 | `layout-dashboard` | — |
| — | **운영 관리** (그룹헤더) | — | — |
| users | 사용자 관리 | `users` | — |
| sellers | 판매자 신청 관리 | `store` | sellersBadge |
| products | 상품 검수 | `clipboard-check` | productsBadge |
| settlements | 정산 관리 | `wallet` | settlementsBadge |

> ⚠️ 현재 Next.js 구현은 6항목(주문관리 추가, 이모지 아이콘, 다크 배경)으로 **원본과 다름** → 원본 기준으로 교체 대상.

### 상단바 `<header>` (Topbar) — `shared-admin-ui.js:95`
- `position: sticky; top:0; z-index:20`, 배경 `rgba(255,255,255,0.85)` + `backdrop-blur(12px)`, 하단 border
- 높이 70px, `padding: 0 36px`, gap 20
- 제목 `h1` 22px/700 letter-spacing -0.02em + subtitle 13.5px muted
- 우측: 알림 버튼(Lucide `bell` 19px + 우상단 7px primary dot) / 도움말(`life-buoy`) / 세로 구분선 1×24 / "운영팀" pill(Lucide `shield-check` 15px primary, `bg-ph-gray-50` border `rounded-full`)
- 아이콘버튼 공통: 40×40, `rounded-ph-md`, `text-ph-text-secondary`

### 콘텐츠
- 사이드바가 fixed 248px → 메인은 `margin-left: 248px`

---

## 5. 공통 컴포넌트 스펙

### StatusBadge — 도메인 상태 → 뱃지 매핑 (`shared-admin-ui.js:127`)
| status | label | tone | soft | dot |
|---|---|---|---|---|
| active | 활성 | blue | ✓ | `#1b64da` |
| suspended | 정지 | error | ✓ | `#d92d20` |
| withdrawn | 탈퇴 | neutral | ✓ | `#8b95a1` |
| pending | 대기 | neutral | ✓ | `#8b95a1` |
| approved | 승인 | blue | ✓ | `#1b64da` |
| rejected | 반려 | error | ✓ | `#d92d20` |
| paid | 지급 완료 | blue | ✗(filled) | `#fff` |
| held | 보류 | error | ✓ | `#d92d20` |
| **PENDING** | 대기 | neutral | ✓ | `#8b95a1` |
| **PAID** | 완료 | blue | ✗(filled) | `#fff` |
| **FAILED** | 실패 | error | ✓ | `#d92d20` |
| **CANCELED** | 취소 | neutral | ✓ | `#8b95a1` |
| **REFUNDED** | 환불 | error | ✓ | `#d92d20` |
| **PENDING_APPROVAL** | 대기 | neutral | ✓ | `#8b95a1` |
| **SETTLEMENT_ON_HOLD** | 승인 보류 | error | ✓ | `#d92d20` |
| **APPROVED** | 승인 | blue | ✓ | `#1b64da` |
| **PAYOUT_REQUESTED** | 지급 신청 | blue | ✓ | `#1b64da` |
| **PAYOUT_ON_HOLD** | 지급 보류 | error | ✓ | `#d92d20` |
| **CANCELLED** | 취소 | neutral | ✓ | `#8b95a1` |

> 정산 상태머신(`Settlement`) 뱃지. seller(`/shop` 정산 내역)·admin(`/admin/payments`)가 동일 매핑을 공유한다.

뱃지: `gap 6, padding 5px 10px, 6px dot(원형) + label`

### Badge tone 팔레트 (`design-system.js:69`)
| tone | bg | fg |
|---|---|---|
| blue (soft) | `var(--ph-secondary)` | `var(--ph-primary)` |
| blue (filled) | `var(--ph-primary)` | `var(--ph-on-accent)` |
| neutral | `var(--ph-gray-100)` | `var(--ph-gray-600)` |
| error (soft) | `#fdeceb` | `var(--ph-error)` |
| error (filled) | `var(--ph-error)` | `#fff` |

### Button variants (`design-system.js:168`)
| variant | 배경 | 텍스트 | radius |
|---|---|---|---|
| primary | `var(--ph-secondary)`(연파랑) | `var(--ph-primary)` | md(7px) |
| secondary | 투명 | `var(--ph-text)` + border `var(--ph-text)` | sm(4px) |
| (filled/accent) | `var(--ph-primary)` | `var(--ph-on-accent)` | md(7px) |

### SectionCard (`shared-admin-ui.js:148`)
- `bg-ph-white` + `border-ph-border` + `rounded-ph-lg`
- 헤더(`padding 18px 22px`, 하단 border): title 16.5px/700 + sub 13px muted + 우측 action
- `headerExtra` prop: title/sub 아래에 렌더링되는 추가 헤더 콘텐츠 (예: 필터 탭). 헤더 내부에 위치하므로 구분선은 `headerExtra` 아래에 생김

### Table (`shared-admin-ui.js:176`)
- `<table>` width 100%, `border-collapse`, `tabular-nums`
- `Th`: `padding 12px 16px`, 12.5px/600, muted, 하단 border
- `Td`: `padding 14px 16px`, 14px, `text-ph-text`, 하단 border, vertical-align middle
- `Tr` hover(클릭가능시): `bg-ph-gray-50`, active: `bg-ph-secondary`

---

## 6. 아이콘 — Lucide

원본은 `data-lucide` 속성 사용 → Next.js에선 **`lucide-react`** (이미 설치됨, v1.18) 컴포넌트로 이식.
사용 아이콘: `Sparkles`, `LayoutDashboard`, `Users`, `Store`, `ClipboardCheck`, `Wallet`, `LogOut`, `Bell`, `LifeBuoy`, `ShieldCheck`, `ArrowRight`, `XCircle`, `CheckCircle2`.

---

## 7. 차트 — recharts (v3.8.1, 설치됨)

대시보드 7일 매출 그래프용. 원본은 `BarChart`(자체 SVG). recharts로 재현 시 토큰색(`#1b64da` bar, `#e5e7eb` grid, muted 축 라벨) 사용.
