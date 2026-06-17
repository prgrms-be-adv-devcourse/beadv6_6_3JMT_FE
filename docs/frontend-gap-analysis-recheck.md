# PromptHub Frontend Gap Analysis — 재검증
작성일: 2026-06-18
기준 문서: `docs/frontend-gap-analysis.md` (2026-06-17)

---

## 1. 이전 분석 대비 변경 결과

| 메뉴·기능 | 이전 상태 | 현재 상태 | 해결된 내용 | 아직 남은 내용 |
|-----------|-----------|-----------|------------|--------------|
| 마이페이지 — 로그아웃 버튼 | 연결 누락 | 해결 완료 | `handleLogout`: `api.post('/api/v1/auth/logout')` + `logout()` + `router.push('/')` 구현 | — |
| 마이페이지 — 회원 탈퇴 | 동작 미연결 | 해결 완료 | `handleWithdraw`: `api.delete('/api/v1/users/me')` + ConfirmDialog 모달 완전 구현 | — |
| 마이페이지 — 환불 신청 모달 | 인라인 JSX | 해결 완료 | `ConfirmDialog` 컴포넌트로 교체 (이번 세션) | — |
| 내 상점 — 판매자 이름 하드코딩 | 하드코딩 "프롬프트랩" | 해결 완료 | `user?.name ?? '판매자'`로 동적화 | — |
| 리더 페이지 — 뒤로가기 | `/mypage` (탭 없음) | 해결 완료 | `/mypage?tab=purchased`로 변경 | — |
| LoginModal — 회원가입 탭 | 동작 확인 필요 | 해결 완료 | `mode` 상태로 login/signup 전환 완전 구현, API 연동 완료 | — |
| 헤더 장바구니 — 결제하기 | 동작 확인 필요 | 해결 완료 | `router.push('/checkout')` 연결 확인 | — |
| 상세 페이지 — 업데이트 알림 배너 | 미구현 | 미해결 | — | boughtVer vs latestVer 비교 로직 없음. 항상 "최신 버전 보유" 표시 |
| 홈 카테고리 클릭 — id vs label | 구조 차이 | 대부분 해결 | id 기반(CategorySection → `/browse?category={id}`)이 API와 정합성 맞음 | `window.location.href` 2곳 잔존 (SearchBar, onSearch) |
| 마이페이지 — 알림 설정 | 로컬 상태만 | 미해결 | — | api-spec.md에 알림 설정 저장 API 없음. 로컬 상태 토글만 동작 |
| 마이페이지 — 프로필 아바타 | 고정 이미지 | 미해결 | — | `/images/promy-character.png` 고정 사용. 업로드 API 없음 |
| Footer — 소셜 아이콘·링크 | 동작 확인 필요 | 실행 확인 필요 | 소셜 아이콘 컴포넌트 존재 | 모든 링크 `href="#"` placeholder. 실제 URL 없음 |
| 공통 UI — Button/Card/Tag/Label | 각 파일 인라인 | 해결 완료 | `components/ui/` 7개 파일로 추출: Label, Button, Card, Tag + ConfirmDialog (modals) | — |
| 공통 — ICON_MAP | 각 파일 인라인 | 해결 완료 | `lib/iconMap.ts` 14개 아이콘 통합 | — |

---

## 2. 해결 완료 항목

```
- TASK-01 마이페이지 로그아웃 버튼: 해결 완료 (handleLogout 구현)
- TASK-02 마이페이지 회원 탈퇴: 해결 완료 (handleWithdraw + ConfirmDialog)
- TASK-03 내 상점 판매자 이름 동적화: 해결 완료 (user?.name)
- TASK-05 리더 페이지 뒤로가기: 해결 완료 (/mypage?tab=purchased)
- TASK-09 헤더 장바구니 결제하기 버튼: 해결 완료 (router.push('/checkout'))
- TASK-10 LoginModal 회원가입 탭: 해결 완료 (mode 상태 전환 + API 연동)
- P1-1 ICON_MAP 추출: 해결 완료 (lib/iconMap.ts, 14개 아이콘)
- P1-2 Label 추출: 해결 완료 (components/ui/Label.tsx, 3개 파일 교체)
- P1-3 Button 추출: 해결 완료 (components/ui/Button.tsx, 7개 파일 교체 + disabled hover 버그 수정)
- P1-4 Card 추출: 해결 완료 (components/ui/Card.tsx, 7개 파일 교체)
- P1-5 Tag 추출: 해결 완료 (components/ui/Tag.tsx, 4개 파일 교체)
- P1-6 ConfirmDialog 추출: 해결 완료 (components/modals/ConfirmDialog.tsx, 3개 인스턴스 교체)
- 마이페이지 환불 신청 모달: 해결 완료 (ConfirmDialog로 교체)
```

