# 관리자 화면 구조 분석

분석일: 2026-06-18  
대상 프로젝트: `C:\beadv6_6_3JMT_FE`  
원본 참고: `C:\beadv6_6_3JMT_FE\origin\prompthub_admin_clean`

---

## 1. 실제 관리자 경로

| 항목 | 값 |
|------|-----|
| 확인된 관리자 루트 경로 | `C:\beadv6_6_3JMT_FE\app\admin` |
| App Router 사용 위치 | `app/` (src 없음) |
| 현재 존재하는 관리자 URL | `/admin`, `/admin/login`, `/admin/users`, `/admin/sellers`, `/admin/products`, `/admin/orders`, `/admin/payments` |
| 관리자 전용 레이아웃 존재 여부 | 있음 (`app/admin/layout.tsx`) |
| 관리자 로그인 레이아웃 분리 여부 | pathname 조건 분기로 처리 (Route Group 아님) |
| 관리자 관련 컴포넌트 위치 | 없음 — 모든 UI가 각 page.tsx 안에 인라인으로 작성됨 |
| 관리자 인증 관련 파일 | `middleware.ts`, `app/admin/layout.tsx`, `store/useAuthStore.ts`, `mocks/handlers/admin.ts` |

---

## 2. 현재 관리자 파일 구조

```text
app/
└─ admin/
   ├─ layout.tsx          ← 사이드바 + 상단바 포함 공통 레이아웃
   ├─ page.tsx            ← 대시보드 (KPI 카드 + 최근 주문)
   ├─ login/
   │  └─ page.tsx         ← 관리자 로그인
   ├─ users/
   │  └─ page.tsx         ← 유저 관리
   ├─ sellers/
   │  └─ page.tsx         ← 판매자 신청 관리
   ├─ products/
   │  └─ page.tsx         ← 상품 관리 (상태 필터로 검수 포함)
   ├─ orders/
   │  └─ page.tsx         ← 주문 관리 (원본에 없는 추가 페이지)
   └─ payments/
      └─ page.tsx         ← 정산 내역

mocks/handlers/
└─ admin.ts               ← 관리자 Mock API 핸들러 (전체 구현됨)
```

---

## 3. 기존 구현 상태

| 경로 | 관련 파일 | 현재 내용 | 구현 상태 | 재사용 가능 여부 |
|------|-----------|----------|----------|----------------|
| `/admin/login` | `admin/login/page.tsx` | 이메일+비밀번호 폼, 에러 표시, 데모 안내, role 검증 | 일부 구현 | 유지 가능 (원본 디자인 이식 필요) |
| `/admin` (대시보드) | `admin/page.tsx` | KPI 4장 + 최근 주문 테이블, 스켈레톤 로딩 | 일부 구현 | 유지 가능 (7일 매출 그래프 누락) |
| `/admin/users` | `admin/users/page.tsx` | 유저 목록 테이블, role 변경 select | 일부 구현 | 유지 가능 (계정 상태 변경 기능 누락) |
| `/admin/sellers` | `admin/sellers/page.tsx` | 신청 카드 목록, 승인/거절 버튼 | 일부 구현 | 유지 가능 |
| `/admin/products` | `admin/products/page.tsx` | 상품 테이블, 상태 필터, 승인/거절 | 일부 구현 | 유지 가능 |
| `/admin/orders` | `admin/orders/page.tsx` | 주문 테이블, 환불 처리 | 일부 구현 | 유지 가능 (원본에 없는 추가 기능) |
| `/admin/payments` | `admin/payments/page.tsx` | 요약 카드 3장 + 정산 테이블 | 일부 구현 | 유지 가능 (정산 승인 처리 누락) |
| `/admin/seller-applications` | — | 없음 | 미구현 | `/admin/sellers`가 동일 역할 |
| `/admin/products/reviews` | — | 없음 | 미구현 | `/admin/products`의 status 필터가 대신 처리 |

---

## 4. 관리자 레이아웃 분석

**현재 관리자 레이아웃 구조** (`admin/layout.tsx`):

