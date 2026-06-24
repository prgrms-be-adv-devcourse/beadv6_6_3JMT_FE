# PromptHub 프론트엔드 온보딩 가이드

> 이 문서는 프로젝트를 처음 접하는 개발자를 위한 안내서입니다.  
> 작성 기준일: 2026-06-24

---

## 1. 프로젝트 개요

**PromptHub**는 AI 프롬프트를 사고파는 마켓플레이스입니다. 사용자는 구매자(buyer), 판매자(seller), 관리자(admin) 세 가지 역할을 가지며, 카카오 OAuth 또는 이메일/비밀번호로 로그인합니다.

- 원본 HTML 디자인을 **Next.js (App Router) + TypeScript**로 이식하는 프로젝트입니다.
- 시각적 결과물(색상·간격·폰트·레이아웃·애니메이션)을 픽셀 단위로 보존하는 것이 최우선 원칙입니다.

---

## 2. 기술 스택

| 분류 | 버전 | 비고 |
|------|------|------|
| Next.js | 16.2.9 | App Router, `--webpack` flag로 dev 서버 실행 |
| React | 19.2.4 | |
| TypeScript | ^5 | |
| Tailwind CSS | ^4 | `tailwind.config.ts` 없음 → `globals.css`의 `@theme` 블록으로 관리 |
| Zustand | ^5 | 전역 상태 관리 |
| Axios | ^1.18 | API 통신, `lib/auth.ts`가 인스턴스 |
| MSW | ^2 | 목업 API (개발 환경 전용) |
| Recharts | ^3 | 어드민 대시보드 차트 |
| Lucide React | ^1.18 | 아이콘 |

**패키지 매니저**: npm

---

## 3. 로컬 환경 설정

### 3-1. 설치 및 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