---

## 3. 현재 남아 있는 미구현·미완성 항목

| 우선순위 | 메뉴·기능 | 현재 문제 | 예상 수정 파일 | 선행 작업 |
|----------|-----------|-----------|--------------|----------|
| 1 | 홈 `window.location.href` → `router.push` | `app/page.tsx` line 216, 332에서 `window.location.href` 사용 → 전체 페이지 리로드 발생. Next.js SPA 방식에 어긋남 | `app/page.tsx` | 없음 |
| 2 | 상세 페이지 — 업데이트 알림 배너 (TASK-04) | 구매 버전(boughtVer) 추적 로직 없음. `GET /api/v1/orders` 응답에 `purchasedVersion` 필드 없음 | `app/detail/[id]/page.tsx`, `mocks/handlers/orders.ts` | 주문 API boughtVer 필드 확인 및 api-spec 명세 추가 |
| 3 | 마이페이지 — 알림 설정 저장 (TASK-07) | 토글이 로컬 상태(`notif`)만 변경, API 호출 없음. api-spec.md에 알림 설정 저장 엔드포인트 없음 | `app/mypage/page.tsx`, `docs/api-spec.md`, `plan.md` | 알림 설정 API 명세 추가 |
| 4 | 마이페이지 — 프로필 아바타 업로드 (TASK-08) | `/images/promy-character.png` 고정 이미지 사용. 이미지 업로드 API 없음 | `app/mypage/page.tsx` | 이미지 업로드 API 명세 확인 |
| 5 | Footer — 소셜 아이콘·링크 실제 URL | 모든 `<a>` 링크가 `href="#"` + `preventDefault()`. 운영 시 실제 URL 필요 | `components/layout/Footer.tsx` | 운영 URL 확정 |
| 6 | 상세 페이지 — 판매자 카드 하드코딩 | `"검증된 크리에이터 · 프롬프트 24개"` 하드코딩. 판매자 API 응답에서 받아야 함 | `app/detail/[id]/page.tsx` | 판매자 정보 API 필드 확인 |
| 7 | 어드민 대시보드 (Phase 9 미착수) | plan.md Phase 9 미착수. `/admin` 라우트는 생성됐으나 내용 미확인 | `app/admin/**` | Phase 1-8 완료 후 진행 |

---

## 4. 새로 발견된 문제

### 신규 문제 1 — `window.location.href` 사용 (우선순위: 중)
**파일**: `app/page.tsx` — 2곳
```
line 216: onAction={() => { window.location.href = '/browse'; }}
line 332: window.location.href = `/browse?q=${encodeURIComponent(q)}`;
```
**문제**: Next.js SPA에서 `window.location.href`를 사용하면 클라이언트 사이드 라우팅이 아닌 전체 페이지 리로드 발생. 브라우저 히스토리 관리 및 상태 유지에 불리함.
**수정 방향**: `router.push('/browse')`, `router.push('/browse?q=...')` 로 교체.

### 신규 문제 2 — 상세 페이지 판매자 정보 하드코딩 (우선순위: 낮음)
**파일**: `app/detail/[id]/page.tsx` line ~318
```
"검증된 크리에이터 · 프롬프트 24개"
```
**문제**: 판매자 등록 프롬프트 수 `24개`가 하드코딩. API에 해당 필드가 있는지 확인 필요.