```
AdminLayout (flex h-screen)
├─ 사이드바 (aside, w-60, bg-#0f172a)
│  ├─ 로고 영역 (PromptHub + Admin 뱃지)
│  ├─ nav (NAV_ITEMS 6개 링크)
│  └─ 하단 유저 정보 (아바타, 이름, 이메일, 로그아웃 버튼)
└─ 메인 영역 (flex-1)
   ├─ 상단 헤더 (h-16, bg-white, 현재 메뉴 제목 + 날짜)
   └─ main (flex-1, overflow-y-auto, p-8)
      └─ {children}
```

| 항목 | 상태 | 비고 |
|------|------|------|
| 관리자 사이드바 | 있음 | 6개 메뉴, 활성 표시 |
| 관리자 상단바 | 있음 | 페이지 제목 + 하드코딩된 날짜만 |
| 콘텐츠 영역 | 있음 | `p-8`, `overflow-y-auto` |
| 현재 메뉴 활성 표시 | 있음 | `pathname.startsWith(item.href)` 기준 |
| 로그아웃 버튼 | 있음 | POST /api/v1/auth/logout 후 store.logout() |
| 반응형 구조 | 없음 | 모바일 레이아웃 미구현 |
| 일반 사용자 헤더 제외 | 됨 | `ConditionalLayout`에서 `/admin`은 isFullscreen 처리 |
| 일반 사용자 푸터 제외 | 됨 | 위와 동일 |
| 뱃지 카운트 (검토중 건수) | 없음 | 원본에는 사이드바 메뉴에 pending 건수 표시 |
| 페이지 부제목 | 없음 | 원본 Topbar에는 subtitle 존재 |
| 알림/도움말 버튼 | 없음 | 원본 Topbar에 있음 |

**일반 사용자 레이아웃과의 차이:**
- `ConditionalLayout.tsx`가 `pathname.startsWith('/admin')` 를 isFullscreen으로 처리 → Header/Footer 완전 제외됨 → 정상
- 루트 `layout.tsx`에서 공유하는 요소: `MockProvider`, `AuthSync`, `Toast` — 관리자 화면에도 적용됨 (문제 없음)
- `<html>`, `<body>` 태그 공유: 폰트(Pretendard) 공유됨 → 관리자에도 동일 폰트 적용 (문제 없음)

**유지 가능한 부분:** 전체 레이아웃 구조, 사이드바 링크, 메뉴 활성 표시 로직, 로그아웃 처리

**보완이 필요한 부분:**
1. 상단바 날짜 하드코딩 (`"2026-06-17"` → `new Date().toLocaleDateString()`)
2. 사이드바 뱃지 카운트 (pending 건수) 미구현
3. 원본 Topbar의 subtitle 미구현
4. 로그인 페이지 레이아웃 분리 방식 — 현재 pathname 조건 분기 사용, Route Group으로 변경 선택 가능

**레이아웃 분리 필요 여부:** 현재 구조로 동작함. Route Group으로 변경하는 것은 선택사항.

---

## 5. 원본 관리자 화면과 비교

| 관리자 메뉴 | 원본 참고 파일 | 현재 경로 | 현재 구현 상태 | 누락 요소 |
|------------|--------------|----------|--------------|----------|
| 관리자 로그인 | `admin-login-page.js` | `/admin/login` | 일부 구현 | 원본의 시각적 레이아웃(좌측 브랜딩 영역) 미이식; 기능은 동일 |
| 관리자 대시보드 | `dashboard-page.js` | `/admin` | 일부 구현 | 7일 매출 꺾은선 그래프 누락; KPI 카드는 구현됨 |
| 사용자 관리 | `users-page.js` | `/admin/users` | 일부 구현 | 계정 상태(활성/정지/탈퇴) 변경 기능 없음; role 변경만 있음 |
| 판매자 신청 관리 | `seller-applications-page.js` | `/admin/sellers` | 일부 구현 | 원본의 가게명 필드, 상세 검토 패널 없음 |
| 상품 검수 | `product-review-page.js` | `/admin/products` | 일부 구현 | 별도 sub-route 없이 status 필터로 처리; 상세 검수 패널 없음 |
| 정산 관리 | `settlements-page.js` | `/admin/payments` | 일부 구현 | 정산 승인 처리 버튼 없음; 조회만 가능 |
| 관리자 공통 사이드바 | `shared-admin-ui.js` | `admin/layout.tsx` | 일부 구현 | 뱃지 카운트 없음, 그룹 헤더("운영 관리") 없음, 원본 디자인 스타일 차이 |
| 관리자 공통 상단바 | `shared-admin-ui.js` | `admin/layout.tsx` | 일부 구현 | subtitle 없음, 알림/도움말 버튼 없음, 팀 배지 없음 |
| 주문 관리 | (원본 없음) | `/admin/orders` | 일부 구현 | 원본에 없는 추가 페이지 — 환불 처리 포함 |

