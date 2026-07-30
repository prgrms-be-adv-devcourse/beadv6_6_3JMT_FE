# 탈퇴 계정 재가입 프론트엔드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 카카오 OAuth 로그인에서 정상·신규·재가입 필요·이용 제한 상태를 안전하게 분리하고, 사용자가 명시적으로 확인한 경우에만 탈퇴 계정을 다시 활성화한다.

**Architecture:** 로그인 응답 계약과 오류 판정은 `lib/oauth.ts` 및 순수 계약 모듈에 두고, 일회성 토큰은 전용 `rejoinSession` 모듈을 통해 `sessionStorage`에만 저장한다. OAuth 콜백은 분기와 세션 저장만 담당하고, `/auth/rejoin` 클라이언트 페이지가 확인·취소·만료·재시도 UI를 관리한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Axios, Zustand, Node test runner

## Global Constraints

- `loginStatus`가 없는 기존 응답은 전환 기간 동안 `COMPLETED`로 취급한다.
- 재가입 토큰 원문은 URL, 로그, 분석 이벤트, `localStorage`에 넣지 않는다.
- 서비스 Access Token과 Refresh Token은 `COMPLETED` 응답에서만 기존 `useAuthStore.login`으로 저장한다.
- 재가입 API는 사용자가 확인 버튼을 누른 경우에만 호출한다.
- 성공, 취소, 만료, `A014` 처리 시 임시 재가입 정보를 즉시 삭제한다.
- Next.js API는 설치된 `node_modules/next/dist/docs`의 App Router 문서를 따른다.

---

### Task 1: 로그인·재가입 계약과 임시 세션

**Files:**

- Create: `lib/rejoinSession.ts`
- Create: `lib/rejoinContracts.ts`
- Test: `lib/rejoinSession.test.ts`
- Test: `lib/rejoinContracts.test.ts`
- Modify: `lib/oauth.ts`

**Interfaces:**

- Produces: `normalizeOAuthLoginResult`, `getOAuthLoginDestination`, `getAuthErrorCode`
- Produces: `rejoinSession.save`, `rejoinSession.read`, `rejoinSession.clear`
- Produces: `rejoin(payload): Promise<CompletedLogin>`

- [ ] **Step 1: Write failing tests for legacy normalization, status routing, error codes, storage isolation, expiry, and clearing**
- [ ] **Step 2: Run `node --test lib/rejoinContracts.test.ts lib/rejoinSession.test.ts` and confirm missing modules fail**
- [ ] **Step 3: Implement the minimal discriminated union, pure helpers, and storage adapter**
- [ ] **Step 4: Run the focused tests and confirm they pass**
- [ ] **Step 5: Extend `lib/oauth.ts` with normalized Kakao login and rejoin API calls**

### Task 2: OAuth 콜백 분기

**Files:**

- Modify: `app/auth/kakao/callback/page.tsx`
- Create: `app/onboarding/page.tsx`
- Create: `app/auth/forbidden/page.tsx`

**Interfaces:**

- Consumes: `OAuthLoginResult`, `getOAuthLoginDestination`, `rejoinSession`
- Produces: callback navigation to `/onboarding`, `/`, `/auth/rejoin`, or `/auth/forbidden`

- [ ] **Step 1: Route `REJOIN_REQUIRED` without reading or saving service tokens**
- [ ] **Step 2: Route completed new users to `/onboarding` and existing users to `/`**
- [ ] **Step 3: Route `A004` failures to `/auth/forbidden`**
- [ ] **Step 4: Add minimal valid destination pages for onboarding and forbidden states**

### Task 3: 재가입 확인 화면

**Files:**

- Create: `app/auth/rejoin/page.tsx`

**Interfaces:**

- Consumes: `rejoinSession`, `rejoin`, `useAuthStore.login`, `useToast`
- Produces: default, submitting, expired, and retryable-error UI states

- [ ] **Step 1: Read and validate the current-tab token on mount**
- [ ] **Step 2: Render the confirmed copy, retained-data list, confirm, and cancel controls**
- [ ] **Step 3: Guard submission with a synchronous ref and disable both buttons while pending**
- [ ] **Step 4: On success save service tokens, clear temporary data, toast, and replace to `/`**
- [ ] **Step 5: On `A014` clear the token and show the expired state**
- [ ] **Step 6: On network or temporary failure retain a still-valid token and show retry controls**
- [ ] **Step 7: Add heading focus, `aria-live`, semantic buttons, and visible disabled state**

### Task 4: Verification

**Files:**

- Verify all changed production and test files

**Interfaces:**

- Consumes: all prior tasks
- Produces: a buildable, lint-clean, behavior-tested feature

- [ ] **Step 1: Run focused Node tests**
- [ ] **Step 2: Run all `lib/*.test.ts` tests**
- [ ] **Step 3: Run `npm run lint`**
- [ ] **Step 4: Run `npm run build`**
- [ ] **Step 5: Review the diff for token leakage and unrelated changes**