### 신규 문제 3 — ConfirmDialog 아이콘 크기 정규화 (우선순위: 낮음)
**파일**: `components/modals/ConfirmDialog.tsx`
회원 탈퇴 원본은 아이콘 컨테이너 52×52, 아이콘 26×26이었으나 통합 컴포넌트는 44×44/22×22로 정규화됨. 시각적 미세 차이. (의도적 결정 — `iconSize` prop 없음)

---

## 5. 메뉴별 최신 상태

| 메뉴 | 현재 라우트 | 이전 상태 | 최신 상태 | 남은 작업 |
|------|-----------|-----------|-----------|----------|
| 홈 | `/` | 일부 구현 | 대부분 해결 | `window.location.href` 2곳 → `router.push` 교체 |
| 탐색 | `/browse` | 완료 | 완료 | — |
| 상세 | `/detail/[id]` | 완료 | 대부분 해결 | 업데이트 알림 배너 미구현, 판매자 프롬프트 수 하드코딩 |
| 판매 등록 | `/sell` | 완료 | 완료 | — |
| 내 상점 | `/shop` | 완료 | 완료 | — |
| 마이페이지 | `/mypage` | 일부 구현 | 대부분 해결 | 알림 설정 API 미연동, 아바타 업로드 미구현 |
| 리더 | `/reader/[id]` | 완료 | 완료 | — |
| 편집 | `/edit/[id]` | 완료 | 완료 | — |
| 판매자 신청 | `/apply` | 완료 | 완료 | — |
| 결제 | `/checkout` | 완료(신규) | 완료 | — |
| 어드민 | `/admin/**` | 미확인 | 미확인 | Phase 9 착수 필요 |
| 헤더 | (공통) | 완료 | 완료 | — |
| 푸터 | (공통) | 동작 확인 필요 | 실행 확인 필요 | 소셜·링크 href="#" placeholder |
| LoginModal | (공통) | 동작 확인 필요 | 완료 | — |

---

## 6. API 관련 재검증

| 화면·기능 | 이전 API 상태 | 현재 API 상태 | 명세 일치 여부 | 남은 조치 |
|-----------|--------------|--------------|--------------|----------|
| 로그아웃 (마이페이지 버튼) | UI 연결 누락 | `POST /api/v1/auth/logout` 연결 완료 | ✅ 일치 | 조치 없음 |
| 회원 탈퇴 | 미구현 | `DELETE /api/v1/users/me` 연결 완료 | ✅ 일치 (api-spec.md 404행) | 조치 없음 |
| 찜 토글 | 완료 | 완료 | ✅ 일치 | 조치 없음 |
| 알림 설정 저장 | 미구현 | 미구현 | ❌ 명세 없음 | API 명세 확인 필요 → api-spec.md 및 plan.md 추가 |
| 상세 구매 버전(boughtVer) | 미구현 | 미구현 | ❌ orders 응답에 버전 필드 없음 | API 명세 확인 필요 → `GET /api/v1/orders` 응답 스펙 보완 필요 |
| 프로필 아바타 업로드 | 미구현 | 미구현 | ❌ 이미지 업로드 API 없음 | API 명세 확인 필요 |
| 판매자 프롬프트 수 | 하드코딩 | 하드코딩 | ❌ API 필드 불명 | API 명세 확인 필요 (판매자 상세 응답 스펙) |
| 어드민 전체 | 미확인 | 미확인 | 미확인 | API 명세 확인 필요 |

---

## 7. 다음 개별 구현 작업

### TASK-R1: 홈 `window.location.href` → `router.push` 교체
- **작업명**: 홈 페이지 라우팅 방식 정규화
- **대상 메뉴**: 홈 (`/`)
- **원본 참고 파일**: 해당 없음 (Next.js 내부 이슈)
- **수정 예상 파일**: `app/page.tsx` (line 216, 332)
- **새로 만들 예상 파일**: 없음
- **구현할 UI**: 변경 없음
- **구현할 동작**:
  - line 216: `onAction={() => { window.location.href = '/browse'; }}` → `onAction={() => router.push('/browse')}`
  - line 332: `window.location.href = '/browse?q=...'` → `router.push('/browse?q=...')`