**원본 사이드바 vs 현재 사이드바 차이:**

| 항목 | 원본 | 현재 |
|------|------|------|
| 배경색 | `var(--ph-white)` (흰색) | `#0f172a` (다크 네이비) |
| 텍스트 | `var(--ph-text-secondary)` | `#94a3b8` / `#fff` |
| 활성 항목 | `var(--ph-secondary)` bg + `var(--ph-primary)` 텍스트 | `#1B64DA` bg + 흰색 텍스트 |
| 그룹 헤더 | "운영 관리" 그룹 헤더 있음 | 없음 |
| 아이콘 | Lucide 아이콘 (`data-lucide` 속성) | 이모지 (▣, 👥, 📦 등) |
| 뱃지 | pending 건수 표시 | 없음 |
| 메뉴 수 | 5개 (대시보드 + 운영관리 4개) | 6개 (주문관리 추가됨) |

---

## 6. 관리자 인증 및 권한 분석

| 항목 | 현재 관련 파일 | 현재 구현 상태 | 보완 필요 여부 |
|------|--------------|--------------|--------------|
| 관리자 로그인 | `admin/login/page.tsx` | 완료 (role 검증 포함) | 낮음 |
| 관리자 Role 확인 | `store/useAuthStore.ts` | 완료 (`role: 'admin'` 타입 정의됨) | 없음 |
| middleware 접근 제어 | `middleware.ts` | 완료 (서버 사이드 cookie 기반) | 없음 |
| 비관리자 접근 차단 | `middleware.ts` + `admin/layout.tsx` | 완료 (이중 체크) | 없음 |
| 미로그인 사용자 Redirect | `middleware.ts` | 완료 (`/admin/login`으로 redirect) | 없음 |
| 로그아웃 | `admin/layout.tsx` | 완료 (API 호출 + store 초기화 + `/` redirect) | 없음 |
| 관리자 세션 유지 | `useAuthStore` persist + cookie | 완료 (localStorage + cookie 이중 저장) | 없음 |
| 원본 목업 인증 코드 사용 여부 | — | 없음 — 실제 API 호출 구조 사용 | — |

**세부 인증 구조:**

```
1. middleware.ts (서버 사이드):
   /admin/* (login 제외) → cookie의 token, role 확인
   → role !== 'admin'이면 /admin/login redirect

2. admin/layout.tsx (클라이언트):
   useEffect → user?.role !== 'admin' 이면 /admin/login redirect
   (middleware 통과 후 Zustand 상태 불일치 방어)

3. admin/login/page.tsx:
   POST /api/v1/auth/login → role 확인 → admin만 허용
   login() → cookie 설정 + Zustand store 저장
```

**일반 사용자 로그인과 관리자 로그인의 관계:**
- 동일한 `/api/v1/auth/login` API 사용 — 같은 인증 구조
- `login()` 액션이 `document.cookie = role=...` 설정 → middleware에서 role cookie 읽음
- 관리자 로그인 페이지에서 role 검증 후 비관리자 차단

