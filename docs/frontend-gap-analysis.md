# PromptHub Frontend Gap Analysis
작성일: 2026-06-17

---

## 1. 프로젝트 구조 확인 결과

### 비교 기준 원본
- 경로: `C:\beadv6_6_3JMT_FE\origin\prompthub_clean\`
- 형태: 단일 HTML + 복수 JS 파일로 구성된 SPA (React CDN 방식)
- 라우팅: 클라이언트 상태(`route` 변수)로 화면 전환
- 주요 파일:
  - `app.js` — 전역 라우터·상태(cart, wishlist, purchased, ratings, versionsMap, myListings)
  - `home-page.js` — 홈 화면 3가지 Hero 방향(toss/split/search) + 공통 섹션
  - `browse-page.js` — 탐색 화면(카테고리·정렬·검색 필터)
  - `product-components.js` — PromptCard, DetailScreen, PriceTag, ImageCarousel
  - `seller-pages.js` — SellScreen, EditScreen, ShopScreen, SellerApplyScreen, AccessGate
  - `mypage.js` — MyPage(5 탭), EmailChangeModal, ReaderScreen, StarRate
  - `shared-layout.js` — Header(알림·장바구니·유저메뉴 드롭다운), Footer, LoginModal
  - `mock-data.js` — 카테고리 7개, 태그 6개, 프롬프트 12개
  - `version-history.js` — 버전 시드 데이터(SEED), combine/nextVer/todayStr 함수

### 현재 Next.js 프로젝트
- 경로: `C:\beadv6_6_3JMT_FE\`
- 형태: Next.js 14+ App Router + TypeScript
- 라우팅: 파일 기반 라우팅 (`app/[경로]/page.tsx`)
- 주요 디렉터리:
  - `app/` — 9개 라우트 + checkout, admin, auth/kakao/callback
  - `components/layout/` — Header.tsx, Footer.tsx, ConditionalLayout.tsx
  - `components/modals/` — LoginModal.tsx, EmailChangeModal.tsx
  - `components/ui/` — FormField, ImageCarousel, ImageUpload, Logo, PaymentTable, PromptCard, StarRate, Toast, shader-background
  - `components/providers/` — AuthSync.tsx, MockProvider.tsx
  - `mocks/` — MSW 핸들러(auth, products, orders, payments, wishlists, sellers, users, notifications, admin, oauth)
  - `store/` — useAuthStore, useCartStore, useWishStore, useToastStore
  - `middleware.ts` — 인증/권한 보호

---

## 2. 전체 메뉴 비교표

| 메뉴·화면 | 원본 관련 파일 | 원본 주요 기능 | 현재 Next.js 경로 | 현재 관련 파일 | 구현 상태 | 누락·차이 |
|-----------|---------------|--------------|-------------------|--------------|-----------|---------|
| 홈 | home-page.js | Hero(toss/split/search 3방향), PopularGrid(판매순), CategorySection(6개), WhySection(3가지), SellerCTA(마스코트) | `/` | app/page.tsx | 일부 구현 | Hero: toss 방향만 구현(split/search 미구현). 마스코트 이미지 다름(promy-character→hero-mockup). 카테고리 클릭 시 `label` 대신 `id`로 query 전송 |
| 탐색 | browse-page.js | 카테고리 탭·정렬(인기/평점/가격)·검색 초기화·결과 수 표시 | `/browse` | app/browse/page.tsx | 완료 | URL 파라미터 기반으로 구현, 원본과 거의 동일. sort 파라미터 문자열 차이(원본: '인기순' 등, 현재: 'popular'/'rating'/'price-asc'로 API 변환) |
| 상세 | product-components.js | ImageCarousel, PriceTag(구매함/무료/할인), 판매자 카드, 버전 기록, 구매·장바구니·찜 버튼, 비슷한 프롬프트 | `/detail/[id]` | app/detail/[id]/page.tsx | 완료 | 원본과 거의 동일. 단, 원본의 "새 버전 알림(outdated 배너)"은 미구현(boughtVer vs latest.ver 비교 로직 없음). 찜 삭제 시 wishlistId 조회 흐름이 복잡 |
| 판매 등록 | seller-pages.js | 기본정보+프롬프트내용+태그+썸네일(image-slot)+소개이미지, 라이브 미리보기, 임시저장, 등록하기(admin 검수) | `/sell` | app/sell/page.tsx | 완료 | 원본의 `image-slot` 커스텀엘리먼트 → ImageUpload 컴포넌트로 대체. API 연동 완료. 임시저장은 API 없이 로컬 상태만 처리(원본과 동일) |
| 내 상점 | seller-pages.js | 통계 3개(등록/판매/수익), 내 프롬프트 목록(검수중/판매중/중단), 수정·판매중단 액션 | `/shop` | app/shop/page.tsx | 완료 | 원본 대비 **탭 추가**: "정산 내역" 탭 추가 구현(원본에는 없음). 통계: 원본은 하드코딩 데이터, 현재는 API 연동. 판매 중단 API 연동 완료 |
| 마이페이지 | mypage.js | 5탭(프로필/구매/찜/결제내역/설정), 닉네임·이메일·비밀번호 변경, 알림 설정, 환불 신청, 회원 탈퇴 | `/mypage` | app/mypage/page.tsx | 일부 구현 | 회원 탈퇴 버튼 존재하나 동작 미연결(`onClick={() => {}}` 빈 함수). 로그아웃 버튼도 동작 미연결(`onClick={() => {}}` 빈 함수). 알림 설정 토글은 로컬 상태만, API 저장 미구현 |
| 리더 | mypage.js | 프롬프트 전문(블러→다운로드 후 해제), 형식 선택(txt/md/pdf), 별점, 판매자 문의, 구매일 표시 | `/reader/[id]` | app/reader/[id]/page.tsx | 완료 | 원본은 형식 선택 드롭다운 1개, 현재는 TXT/MD/PDF 버튼 3개로 변경(UX 개선). localStorage로 downloaded 상태 유지(원본보다 향상) |
| 편집 | seller-pages.js | 제목/카테고리/모델/가격/내용 수정, 업데이트 내용(필수) 입력, 버전 증가(단순 patch) | `/edit/[id]` | app/edit/[id]/page.tsx | 완료 | 원본보다 **향상**: PATCH/MAJOR 버전 유형 선택 UI 추가, 버전별 즉시 적용 vs 검수 후 적용 로직 구현. 대표 썸네일 업로드 기능 추가 |
| 판매자 신청 | seller-pages.js | 신청자 정보(읽기전용), 카테고리(최대3개), 소개, 포트폴리오, 약관 동의, 완료 상태 화면 | `/apply` | app/apply/page.tsx | 완료 | 원본과 거의 동일. API 연동 완료. 신청 상태(`apply-status`) 조회 후 이미 신청한 경우 완료 화면 표시(원본보다 향상) |
| 결제 | (원본 없음, 원본은 purchase() 함수로 즉시처리) | — | `/checkout` | app/checkout/page.tsx | 구조 차이 | 원본에 없는 화면. Next.js에서 새로 추가. 단건 구매(`?id=`) 및 장바구니 구매 모두 지원 |
| 어드민 | (원본 없음) | — | `/admin`, `/admin/login`, `/admin/orders`, `/admin/payments`, `/admin/products`, `/admin/sellers`, `/admin/users` | app/admin/ | 미확인 | 원본에 없는 추가 기능. 분석 범위 외 |

---

## 3. 메뉴별 상세 분석

### 3-1. 홈 (/)

**원본 구성 요소:**
1. Hero 섹션 — 3가지 방향(`toss`/`split`/`search`), Tweaks 패널로 런타임 전환
2. Badge ("12,000개 이상의 검증된 프롬프트")
3. SearchBar (hero 크기)
4. PopularTags (인기 검색어 6개)
5. Mascot 이미지 (promy-character.png, float 애니메이션)
6. PopularGrid — 판매순 상위 `gridCols×2`개
7. CategorySection — 카테고리 6개 버튼 (3열), 클릭 시 해당 카테고리 검색
8. WhySection — 3가지 이유 카드
9. SellerCTA — 마스코트 이미지 포함

**현재 구현 상태:**
- Hero: toss 방향만 구현. ShaderBackground로 배경 개선됨(원본은 linear-gradient).
- Mascot: hero-mockup.png 사용(원본은 promy-character.png)
- CategorySection: `c.id`를 query로 전달, 원본은 `c.label`을 query로 전달
- SellerCTA: promy-character.png 사용(원본과 일치)
- PopularGrid: API 연동(`/api/v1/product?sort=popular&size=8`)
- Tweaks 패널: 원본에만 있음, Next.js 버전에는 없음(의도적 제외로 OK)

**누락·차이:**
- `split`, `search` hero 방향 미구현(원본에는 TweaksPanel로 전환 가능했지만 프로덕션 제외 가능)
- CategorySection에서 클릭 시 넘기는 값이 `id` vs `label` 불일치 → `/browse?category=image` (id 기준)은 API와 맞지만 원본과 다름
- hero 이미지: 원본은 마스코트 캐릭터, 현재는 목업 이미지 사용
- `window.location.href`를 직접 사용하는 코드 존재(`/browse?q=...`) → `router.push` 권장

### 3-2. 탐색 (/browse)

**원본 구성 요소:**
1. 헤더 ("프롬프트 탐색", 결과 수)
2. 카테고리 탭 (전체 포함 7개)
3. 검색 초기화 버튼 (검색어 있을 때만)
4. 정렬 버튼 (인기순/평점순/가격순)
5. 결과 그리드 (gridCols × ... )
6. 빈 결과 상태

**현재 구현 상태:**
- 원본과 거의 동일. URL 파라미터(`q`, `category`)로 상태 관리.
- API 연동 완료(`/api/v1/product?q=...&category=...&sort=...`)
- 정렬: 한국어 → API 파라미터 변환 로직 있음

**누락·차이:**
- 원본은 클라이언트 내 즉시 필터링, 현재는 API 호출 방식 (올바른 방향)
- 원본 gridCols 동적 설정 없음(고정 4열), 현재도 고정 4열 → 일치

### 3-3. 상세 (/detail/[id])

**원본 구성 요소:**
1. 탐색으로 돌아가기 버튼
2. ImageCarousel (슬라이드 4개, 화살표·점·썸네일 스트립)
3. 배지(모델, badge)
4. 제목, 별점·판매수
5. 프롬프트 소개
6. 판매자 카드
7. 사이드바 sticky: 버전 상태 배너(outdated/최신), 구매 카드(가격/구매버튼/장바구니/찜), 버전 기록 accordion
8. 비슷한 프롬프트 (카테고리 기준 4개)

**현재 구현 상태:**
- 대부분 구현 완료. API 연동(`/api/v1/product/:id`, `/api/v1/product/:id/related`)
- wishlistId 관리(낙관적 업데이트 + 롤백)

**누락·차이:**
- 원본의 "새 버전 업데이트 알림 배너" (boughtVer ≠ latest.ver 시 표시) 미구현 → 현재는 항상 "최신 버전 보유" 배너만 표시
- 리더 페이지로의 직접 이동 버튼(원본: 구매 후 "최신 버전 다시 받기") 미구현

### 3-4. 판매 등록 (/sell)

**원본 구성 요소:**
1. 내 상점으로 뒤로가기
2. 기본정보(제목/카테고리/모델/가격)
3. 프롬프트 내용 textarea
4. 태그 입력
5. 대표 썸네일 (`image-slot`)
6. 소개 이미지 5장 (`image-slot` 5개)
7. 임시저장/등록하기 버튼
8. 라이브 미리보기(카드+내용)

**현재 구현 상태:**
- 완료. `image-slot` → `ImageUpload` 컴포넌트로 대체
- API 연동(`POST /api/v1/product`)

**누락·차이:**
- 없음. API 실패 시 toast 에러 메시지 표시(원본보다 향상)

### 3-5. 내 상점 (/shop)

**원본 구성 요소:**
1. 헤더(판매자 이름, "새 프롬프트 등록" 버튼)
2. 통계 카드 3개(등록 프롬프트/누적 판매/이번 달 수익)
3. 내 프롬프트 그리드(4열): 상태별(검수중/판매중/중단) 오버레이, 수정/판매중단 버튼

**현재 구현 상태:**
- 탭 구조 추가("내 프롬프트" + "정산 내역")
- 통계: API 연동(`/api/v1/sellers/me/stats`, 누적 수익 필드명 `totalRevenue`)
- 정산 내역: PaymentTable 컴포넌트, 필터(전체/결제완료/환불신청중/환불완료)

**누락·차이:**
- 판매자 이름 하드코딩("프롬프트랩님") → API에서 받은 사용자 이름으로 교체 필요
- 원본에는 없는 정산 내역 탭 추가(확장 기능)

### 3-6. 마이페이지 (/mypage)

**원본 구성 요소:**
1. 사이드바 5탭 + 로그아웃 버튼
2. 프로필 탭: 아바타(image-slot), 이름/이메일/역할, 프로필 수정 링크, 통계 3개
3. 구매한 프롬프트 탭: 환불된 항목 오버레이, 클릭 시 리더로 이동
4. 찜한 프롬프트 탭
5. 결제 내역 탭: 테이블(상품명/결제일/금액/상태/환불), 환불 신청 모달
6. 설정 탭: 닉네임/이메일/비밀번호, 알림 설정 3개, 회원 탈퇴

**현재 구현 상태:**
- 5탭 구조 구현. API 연동(orders, wishlists, users/me)
- 이메일 변경 모달(EmailChangeModal) 별도 컴포넌트
- 비밀번호 변경 모달(PasswordChangeModal) 인라인 구현
- URL 파라미터(`?tab=`) 로 탭 동기화

**누락·차이:**
1. **로그아웃 버튼 동작 미연결**: `onClick={() => {}}` 빈 함수. `useAuthStore`의 `logout` 함수 호출 필요
2. **회원 탈퇴 동작 미연결**: `onClick={() => {}}` 빈 함수. API 연동 및 확인 모달 필요
3. **알림 설정 API 미연동**: 토글은 로컬 상태만, 저장 API 없음
4. **프로필 탭 아바타**: 원본은 `image-slot`(업로드 가능), 현재는 promy-character.png 고정
5. **구매한 프롬프트**: 클릭 시 `/reader/:id`로 이동하나, mypage 탭 내에서 열리는 방식이 아님(원본과 방식 차이, OK)

### 3-7. 리더 (/reader/[id])

**원본 구성 요소:**
1. "다른 구매 프롬프트 보기" 뒤로가기(마이페이지 purchased 탭)
2. 배지(카테고리/모델/구매완료)
3. 제목, 구매일
4. 프롬프트 전문 카드(blur 처리, 다운로드 후 해제)
5. 다운로드 버튼 → 확인 모달 → 형식 선택(txt/md/pdf)
6. 별점 카드(StarRate)
7. 판매자 카드 + 문의하기 버튼

**현재 구현 상태:**
- 완료. localStorage로 downloaded·rating 상태 유지(원본보다 향상)
- 형식 선택: 드롭다운 대신 버튼 3개(UX 차이, OK)
- 별점 API 연동(`POST /api/v1/product/:id/rating`)
- 리더 페이지 자체 nav 바 포함(메인 헤더 제외)

**누락·차이:**
- 원본은 마이페이지 purchased 탭으로 돌아가는 동작, 현재는 `/mypage`로 이동(탭 포함 X) → 원본과 다소 다름(사소함)

### 3-8. 편집 (/edit/[id])

**원본 구성 요소:**
1. 내 상점으로 뒤로가기
2. 현재 버전 → 다음 버전 표시
3. 기본정보 수정
4. 프롬프트 내용 수정
5. 업데이트 내용 입력(필수)
6. 저장/취소 버튼

**현재 구현 상태:**
- 원본보다 향상: PATCH/MAJOR 버전 유형 선택 UI 추가
- API 연동(`PUT /api/v1/product/:id`)
- 대표 썸네일 업로드 추가

**누락·차이:**
- 없음(원본 기능 완전 포함 + 확장)

### 3-9. 판매자 신청 (/apply)

**원본 구성 요소:**
1. 비로그인 게이트 화면
2. 신청자 정보(읽기전용)
3. 주력 카테고리(최대 3개)
4. 판매 계획 소개(선택)
5. 포트폴리오 링크(선택)
6. 약관 동의 체크박스
7. 완료 화면

**현재 구현 상태:**
- 완료. API 연동(`POST /api/v1/seller`, `GET /api/v1/sellers/apply-status`)
- 기신청 여부 자동 확인

**누락·차이:**
- 없음

### 3-10. 결제 (/checkout) — 원본에 없는 화면

**현재 구현 상태:**
- 단건(`?id=`) 및 장바구니 모드 모두 지원
- 결제 완료 배너 + 자동 이동
- API 연동(`POST /api/v1/payments/confirm`)

---

## 4. 공통 영역 비교

### 4-1. 헤더

| 항목 | 원본 | 현재 Next.js | 상태 |
|------|------|-------------|------|
| 로고 | 버튼(go("home")) | Logo 컴포넌트(`/`) | 완료 |
| 탐색·카테고리 nav 링크 | NavLink 2개 | NavLink 2개 | 완료 |
| 헤더 SearchBar | 있음 | 있음 | 완료 |
| 알림 (Bell) | 하드코딩 3개 | API 연동(`/api/v1/notifications`) | 완료(향상) |
| 장바구니 드롭다운 | cart 상태 표시, 삭제, 결제하기 버튼 | cart 상태 표시, 삭제, 결제하기(/checkout) | 완료 |
| 유저 메뉴 | 마이페이지/내상점(판매자)/구매한프롬프트(구매자)/설정/로그아웃 | 동일 항목 | 완료 |
| 모바일 햄버거 | 있음(SearchBar+탐색+카테고리) | 있음 | 완료 |
| 판매하기 버튼 (판매자) | 있음 | 있음 | 완료 |
| 내 상점 아이콘 (판매자) | 있음 | 있음 | 완료 |
| 찜 아이콘 | 없음 | 있음 | 추가됨 |

### 4-2. 푸터

| 항목 | 원본 | 현재 Next.js | 상태 |
|------|------|-------------|------|
| 로고 | 있음 | 있음 | 완료 |
| 설명 문구 | 있음 | 있음 | 완료 |
| 소셜 아이콘 (twitter/instagram/youtube) | 있음 | 확인 필요 | 동작 확인 필요 |
| 링크 컬럼 3개 | 있음(정적 링크) | 확인 필요 | 동작 확인 필요 |
| 카피라이트 | 있음 | 있음 | 완료 |

### 4-3. LoginModal

| 항목 | 원본 | 현재 Next.js | 상태 |
|------|------|-------------|------|
| 카카오 로그인 버튼 | 있음 | 있음 | 완료 |
| 이메일/비밀번호 입력 | 있음 | 있음 | 완료 |
| 회원가입 모드 전환 | 있음 | 확인 필요 | 동작 확인 필요 |
| 계정 역할 자동 판별 | 이메일 패턴 기반 | 서버 응답 기반 | 완료(향상) |
| 데모 안내 문구 | 있음 | 불명 | 동작 확인 필요 |

### 4-4. 전역 Toast

| 항목 | 원본 | 현재 Next.js | 상태 |
|------|------|-------------|------|
| 고정 위치 토스트 | 있음(check-circle-2 아이콘) | Toast 컴포넌트 | 완료 |
| useToast hook | — | useToastStore | 완료 |

### 4-5. 액세스 게이트(비로그인·비판매자 차단)

| 화면 | 원본 방식 | 현재 Next.js 방식 | 상태 |
|------|----------|------------------|------|
| /sell, /shop, /edit | PHAccessGate 컴포넌트 | middleware.ts 리다이렉트 | 완료(방식 차이) |
| /mypage, /reader, /apply | PHAccessGate 컴포넌트 | middleware.ts + 페이지 내 fallback | 완료 |

---

## 5. 라우팅 비교

| 원본 이동 동작 | 기대 경로 | 현재 경로 | 연결 여부 | 문제점 |
|--------------|----------|----------|----------|--------|
| go("home") | `/` | `/` | O | — |
| go("browse") | `/browse` | `/browse` | O | — |
| openPrompt(p) | `/detail/:id` | `/detail/:id` | O | — |
| go("sell") | `/sell` | `/sell` | O | — |
| go("shop") | `/shop` | `/shop` | O | — |
| openMyPage(tab) | `/mypage?tab=...` | `/mypage?tab=...` | O | — |
| openPurchased(p) | `/reader/:id` | `/reader/:id` | O | — |
| editPrompt(p) | `/edit/:id` | `/edit/:id` | O | — |
| go("apply") | `/apply` | `/apply` | O | — |
| purchase(p) → 결제 | (즉시 처리) | `/checkout?id=:id` | 구조 차이 | 원본은 모달 없이 즉시 purchase, 현재는 checkout 페이지 경유 |
| 로그인 후 판매자 → shop | go("shop") | /shop | O | — |
| 카테고리 클릭 홈 | `/browse?q=카테고리라벨` | `/browse?category=카테고리id` | 부분 | query 키 및 값 형식 다름 |
| 인기 검색어 클릭 | `/browse?q=...` | `/browse?q=...` | O | — |

---

## 6. API 연동 상태

| 화면·기능 | 원본 동작 방식 | 현재 API 호출 여부 | API 경로 | 상태 |
|----------|--------------|-----------------|---------|------|
| 홈 인기 목록 | 클라이언트 정렬 | O | `GET /api/v1/product?sort=popular&size=8` | 완료 |
| 탐색 목록 | 클라이언트 필터 | O | `GET /api/v1/product` | 완료 |
| 상세 조회 | 클라이언트 상태 | O | `GET /api/v1/product/:id` | 완료 |
| 관련 상품 | 클라이언트 필터 | O | `GET /api/v1/product/:id/related` | 완료 |
| 찜 토글 | 클라이언트 상태 | O | `POST/DELETE /api/v1/wishlists` | 완료 |
| 찜 존재 확인 | — | O | `GET /api/v1/wishlists/exists?productId=` | 완료 |
| 구매 | 클라이언트 상태 | O | `POST /api/v1/payments/confirm` | 완료 |
| 내 주문 목록 | 클라이언트 상태 | O | `GET /api/v1/orders` | 완료 |
| 프롬프트 등록 | 클라이언트 상태 | O | `POST /api/v1/product` | 완료 |
| 프롬프트 수정 | 클라이언트 상태 | O | `PUT /api/v1/product/:id` | 완료 |
| 프롬프트 중단 | 클라이언트 상태 | O | `DELETE /api/v1/product/:id` | 완료 |
| 내 상점 목록 | 클라이언트 상태 | O | `GET /api/v1/sellers/me/products` | 완료 |
| 내 상점 통계 | 하드코딩 | O | `GET /api/v1/sellers/me/stats` | 완료 |
| 정산 내역 | 없음 | O | `GET /api/v1/sellers/me/payments` | 완료(신규 기능) |
| 별점 | 클라이언트 상태 | O | `POST /api/v1/product/:id/rating` | 완료 |
| 알림 목록 | 하드코딩 3개 | O | `GET /api/v1/notifications` | 완료(향상) |
| 알림 읽음 처리 | — | O | `POST /api/v1/notifications/:id/read` | 완료(신규) |
| 사용자 정보 | 클라이언트 상태 | O | `GET /api/v1/users/me` | 완료 |
| 닉네임 수정 | 클라이언트 상태 | O | `PUT /api/v1/users/me` | 완료 |
| 이메일 수정 | 클라이언트 상태 | O | `PUT /api/v1/users/me` | 완료 |
| 비밀번호 변경 | 없음(원본 버튼만 있음) | O | `PUT /api/v1/auth/password` | 완료(향상) |
| 로그아웃 | 클라이언트 상태 | O | `POST /api/v1/auth/logout` | 완료 |
| 판매자 신청 | 클라이언트 상태 | O | `POST /api/v1/seller` | 완료 |
| 판매자 신청 상태 | — | O | `GET /api/v1/sellers/apply-status` | 완료(향상) |
| 찜 목록 | 클라이언트 상태 | O | `GET /api/v1/wishlists` | 완료 |
| 알림 설정 저장 | 없음(원본도 없음) | X | — | 미구현(원본 동일) |
| 회원 탈퇴 | 없음(원본도 없음) | X | — | 미구현(원본 동일) |
| 로그아웃(마이페이지 버튼) | 있음 | X | — | UI 연결 누락 |
| 프로필 사진 업로드 | image-slot | X | — | 미구현(고정 이미지) |

---

## 7. 구현 우선순위

| 순서 | 메뉴·기능 | 현재 상태 | 구현할 내용 | 예상 수정 파일 | 선행 작업 |
|------|----------|----------|-----------|--------------|---------|
| 1 | 마이페이지 로그아웃 버튼 | 연결 누락 | `useAuthStore.logout()` + `api.post('/api/v1/auth/logout')` 호출 연결 | `app/mypage/page.tsx` (line ~548~558) | 없음 |
| 2 | 마이페이지 회원 탈퇴 | 동작 미연결 | 확인 모달 추가 + 탈퇴 API 연동 | `app/mypage/page.tsx` | 탈퇴 API 명세 확인 |
| 3 | 내 상점 판매자 이름 | 하드코딩 | `api.get('/api/v1/users/me')` 응답으로 교체 | `app/shop/page.tsx` (line ~177) | 없음 |
| 4 | 상세 페이지 업데이트 알림 배너 | 미구현 | 구매 버전(boughtVer)과 최신 버전 비교 로직 + 배너 UI | `app/detail/[id]/page.tsx` | 주문 API의 boughtVer 필드 확인 |
| 5 | 리더 페이지 뒤로가기 | 미세 차이 | `/mypage?tab=purchased`로 변경 | `app/reader/[id]/page.tsx` (backLink) | 없음 |
| 6 | 홈 카테고리 클릭 | id vs label 불일치 | browse에서 category 파라미터가 id 기반임을 확인 후 API 스펙 정합성 검증 | `app/page.tsx` + `app/browse/page.tsx` | API 스펙 확인 |
| 7 | Footer 소셜 아이콘·링크 | 동작 확인 필요 | 실제 브라우저에서 확인 | `components/layout/Footer.tsx` | 없음 |
| 8 | 알림 설정 API 연동 | 로컬 상태만 | 설정 저장 API 있으면 연동, 없으면 plan.md에 추가 | `app/mypage/page.tsx` | api-spec.md 확인 |
| 9 | 프로필 아바타 업로드 | 고정 이미지 | ImageUpload 컴포넌트 재사용, 이미지 업로드 API 연동 | `app/mypage/page.tsx` | 이미지 업로드 API 명세 확인 |
| 10 | LoginModal 회원가입 탭 | 동작 확인 필요 | 실제 브라우저에서 확인 | `components/modals/LoginModal.tsx` | 없음 |

---

## 8. 이후 개별 구현 작업 목록

### TASK-01: 마이페이지 로그아웃 버튼 연결
- **파일**: `C:\beadv6_6_3JMT_FE\app\mypage\page.tsx` 약 548~558행
- **현상**: `onClick={() => {}}` 빈 함수
- **수정 내용**: Header와 동일하게 `await api.post('/api/v1/auth/logout')` 호출 후 `useAuthStore`의 `logout()` 실행, `router.push('/')`
- **우선순위**: 높음 (기본 UX 버그)

### TASK-02: 마이페이지 회원 탈퇴
- **파일**: `C:\beadv6_6_3JMT_FE\app\mypage\page.tsx` 약 806~815행
- **현상**: `onClick={() => {}}` 빈 함수
- **수정 내용**: 확인 모달 추가 → 탈퇴 API 호출(`DELETE /api/v1/users/me` 또는 유사 엔드포인트) → 로그아웃 처리 → 홈으로 이동
- **선행**: `docs/api-spec.md`에서 탈퇴 API 엔드포인트 확인 후 없으면 `plan.md`에 추가

### TASK-03: 내 상점 판매자 이름 동적화
- **파일**: `C:\beadv6_6_3JMT_FE\app\shop\page.tsx` 약 177행
- **현상**: `"프롬프트랩님의 판매 현황이에요"` 하드코딩
- **수정 내용**: useEffect 내 `api.get('/api/v1/users/me')` 호출 추가 또는 `useAuthStore`의 `user.name` 사용

### TASK-04: 상세 페이지 업데이트 알림 배너
- **파일**: `C:\beadv6_6_3JMT_FE\app\detail\[id]\page.tsx` 약 420~425행
- **현상**: 현재 "최신 버전 보유" 배너만 있음. 구매한 버전 < 최신 버전인 경우 업데이트 알림 배너 없음
- **수정 내용**: 주문 API 응답에 `boughtVer` 필드가 있는 경우 최신 버전과 비교, outdated 시 "새 버전 업데이트됐어요" 배너 + "최신 버전 다시 받기" 링크 추가
- **선행**: `GET /api/v1/orders` 응답 구조에서 `boughtVer` 필드 확인

### TASK-05: 리더 페이지 뒤로가기 개선
- **파일**: `C:\beadv6_6_3JMT_FE\app\reader\[id]\page.tsx` 약 386~399행
- **현상**: `router.push('/mypage')` → 구매한 프롬프트 탭이 선택되지 않음
- **수정 내용**: `router.push('/mypage?tab=purchased')`로 변경

### TASK-06: 홈 카테고리 → 탐색 연동 검증
- **파일**: `C:\beadv6_6_3JMT_FE\app\page.tsx` 약 373행
- **현상**: `CategorySection`의 `onPick={(id) => router.push('/browse?category=' + id)}`
- **수정 내용**: Browse 페이지에서 `category=id` 파라미터를 받아 API에 넘기는 방식 확인. 원본은 `q=label` 방식이었으나 현재는 id 기반이 더 정합성 높음. API에서 category 파라미터를 id로 받는지 확인

### TASK-07: 알림 설정 저장 API 연동 (또는 plan.md 추가)
- **파일**: `C:\beadv6_6_3JMT_FE\app\mypage\page.tsx` 약 793~803행
- **현상**: 알림 설정 토글 변경 시 로컬 상태만 업데이트, API 저장 없음
- **수정 내용**: `PATCH /api/v1/users/me/notifications` 등 API 엔드포인트 확인. 없으면 `plan.md`에 추가하고 `api-spec.md` 동기화

### TASK-08: 프로필 아바타 업로드
- **파일**: `C:\beadv6_6_3JMT_FE\app\mypage\page.tsx` 약 568~598행
- **현상**: `/images/promy-character.png` 고정 이미지 사용
- **수정 내용**: ImageUpload 컴포넌트 재사용 → S3 업로드 API → 프로필 사진 URL 저장 API 연동
- **선행**: 이미지 업로드 API 명세 확인

### TASK-09: 헤더 장바구니 "결제하기" 버튼 연결 확인
- **파일**: `C:\beadv6_6_3JMT_FE\components\layout\Header.tsx`
- **현상**: 장바구니 드롭다운의 "결제하기" 버튼이 `/checkout`으로 라우팅되는지 확인 필요
- **수정 내용**: 브라우저 확인 후 미연결 시 `router.push('/checkout')` 연결

### TASK-10: Footer 및 LoginModal 동작 확인
- **파일**: `C:\beadv6_6_3JMT_FE\components\layout\Footer.tsx`, `C:\beadv6_6_3JMT_FE\components\modals\LoginModal.tsx`
- **수정 내용**: 브라우저에서 실행 후 소셜 아이콘, 링크, 회원가입 탭 전환 동작 확인

---

## 9. 참고: 원본에만 있는 기능 (의도적 제외 가능)

| 기능 | 원본 위치 | Next.js 포함 여부 | 비고 |
|------|----------|-----------------|------|
| Tweaks 패널 (레이아웃/색상 런타임 조정) | app.js | X | 프로토타입 전용 도구, 프로덕션 제외 정상 |
| Hero 3가지 방향 전환 (split/search) | home-page.js | X | 프로덕션에서는 단일 방향으로 결정 가능 |
| 카트에서 즉시 purchase() 처리 | app.js | 구조 차이 | checkout 페이지 경유로 대체(향상) |
| versionsMap 클라이언트 상태 | app.js | X | 서버 API 버전 관리로 대체(향상) |
| 알림 하드코딩 3개 | shared-layout.js | API 대체 | API 연동으로 향상 |
| 데모용 이메일 인증번호 노출 힌트 | mypage.js | 제외됨 | 보안상 제외 정상 |