- **API 연동 여부**: 없음
- **선행 작업**: 없음
- **완료 조건**: `window.location.href` 사용 0건 (tsc + grep 확인)
- **다른 기능에 미칠 영향**: 낮음. 검색 후 탐색 페이지 전환 시 페이지 리로드 없이 SPA 방식으로 동작

---

### TASK-R2: 상세 페이지 — 업데이트 알림 배너 (TASK-04 승계)
- **작업명**: 구매 버전 vs 최신 버전 비교 배너 구현
- **대상 메뉴**: 상세 (`/detail/[id]`)
- **원본 참고 파일**: `origin/prompthub_clean/product-components.js` (DetailScreen, versionBanner 로직)
- **수정 예상 파일**: `app/detail/[id]/page.tsx`, `mocks/handlers/orders.ts`
- **새로 만들 예상 파일**: 없음
- **구현할 UI**: 구매한 버전 < 최신 버전인 경우 "새 버전 업데이트됐어요 (v{boughtVer} → v{latestVer})" 배너 표시
- **구현할 동작**: `GET /api/v1/orders` 응답에서 현재 상품의 구매 버전(`purchasedVersion`) 필드 추출 → `latest.ver`와 비교 → outdated이면 경고 배너, 최신이면 완료 배너
- **API 연동 여부**: 있음 (`GET /api/v1/orders` 응답 스펙 보완 필요)
- **선행 작업**: `docs/api-spec.md`에서 orders 응답 스펙에 `purchasedVersion` 필드 추가 확인 / mocks 보완
- **완료 조건**: 구매한 프롬프트 상세 진입 시 버전 상태가 정확히 표시됨
- **다른 기능에 미칠 영향**: orders 응답 스펙 변경 시 reader 페이지의 주문 조회도 영향 받을 수 있음

---

### TASK-R3: 알림 설정 저장 API 연동 또는 명세 추가 (TASK-07 승계)
- **작업명**: 마이페이지 알림 설정 저장
- **대상 메뉴**: 마이페이지 설정 탭
- **원본 참고 파일**: 원본에도 없음 (신규 기능)
- **수정 예상 파일**: `app/mypage/page.tsx`, `docs/api-spec.md`, `plan.md`, `mocks/handlers/users.ts`
- **새로 만들 예상 파일**: 없음
- **구현할 UI**: 설정 탭 알림 섹션 아래 "저장" 버튼 또는 토글 변경 즉시 저장
- **구현할 동작**: 알림 토글 변경 시 `PATCH /api/v1/users/me/notifications` (또는 `PUT /api/v1/users/me`) 호출
- **API 연동 여부**: 있음 (api-spec.md 명세 추가 필요)
- **선행 작업**: api-spec.md에 알림 설정 엔드포인트 명세 추가, plan.md에 Phase 추가
- **완료 조건**: 알림 설정 변경 → 페이지 새로고침 후에도 상태 유지
- **다른 기능에 미칠 영향**: 낮음

---

### TASK-R4: 프로필 아바타 업로드 (TASK-08 승계)
- **작업명**: 마이페이지 프로필 사진 업로드
- **대상 메뉴**: 마이페이지 프로필 탭
- **원본 참고 파일**: `origin/prompthub_clean/mypage.js` (ProfileTab, image-slot)
- **수정 예상 파일**: `app/mypage/page.tsx`
- **새로 만들 예상 파일**: 없음 (ImageUpload 컴포넌트 재사용)
- **구현할 UI**: 아바타 영역에 ImageUpload 컴포넌트 삽입, 업로드 후 미리보기
- **구현할 동작**: 이미지 선택 → S3 업로드 API → `PUT /api/v1/users/me { profileImageUrl }` 저장
- **API 연동 여부**: 있음 (이미지 업로드 API 명세 확인 필요)
- **선행 작업**: 이미지 업로드 엔드포인트 api-spec.md 확인 / next.config.ts S3 도메인 등록 여부 확인
- **완료 조건**: 프로필 사진 업로드 후 헤더 등에서 바뀐 이미지 표시
- **다른 기능에 미칠 영향**: 낮음