**layout.tsx의 조건 주의사항:**
```tsx
if (user && user.role !== 'admin') router.replace('/admin/login')
```
- user가 null이면 조건 미실행 → middleware가 이미 처리하므로 실용적으로 문제 없음
- 단, useAuthStore rehydration 전 순간에 user가 null인 상태에서 잠깐 대시보드가 노출될 수 있음

---

## 7. 구현 위치 판단

1. **관리자 페이지를 현재 `app/admin` 내부에 이어서 구현하는 것이 맞는가?**  
   → **예.** `app/admin/` 구조가 이미 충분히 갖춰져 있고 동작함.

2. **기존 관리자 `layout.tsx`를 재사용할 수 있는가?**  
   → **예.** 레이아웃 구조는 재사용 가능. 날짜 하드코딩, 뱃지 카운트, Topbar subtitle 등 소폭 보완 가능.

3. **관리자 로그인도 `/admin/login` 아래에 두는 것이 적절한가?**  
   → **예.** 현재 위치가 자연스럽고 middleware matcher에 포함되어 있음.

4. **관리자 로그인 화면에는 관리자 사이드바 레이아웃을 적용하지 않아야 하는가?**  
   → **예.** 현재 `layout.tsx`에서 `pathname === '/admin/login'` 조건으로 사이드바 제외 처리됨.

5. **Route Group 또는 별도 중첩 레이아웃이 필요한가?**  
   → 현재 pathname 조건 분기로 정상 동작하므로 **필수 아님.** 향후 사이드바 없는 관리자 페이지가 추가되면 Route Group으로 전환 권장.

6. **기존 파일 중 유지할 파일:**
   - `app/admin/layout.tsx` — 구조 유지, 소폭 수정 필요
   - `app/admin/login/page.tsx` — 유지 (원본 디자인 이식 필요)
   - `app/admin/page.tsx` — 유지 (그래프 추가 필요)
   - `app/admin/users/page.tsx` — 유지 (계정 상태 변경 추가 필요)
   - `app/admin/sellers/page.tsx` — 유지
   - `app/admin/products/page.tsx` — 유지
   - `app/admin/orders/page.tsx` — 유지
   - `app/admin/payments/page.tsx` — 유지 (정산 승인 처리 추가 필요)
   - `mocks/handlers/admin.ts` — 유지

7. **기존 파일 중 수정이 필요한 파일:**
   - `app/admin/layout.tsx` — 날짜 하드코딩 수정, 뱃지 카운트 추가, Topbar 보완
   - `app/admin/users/page.tsx` — 계정 상태(active/suspended/withdrawn) 변경 기능 추가
   - `app/admin/payments/page.tsx` — 정산 승인 처리 기능 추가

8. **새로 필요한 페이지:**
   - 없음 — 현재 7개 페이지가 원본 5개 메뉴를 모두 커버함 (주문관리는 추가 기능)

9. **새로 필요한 공통 컴포넌트:**
   - `components/admin/StatusBadge.tsx` — 상태 뱃지 (각 페이지에 중복 정의 중)
   - `components/admin/TableSkeleton.tsx` — 테이블 스켈레톤 (각 페이지에 중복)
   - (선택) `components/admin/SectionCard.tsx` — 카드 래퍼

10. **인증·권한 처리를 먼저 확정해야 하는가?**  
    → **아니오.** 이미 middleware + layout + store 3중 구조로 완성됨.

11. **API Docs를 먼저 확인해야 하는 메뉴:**
    - 전체 관리자 API가 `docs/api-spec.md`에 누락됨 → 모든 메뉴에서 API 명세 추가 필요
    - 현재는 `mocks/handlers/admin.ts`의 mock이 사실상 임시 명세 역할

---

## 8. 권장 최종 구조

현재 구조를 최대한 유지합니다. Route Group은 로그인 페이지가 현재 pathname 분기로 잘 동작하므로 선택사항입니다.