### 3-2. 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_API_MOCKING=enabled          # MSW 목업 활성화
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_KAKAO_CLIENT_ID=mock-kakao-client-id
```

`NEXT_PUBLIC_API_MOCKING=enabled` 상태에서는 실 백엔드 없이 MSW가 모든 API 요청을 처리합니다.  
실 백엔드 연결 시 이 값을 제거(또는 `disabled`)하고 `NEXT_PUBLIC_API_URL`을 실제 서버 주소로 변경합니다.

### 3-3. 기타 명령어

```bash
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm run format   # Prettier 포맷
```

---

## 4. 디렉토리 구조

```
.
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (폰트, MockProvider, Toast 등)
│   ├── globals.css             # 디자인 토큰 (:root + @theme) + 전역 스타일
│   ├── page.tsx                # 홈 (/)
│   ├── browse/                 # 탐색 (/browse)
│   ├── detail/[id]/            # 상품 상세 (/detail/:id)
│   ├── sell/                   # 프롬프트 판매 등록 (/sell)
│   ├── shop/                   # 내 상점 (/shop)
│   ├── mypage/                 # 마이페이지 (/mypage)
│   ├── reader/[id]/            # 프롬프트 리더 (/reader/:id)
│   ├── edit/[id]/              # 프롬프트 편집 (/edit/:id)
│   ├── apply/                  # 판매자 신청 (/apply)
│   ├── checkout/               # 결제 (/checkout)
│   ├── auth/kakao/callback/    # 카카오 OAuth 콜백
│   └── admin/                  # 어드민 대시보드 (/admin/**)
│
├── components/
│   ├── ui/                     # 공통 UI (Button, Card, Tag, Toast 등)
│   ├── admin/                  # 어드민 전용 공통 (Badge, DataTable, SectionCard)
│   ├── modals/                 # 모달 (LoginModal, ConfirmDialog, EmailChangeModal)
│   ├── layout/                 # 헤더·푸터·ConditionalLayout
│   └── providers/              # MockProvider, AuthSync
│
├── store/
│   ├── useAuthStore.ts         # 인증 상태 (user, token, role)
│   ├── useCartStore.ts         # 장바구니
│   ├── useWishStore.ts         # 찜 목록
│   └── useToastStore.ts        # 토스트 알림
│
├── lib/
│   ├── auth.ts                 # Axios 인스턴스 + 인터셉터 (토큰 자동 주입, 리프레시)
│   ├── utils.ts                # 공통 유틸 (won() 등)
│   ├── iconMap.ts              # 카테고리 아이콘 매핑 (lucide-react)
│   ├── sellers.ts              # 판매자 관련 API 함수
│   └── users.ts                # 유저 관련 API 함수
│
├── mocks/
│   ├── browser.ts              # MSW 브라우저 워커 설정
│   ├── handlers/               # 도메인별 MSW 핸들러
│   │   ├── auth.ts             # 로그인/회원가입/로그아웃/비밀번호 변경
│   │   ├── oauth.ts            # 카카오 OAuth
│   │   ├── products.ts         # 프롬프트 상품 CRUD
│   │   ├── users.ts            # 유저 프로필
│   │   ├── orders.ts           # 주문
│   │   ├── payments.ts         # 결제
│   │   ├── sellers.ts          # 판매자 신청/정보
│   │   ├── wishlist.ts         # 찜 목록
│   │   ├── notifications.ts    # 알림
│   │   └── admin.ts            # 어드민 전용
│   └── data/
│       ├── users.ts            # 목업 유저 데이터 + 역할 결정 로직
│       ├── products.ts         # 목업 상품 데이터
│       └── settlements.ts      # 목업 정산 데이터
│
├── public/
│   ├── images/
│   │   ├── promy-character.png # 마스코트 이미지
│   │   └── hero-mockup.png     # 히어로 섹션 목업 이미지
│   └── mockServiceWorker.js    # MSW 서비스 워커
│
├── docs/                       # 프로젝트 문서
├── middleware.ts               # 라우트 접근 제어
└── .env.local                  # 환경 변수 (git 미포함)
```

---

## 5. 인증 및 권한

### 역할 체계

| 역할 | 설명 | 접근 가능 페이지 |
|------|------|-----------------|
| `buyer` | 일반 구매자 | 홈, 탐색, 상세, 마이페이지, 리더, 결제, 판매자 신청 |
| `seller` | 판매자 | 위 + `/sell`, `/shop`, `/edit/[id]` |
| `admin` | 관리자 | `/admin/**` 전용 (일반 페이지 진입 시 자동 로그아웃) |

### 미들웨어 (`middleware.ts`)

`token` 쿠키(존재 여부)와 `role` 쿠키(값)로 접근 제어합니다.

- **비로그인 접근 금지**: `/sell`, `/shop`, `/mypage`, `/reader`, `/edit`, `/apply`, `/checkout` → 미인증 시 `/`로 리다이렉트
- **판매자 전용**: `/sell`, `/shop`, `/edit` → `role !== 'seller'`면 `/mypage`로 리다이렉트
- **어드민 전용**: `/admin/**` → 비어드민이면 `/admin/login`으로 리다이렉트

### 인증 플로우

```
[로그인 성공]
  → useAuthStore.login(user, token, refreshToken)
    → localStorage('auth')에 persist
    → document.cookie에 token, role 쓰기 (미들웨어 접근 제어용)

[401 응답]
  → lib/auth.ts 인터셉터가 refreshToken으로 자동 재발급
    → 성공: 새 accessToken 저장 후 원래 요청 재시도
    → 실패: logout() 후 홈으로 이동
```

### 목업 계정

| 이메일 | 비밀번호 | 역할 |
|--------|---------|------|
| `buyer@prompthub.kr` | `password123` | buyer |
| `seller@prompthub.kr` | `password123` | seller |
| `promptlab@prompthub.kr` | `password123` | seller |
| `admin@prompthub.kr` | `password123` | admin |

---

## 6. API 통신

### Axios 인스턴스 (`lib/auth.ts`)

```ts
import api from '@/lib/auth'

// 사용 예
const res = await api.get('/api/v1/products')
const res = await api.post('/api/v1/orders', { productId })
```

- **Authorization 헤더 자동 주입**: 요청 인터셉터에서 `useAuthStore`의 token을 읽어 추가합니다.
- **토큰 자동 갱신**: 401 응답 시 refresh 후 원래 요청을 자동으로 재전송합니다. 동시에 여러 요청이 401을 받더라도 refresh는 한 번만 실행합니다(큐 처리).

### MSW 목업 모드

`NEXT_PUBLIC_API_MOCKING=enabled`이면 `MockProvider`가 MSW 서비스 워커를 활성화합니다.  
핸들러는 `mocks/handlers/` 내 파일에서 도메인별로 관리합니다.  
새 API를 추가할 때는 `mocks/handlers/`에 핸들러를 추가하고 `mocks/handlers/index.ts`에 등록합니다.

---

## 7. 전역 상태 관리 (Zustand)

| 스토어 | 파일 | persist | 주요 상태 |
|--------|------|---------|-----------|
| `useAuthStore` | `store/useAuthStore.ts` | `localStorage('auth')` | `user`, `token`, `refreshToken`, `isLoggedIn`, `loginModalOpen` |
| `useCartStore` | `store/useCartStore.ts` | `localStorage('cart')` | `items[]` |
| `useWishStore` | `store/useWishStore.ts` | — | `items[]` (AuthSync에서 로그인 시 동기화) |
| `useToastStore` | `store/useToastStore.ts` | — | 토스트 메시지 |

### 토스트 사용법

```ts
import { useToast } from '@/store/useToastStore'
const showToast = useToast()
showToast('저장되었습니다.')           // 기본 (success)
showToast('오류가 발생했습니다.', 'error')
```

---

## 8. 디자인 시스템

### 구조: Tailwind v4 + `--ph-*` 토큰

`tailwind.config.ts`가 없습니다. 대신 `app/globals.css`에서 두 단계로 관리합니다.

```css
/* 1단계: CSS 변수 원시값 */
:root {
  --ph-primary: #1b64da;
  --ph-border: #e5e7eb;
}