---

### TASK-R5: Footer 실제 URL 교체
- **작업명**: Footer 소셜 아이콘·링크 placeholder 제거
- **대상 메뉴**: 공통 Footer
- **원본 참고 파일**: `origin/prompthub_clean/shared-layout.js` (Footer)
- **수정 예상 파일**: `components/layout/Footer.tsx`
- **새로 만들 예상 파일**: 없음
- **구현할 UI**: 변경 없음
- **구현할 동작**: `href="#"` + `preventDefault()` → 실제 서비스 URL 또는 `href="https://..."` 교체
- **API 연동 여부**: 없음
- **선행 작업**: 운영 SNS URL 및 서비스 링크 확정
- **완료 조건**: 소셜 아이콘 클릭 시 새 탭으로 해당 URL 열림
- **다른 기능에 미칠 영향**: 없음 (정적 링크)

---

### TASK-R6: 어드민 대시보드 (plan.md Phase 9)
- **작업명**: 어드민 대시보드 UI 이식 및 API 연동
- **대상 메뉴**: `/admin`, `/admin/users`, `/admin/products`, `/admin/sellers`, `/admin/orders`, `/admin/payments`
- **원본 참고 파일**: `PromptHub admin dashboard.html` (별도 파일)
- **수정 예상 파일**: `app/admin/**/*.tsx` (기존 라우트 내용 구현)
- **새로 만들 예상 파일**: 관련 MSW 핸들러 보완
- **구현할 UI**: KPI 카드, 차트, 유저/상품/판매자/주문/정산 목록 테이블
- **구현할 동작**: 승인/거절, 환불 처리, 목록 필터 등 어드민 액션
- **API 연동 여부**: 있음 (어드민 전용 API 명세 필요)
- **선행 작업**: plan.md Phase 1~8 완료 확인, 어드민 API spec 확인
- **완료 조건**: 어드민 로그인 후 모든 탭에서 데이터 표시 및 액션 동작
- **다른 기능에 미칠 영향**: 어드민 전용 분리 영역, 일반 서비스에 영향 없음

---

## 8. 컴포넌트 추출 진행 현황 (P1 목록)

`docs/component-duplication-analysis.md` P1 목록 기준:

| 번호 | 컴포넌트 | 상태 | 추출 파일 | 적용 파일 수 |
|------|---------|------|----------|------------|
| P1-1 | ICON_MAP | ✅ 완료 | `lib/iconMap.ts` | 5개 |
| P1-2 | Label | ✅ 완료 | `components/ui/Label.tsx` | 3개 |
| P1-3 | Button | ✅ 완료 | `components/ui/Button.tsx` | 7개 + disabled hover 버그 수정 |
| P1-4 | Card | ✅ 완료 | `components/ui/Card.tsx` | 7개 |
| P1-5 | Tag | ✅ 완료 | `components/ui/Tag.tsx` | 4개 |
| P1-6 | ConfirmDialog | ✅ 완료 | `components/modals/ConfirmDialog.tsx` | 3개 인스턴스 |
| P1-7 이후 | (미분석) | — | — | — |

P2 목록(CATEGORIES 배열 등)은 별도 판단 필요.

---

## 9. 현재 프로젝트 상태 요약

| 영역 | 상태 | 비고 |
|------|------|------|
| 핵심 9개 페이지 | 대부분 완료 | 상세·홈·마이페이지 일부 미완 |
| 공통 컴포넌트 추출 (P1) | 완료 | 6개 컴포넌트 추출 |
| API 연동 | 대부분 완료 | 알림설정·아바타·boughtVer 미연동 |
| MSW Mock | 완료 | 실 백엔드 전환 준비됨 |
| 어드민 | 미착수 | plan.md Phase 9 예정 |
| TypeScript 오류 | 0건 | `npx tsc --noEmit` 통과 |