```text
app/
└─ admin/
   ├─ layout.tsx              ← 사이드바+상단바 (로그인 제외)
   ├─ page.tsx                ← 대시보드
   ├─ login/
   │  └─ page.tsx             ← 관리자 로그인 (사이드바 없음)
   ├─ users/
   │  └─ page.tsx             ← 사용자 관리
   ├─ sellers/
   │  └─ page.tsx             ← 판매자 신청 관리
   ├─ products/
   │  └─ page.tsx             ← 상품 관리 + 검수
   ├─ orders/
   │  └─ page.tsx             ← 주문 관리
   └─ payments/
      └─ page.tsx             ← 정산 관리

components/
└─ admin/                     ← (신규) 관리자 공통 컴포넌트
   ├─ StatusBadge.tsx
   └─ TableSkeleton.tsx

mocks/handlers/
└─ admin.ts                   ← 현행 유지
```

> Route Group 대안 (필요 시):
> ```text
> app/admin/
> ├─ (auth)/
> │  └─ login/page.tsx
> └─ (dashboard)/
>    ├─ layout.tsx
>    ├─ page.tsx
>    ├─ users/page.tsx
>    └─ ...
> ```

---

## 9. 이후 개별 구현 작업

### ADMIN-1. 레이아웃 보완

| 항목 | 내용 |
|------|------|
| 작업명 | 관리자 레이아웃 날짜 동적화 및 Topbar 보완 |
| 대상 | layout.tsx |
| 원본 참고 | `shared-admin-ui.js` Topbar 섹션 |
| 수정 파일 | `app/admin/layout.tsx` |
| 구현할 UI | 날짜를 `new Date().toLocaleDateString('ko-KR')`으로 변경 |
| 구현할 동작 | 없음 |
| 인증·권한 | 해당 없음 |
| API 연동 | 없음 |
| 선행 작업 | 없음 |
| 완료 조건 | 날짜가 실제 날짜로 출력됨 |
| 영향 범위 | 모든 관리자 페이지 상단바 |

---

### ADMIN-2. 사이드바 뱃지 카운트

| 항목 | 내용 |
|------|------|
| 작업명 | 사이드바 메뉴 pending 건수 뱃지 |
| 대상 | 판매자신청, 상품관리 |
| 원본 참고 | `shared-admin-ui.js` NAV 배열의 `key: "sellersBadge"` 패턴 |
| 수정 파일 | `app/admin/layout.tsx` |
| 구현할 UI | 사이드바 메뉴 우측에 pending 건수 숫자 뱃지 |
| 구현할 동작 | `GET /api/v1/admin/sellers/applies`, `GET /api/v1/admin/products` 에서 pending 건수 집계 |
| 인증·권한 | token 필요 |
| API 연동 | 필요 |
| 선행 작업 | 없음 |
| 완료 조건 | 판매자신청·상품관리 메뉴에 검토중 건수가 표시됨 |
| 영향 범위 | layout.tsx 전용 |

---

### ADMIN-3. 사용자 관리 계정 상태 변경

| 항목 | 내용 |
|------|------|
| 작업명 | 유저 계정 상태(활성/정지/탈퇴) 변경 기능 추가 |
| 대상 | 사용자 관리 |
| 원본 참고 | `users-page.js` `setUserStatus` 함수 |
| 수정 파일 | `app/admin/users/page.tsx` |
| 새로 만들 파일 | 없음 |
| 구현할 UI | 역할 변경 select 옆에 상태 변경 버튼(정지/활성화) 추가 |
| 구현할 동작 | `PUT /api/v1/admin/users/:id` 에 `status` 필드 전송 |
| 인증·권한 | token 필요 |
| API 연동 | 필요 (API 명세 확인 필요) |
| 선행 작업 | API 명세 확인 |
| 완료 조건 | 유저 상태를 정지/활성으로 변경 가능 |
| 영향 범위 | users 페이지 전용 |

---

### ADMIN-4. 대시보드 매출 그래프

