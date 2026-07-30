# Frontend Notification API Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore Header notifications by matching the Notification Service v1 REST and SSE contracts without changing delete or settings features.

**Architecture:** Keep the existing authenticated Axios client for REST calls, but give notifications a dedicated `/api/v1/notifications` request contract. Use a small fetch-based SSE client because the stream requires an `Authorization` header, and keep Header state in a pure reducer so list data and the server-wide unread count remain independent and testable.

**Tech Stack:** Next.js 16 App Router, React 19 Client Components, TypeScript 5, Axios, Node test runner, ESLint

## Global Constraints

- Preserve all unrelated changes already present on the latest `origin/main`.
- Do not add notification delete or settings UI.
- Do not send `X-User-Id` from production browser code; the Gateway owns that header.
- Use backend DTO names verbatim and use `PATCH` for read operations.
- Keep the first page at 20 rows while storing the unread count returned by the dedicated count endpoint.
- Follow RED → GREEN → REFACTOR for each behavior change and never commit a failing test state.

---

## Task 1: Lock the v1 REST request contract

**Files:**

- Create: `types/api/notifications.ts`
- Create: `lib/notificationContracts.test.ts`
- Create: `lib/notificationContracts.ts`

- [ ] **Step 1: Write failing REST request-contract tests**

Add tests that independently assert:

- a default list request uses `GET /api/v1/notifications?page=1&size=20`;
- page values below 1 become 1;
- size values below 1 become 1 and above 100 become 100;
- a supplied category is preserved;
- single and all read requests use `PATCH` and the v1 paths.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --experimental-strip-types --test lib/notificationContracts.test.ts
```

Expected: FAIL because `notificationContracts.ts` does not exist.

- [ ] **Step 3: Add backend-aligned notification types and minimal request builders**

Define list item, page metadata, unread-count, read response, and SSE payload types. Implement request builders consumed directly by the REST and SSE adapters.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
node --experimental-strip-types --test lib/notificationContracts.test.ts
```

Expected: PASS.

## Task 2: Add the authenticated notification REST adapter

**Files:**

- Create: `lib/notifications.ts`
- Modify: `lib/notificationContracts.test.ts`

- [ ] **Step 1: Extend the test with response normalization**

Add fixtures using the complete backend page and `ApiResult` shapes. Assert that list data defaults to an empty array and unread count is read from `data.unreadCount`.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --experimental-strip-types --test lib/notificationContracts.test.ts
```

Expected: FAIL because response normalizers are not implemented.

- [ ] **Step 3: Implement normalizers and REST functions**

Use the existing authenticated Axios instance and the tested request descriptors for:

- list;
- unread count;
- single read;
- all read.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
node --experimental-strip-types --test lib/notificationContracts.test.ts
```

Expected: PASS.

## Task 3: Add a resilient authenticated SSE client

**Files:**

- Create: `lib/notificationSse.test.ts`
- Create: `lib/notificationSse.ts`

- [ ] **Step 1: Write failing parser and stream-boundary tests**

Cover:

- heartbeat comments are ignored;
- `notification` events preserve the backend payload and event ID;
- `sync-required` events are parsed;
- invalid JSON and unknown events are ignored;
- the stream request sends `Accept`, Bearer authorization, and `Last-Event-ID`;
- a parsed notification advances the ID used by the next connection.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --experimental-strip-types --test lib/notificationSse.test.ts
```

Expected: FAIL because `notificationSse.ts` does not exist.

- [ ] **Step 3: Implement parsing, one-connection consumption, and reconnect**

Use `fetch`, `ReadableStream`, `TextDecoder`, and `AbortSignal`. Retry transient network/server failures with an abortable delay, retain the last event ID, and stop retrying after abort or non-retryable client/auth failures.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
node --experimental-strip-types --test lib/notificationSse.test.ts
```

Expected: PASS.

## Task 4: Make Header notification state deterministic

**Files:**

- Create: `lib/notificationState.test.ts`
- Create: `lib/notificationState.ts`

- [ ] **Step 1: Write failing reducer tests**

Assert that:

- hydration keeps the backend unread count even when the visible list is shorter;
- a notification event changes the unread count without synthesizing an incomplete list item;
- reading one unread item decrements once and updates `readAt`;
- reading all items marks the visible page read and sets the count to zero;
- reset clears both values.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --experimental-strip-types --test lib/notificationState.test.ts
```

Expected: FAIL because `notificationState.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure reducer**

Keep list rows and the server-wide unread count as separate fields in one reducer state. Do not derive the count from the 20 visible rows.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
node --experimental-strip-types --test lib/notificationState.test.ts
```

Expected: PASS.

## Task 5: Integrate v1 REST and SSE into Header

**Files:**

- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Replace the temporary notification DTO and silent v2 request**

Use `NotificationItem`, the reducer, and the new REST adapter. On login, fetch list and unread count in parallel. On logout, abort the stream and reset state.

- [ ] **Step 2: Connect SSE lifecycle**

Start the stream only when both user and token exist. On `notification`, apply the backend unread count and refresh only the full list DTO. On `sync-required`, refresh list and unread count.

- [ ] **Step 3: Match read behavior and render backend fields**

Optimistically mark one/all as read, call the tested `PATCH` endpoints, restore and refetch on failure, and display a failure toast. Render `notificationId`, title, content, and `occurredAt`/`createdAt`; navigate to `linkUrl` after an item click.

- [ ] **Step 4: Add the in-scope “mark all read” action**

Show it only when the backend unread count is positive. Do not add delete or settings controls.

- [ ] **Step 5: Run focused notification tests**

Run:

```bash
node --experimental-strip-types --test lib/notificationContracts.test.ts lib/notificationSse.test.ts lib/notificationState.test.ts
```

Expected: PASS.

## Task 6: Verify the outage fix and review the diff

**Files:**

- Review all files changed by Tasks 1–5

- [ ] **Step 1: Run all repository unit tests**

Run:

```bash
node --experimental-strip-types --test lib/*.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Check formatting, scope, and secrets**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff
```

Confirm the diff contains only the approved notification outage scope and documentation, and contains no credentials or environment files.

- [ ] **Step 5: Commit only green, scoped changes**

Use small commits that comply with the repository convention, and do not push or create a pull request unless requested.