/* 2단계: Tailwind @theme 블록으로 클래스 매핑 */
@theme {
  --color-ph-primary: var(--ph-primary);
  --color-ph-border: var(--ph-border);
}
```

이렇게 하면 `bg-ph-primary`, `text-ph-primary`, `border-ph-border` 등의 Tailwind 클래스가 동작합니다.

### 자주 쓰는 토큰 → 클래스

| 용도 | 클래스 |
|------|--------|
| 브랜드 파란색 | `text-ph-primary` / `bg-ph-primary` |
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
| gap 8px | `gap-ph-8` |
| gap 16px | `gap-ph-16` |

> 전체 토큰 목록은 `docs/design-tokens.md`를 참고합니다.

### 중요 규칙

- **임의 색상 금지**: `bg-blue-500`, `text-gray-600`, 하드코딩 HEX는 신규 코드에 사용하지 않습니다.
- **인라인 스타일 금지**: `style={{}}` 대신 Tailwind 클래스를 사용합니다. 동적으로 계산되는 값(예: `width: size * 0.4`)만 예외입니다.
- **폰트**: Pretendard Variable (CDN 로드). `font-ph` 클래스.
- **반응형**: 모바일 768px 미만, 태블릿 768–1024px, 데스크탑 1024px 이상.

---

## 9. 공통 컴포넌트 목록

### `components/ui/` — 범용 UI

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
| `PaymentTable` | `payments`, `showRefundColumn`, `onRefund` |
| `StarRate` | `value`, `onRate`, `disabled` |
| `Toast` | — (`useToast` 훅으로 사용) |
| `Logo` | — |

### `components/admin/` — 어드민 전용

| 컴포넌트 | import | 비고 |
|----------|--------|------|
| `SectionCard`, `LinkAction` | `@/components/admin/SectionCard` | 어드민 카드 레이아웃 |
| `Table`, `Th`, `Td`, `Tr`, `Identity` | `@/components/admin/DataTable` | 어드민 테이블 |
| `Badge`, `StatusBadge` | `@/components/admin/Badge` | 상태 뱃지 |

### `components/modals/` — 모달

| 모달 | 설명 |
|------|------|
| `LoginModal` | 로그인/회원가입 모달. `useAuthStore.openLoginModal()`로 열기 |
| `ConfirmDialog` | 확인/취소 범용 다이얼로그 |
| `EmailChangeModal` | 이메일 변경 모달 |

### `components/providers/`

| 컴포넌트 | 역할 |
|----------|------|
| `MockProvider` | MSW 서비스 워커 초기화. 준비 완료 전 렌더 차단 |
| `AuthSync` | 로그인 시 위시리스트 동기화, 어드민 계정 비어드민 경로 접근 시 자동 로그아웃 |

---

## 10. 새 코드 작성 전 체크리스트

새 함수·상수·컴포넌트를 작성하기 **전에** 반드시 아래 순서로 이미 있는지 확인합니다.

```
1. lib/utils.ts      — won() 등 공통 유틸
2. lib/constants.ts  — CATEGORIES 등 공유 상수
3. components/ui/    — 공통 UI
4. components/admin/ — 어드민 전용 (어드민 페이지 작업 시)
5. 없으면 추가, 있으면 import
```

이미 있는 것을 페이지 파일 내부에 재선언하는 것은 금지입니다.

### 컴포넌트 파일 분리 기준

아래 중 하나라도 해당하면 파일로 분리합니다:
- 다른 페이지/컴포넌트에서도 쓸 수 있는 UI (→ `components/ui/`)
- 100줄 이상의 JSX 블록
- 독립적인 `useState`를 가진 섹션
- 해당 라우트 전용이라면 → `app/[route]/_components/`

### TypeScript 타입 위치

| 범위 | 위치 |
|------|------|
| 특정 라우트 전용 | `app/[route]/types.ts` 또는 `page.tsx` 인라인 |
| 여러 라우트/컴포넌트 공유 | `lib/types.ts` |
| 어드민 전용 공유 | `app/admin/types.ts` |

---

## 11. 라우트별 현황 요약

| 라우트 | 경로 | 상태 | 비고 |
|--------|------|------|------|
| 홈 | `/` | 대부분 완료 | `window.location.href` → `router.push` 미교체 2곳 |
| 탐색 | `/browse` | 완료 | — |
| 상품 상세 | `/detail/[id]` | 대부분 완료 | 버전 업데이트 배너 미구현, 판매자 정보 하드코딩 |
| 판매 등록 | `/sell` | 완료 | 판매자 전용 |
| 내 상점 | `/shop` | 완료 | 판매자 전용 |
| 마이페이지 | `/mypage` | 대부분 완료 | 알림 설정 API 미연동, 아바타 업로드 미구현 |
| 리더 | `/reader/[id]` | 완료 | — |
| 편집 | `/edit/[id]` | 완료 | 판매자 전용 |
| 판매자 신청 | `/apply` | 완료 | — |
| 결제 | `/checkout` | 완료 | — |
| 어드민 | `/admin/**` | 구현 중 | plan.md Phase 9 |
| 카카오 콜백 | `/auth/kakao/callback` | 완료 | — |

---

## 12. 프로젝트 내 문서 목록

| 파일 | 내용 |
|------|------|
| `docs/onboarding.md` | **이 문서** — 신규 참여자 가이드 |
| `docs/conventions.md` | 코딩 컨벤션 (상수 위치, 컴포넌트 규칙, 스타일링) |
| `docs/design-tokens.md` | 디자인 토큰 전체 목록 및 클래스 매핑 치트시트 |
| `docs/frontend-gap-analysis.md` | 원본 HTML 대비 구현 갭 초기 분석 |
| `docs/frontend-gap-analysis-recheck.md` | 갭 분석 재검증 및 남은 작업 목록 |
| `docs/component-duplication-analysis.md` | 컴포넌트 중복 분석 |
| `docs/admin-structure-analysis.md` | 어드민 구조 분석 |
| `.claude/CLAUDE.md` | AI 에이전트용 프로젝트 규칙 |

---

## 13. 자주 묻는 것들

**Q. `tailwind.config.ts`가 없는데 커스텀 색상은 어떻게 추가하나요?**  
`app/globals.css`의 `:root`에 `--ph-새이름: #값`을 추가하고, `@theme` 블록에 `--color-ph-새이름: var(--ph-새이름)`을 추가합니다. 추가 후 `docs/design-tokens.md`를 반드시 동기화합니다.

**Q. `'use client'`는 언제 붙이나요?**  
`useState`, `useEffect`, 이벤트 핸들러 중 하나라도 사용할 때만 붙입니다. 그 외에는 Server Component로 유지합니다.

**Q. 이미지를 `<img>` 태그로 쓰면 안 되나요?**  
안 됩니다. 반드시 Next.js `<Image>` 컴포넌트를 사용합니다. S3 등 외부 도메인 이미지는 `next.config.ts`의 `images.domains`에 등록합니다. `thumbnail_url`이 `null`이면 `/images/promy-default.png`를 기본값으로 사용합니다.

**Q. 새 API를 추가할 때 어디에 핸들러를 추가하나요?**  
`mocks/handlers/` 내 관련 파일에 핸들러를 추가하고, `mocks/handlers/index.ts`의 해당 배열에 스프레드로 추가합니다.

**Q. 어드민 로그인 경로는 어디인가요?**  
`/admin/login` — 어드민 계정(`admin@prompthub.kr` / `password123`)으로 로그인합니다. 어드민은 일반 페이지에 접근하면 자동 로그아웃됩니다.