| 항목 | 내용 |
|------|------|
| 작업명 | 대시보드 7일 매출 꺾은선 그래프 |
| 대상 | 대시보드 |
| 원본 참고 | `dashboard-page.js` BarChart 섹션 |
| 수정 파일 | `app/admin/page.tsx` |
| 구현할 UI | 7일간 일별 매출 꺾은선 또는 막대 그래프 |
| 구현할 동작 | `GET /api/v1/admin/stats` 또는 별도 `GET /api/v1/admin/sales` |
| 인증·권한 | token 필요 |
| API 연동 | 필요 (API 명세 확인 필요) |
| 선행 작업 | 차트 라이브러리 결정 (recharts 등) |
| 완료 조건 | 대시보드에 7일 매출 트렌드 그래프 표시 |
| 영향 범위 | dashboard 페이지 전용 |

---

### ADMIN-5. 정산 승인 처리

| 항목 | 내용 |
|------|------|
| 작업명 | 정산 대기 → 승인 처리 버튼 추가 |
| 대상 | 정산 관리 |
| 원본 참고 | `settlements-page.js` `actSettlement` 함수 |
| 수정 파일 | `app/admin/payments/page.tsx` |
| 구현할 UI | pending 상태 행에 "승인" 버튼 추가 |
| 구현할 동작 | `PUT /api/v1/admin/payments/:id/approve` |
| 인증·권한 | token 필요 |
| API 연동 | 필요 (API 명세 확인 필요, mock handler 추가 필요) |
| 선행 작업 | API 명세 확인, mock handler 추가 |
| 완료 조건 | 정산 대기 항목을 승인 처리 가능 |
| 영향 범위 | payments 페이지 전용 |

---

### ADMIN-6. 공통 컴포넌트 분리 (선택)

| 항목 | 내용 |
|------|------|
| 작업명 | 중복 StatusBadge, TableSkeleton 컴포넌트 분리 |
| 대상 | 전체 관리자 페이지 |
| 원본 참고 | `design-system.js` StatusBadge |
| 새로 만들 파일 | `components/admin/StatusBadge.tsx`, `components/admin/TableSkeleton.tsx` |
| 구현할 UI | 재사용 가능한 상태 뱃지, 테이블 스켈레톤 |
| 구현할 동작 | 없음 |
| API 연동 | 없음 |
| 선행 작업 | ADMIN-1~5 완료 후 리팩터링으로 진행 |
| 완료 조건 | 각 page.tsx에서 중복 코드 제거됨 |
| 영향 범위 | 모든 관리자 페이지 |

---

### ADMIN-7. 관리자 API 명세 문서화

| 항목 | 내용 |
|------|------|
| 작업명 | `docs/api-spec.md`에 관리자 API 섹션 추가 |
| 원본 참고 | `mocks/handlers/admin.ts` (현재 구현된 mock 기준) |
| 수정 파일 | `docs/api-spec.md` |
| 내용 | GET/PUT 전체 admin 엔드포인트, 요청/응답 DTO |
| 선행 작업 | 없음 (언제든 진행 가능) |
| 완료 조건 | api-spec.md에 `/api/v1/admin/*` 섹션이 추가됨 |
| 영향 범위 | 문서만 |

---

## 판단 요약

- **현재 상태:** 관리자 구조가 이미 충분히 구성됨. 7개 페이지 모두 일부 구현됨.
- **구현 위치:** 기존 `app/admin/` 내부에 이어서 구현하는 것이 적절함.
- **레이아웃:** 기존 `layout.tsx` 재사용 가능. Route Group 불필요.
- **인증·권한:** middleware + layout + store 3중 구조로 이미 완성. 선행 확정 불필요.
- **API:** `docs/api-spec.md`에 관리자 API 섹션 누락 — 구현 전 추가 권장.
- **원본 디자인:** 사이드바 색상 스타일이 원본(흰색)과 현재(다크)가 다름. 어느 스타일을 기준으로 할지 확인 필요.
- **우선순위 권장 순서:** ADMIN-1(날짜) → ADMIN-7(API 명세) → ADMIN-3(유저 상태) → ADMIN-2(뱃지) → ADMIN-5(정산 승인) → ADMIN-4(그래프) → ADMIN-6(컴포넌트 분리)
