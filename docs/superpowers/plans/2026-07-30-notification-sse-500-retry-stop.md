# Notification SSE HTTP 500 Retry Stop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HTTP `500 Internal Server Error`가 발생한 알림 SSE 실행을 즉시 종료하여 동일한 `stream` 요청이 반복되지 않게 한다.

**Architecture:** 기존 `streamNotifications` 반복 구조는 유지하고, 내부 HTTP 재시도 판정을 명시적인 상태 코드 허용 목록으로 교체한다. 공개 인터페이스와 Header 호출 방식은 바꾸지 않으며, 주입 가능한 `fetcher`를 사용하는 단위 테스트로 `500` 종료와 일시 장애 재시도를 함께 고정한다.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Node.js test runner, ESLint

**Design:** `docs/superpowers/specs/2026-07-30-notification-sse-500-retry-policy-design.md`

## Global Constraints

- HTTP `500 Internal Server Error`는 즉시 종료한다.
- HTTP `408`, `429`, `502`, `503`, `504`만 재시도 가능한 HTTP 상태로 유지한다.
- HTTP 응답이 없는 네트워크·스트림 오류는 기존처럼 재시도한다.
- 명시적인 `AbortSignal` 취소는 즉시 정상 종료한다.
- SSE 요청 URL, `Authorization`, `Last-Event-ID`, 이벤트 파서, 기본 재연결 대기 시간은 변경하지 않는다.
- Header 알림 상태와 사용자 인터페이스는 변경하지 않는다.
- Notification Service, API Gateway 및 Vercel 설정은 변경하지 않는다.
- 새 라이브러리나 런타임 의존성을 추가하지 않는다.

---

### Task 1: 알림 SSE HTTP 재시도 상태 분류

**Files:**
- Modify: `lib/notificationSse.test.ts:132-175`
- Modify: `lib/notificationSse.ts:171-174`

**Interfaces:**
- Consumes: `streamNotifications(options: NotificationStreamOptions): Promise<void>`, `NotificationStreamHttpError`, `NotificationFetch`
- Produces: 내부 상수 `RETRYABLE_STREAM_HTTP_STATUSES: ReadonlySet<number>`와 변경된 `shouldRetryStream(error: unknown): boolean`
- Public API: 기존 export와 함수 signature를 그대로 유지한다.

- [ ] **Step 1: HTTP 500 종료 테스트를 추가하고 일시 장애 테스트를 명시적인 상태 목록으로 확장한다**

`lib/notificationSse.test.ts`에서 기존 `stream retries a transient server failure`
테스트를 다음 코드로 교체한다. `500` 테스트의 두 번째 `401` 응답은 현재 구현이
예상과 달리 재시도하더라도 테스트가 무한 반복되지 않고 실패하도록 하는
안전장치다.

```ts
test('stream does not retry an internal server error', async () => {
  let calls = 0
  const fetcher: NotificationFetch = async () => {
    calls += 1
    return new Response('', { status: calls === 1 ? 500 : 401 })
  }

  await assert.rejects(
    streamNotifications({
      token: 'access-token',
      signal: new AbortController().signal,
      reconnectDelayMs: 0,
      onEvent: () => {},
      fetcher,
    }),
    (error: unknown) => (
      error instanceof NotificationStreamHttpError
      && error.status === 500
    ),
  )
  assert.equal(calls, 1)
})

for (const status of [408, 429, 502, 503, 504]) {
  test(`stream retries transient HTTP ${status}`, async () => {
    const controller = new AbortController()
    let calls = 0
    const fetcher: NotificationFetch = async () => {
      calls += 1
      if (calls === 1) return new Response('', { status })

      controller.abort()
      return new Response('')
    }

    await streamNotifications({
      token: 'access-token',
      signal: controller.signal,
      reconnectDelayMs: 0,
      onEvent: () => {},
      fetcher,
    })

    assert.equal(calls, 2)
  })
}
```

- [ ] **Step 2: 새 테스트가 현재 구현에서 실패하는지 확인한다**

Run:

```bash
node --test \
  --test-name-pattern "stream does not retry an internal server error|stream retries transient HTTP" \
  lib/notificationSse.test.ts
```

Expected:

- `stream does not retry an internal server error`는 첫 `500` 뒤 두 번째 요청까지
  실행되어 상태 `401` 오류를 반환하므로 FAIL한다.
- `408`, `429`, `502`, `503`, `504` 재시도 테스트는 PASS한다.
- 테스트 프로세스는 무한 대기하지 않고 non-zero exit code로 종료한다.

- [ ] **Step 3: 재시도 가능한 HTTP 상태를 명시적인 집합으로 제한한다**

`lib/notificationSse.ts`의 기존 `shouldRetryStream` 바로 위에 상수를 추가하고
함수를 다음과 같이 교체한다.

```ts
const RETRYABLE_STREAM_HTTP_STATUSES: ReadonlySet<number> = new Set([
  408,
  429,
  502,
  503,
  504,
])

function shouldRetryStream(error: unknown) {
  if (!(error instanceof NotificationStreamHttpError)) return true
  return RETRYABLE_STREAM_HTTP_STATUSES.has(error.status)
}
```

`streamNotifications`, `consumeNotificationStreamOnce`, `waitForReconnect`와 Header
호출부는 수정하지 않는다.

- [ ] **Step 4: HTTP 상태 분류 테스트가 모두 통과하는지 확인한다**

Run:

```bash
node --test \
  --test-name-pattern "stream does not retry an internal server error|stream retries transient HTTP" \
  lib/notificationSse.test.ts
```

Expected: HTTP `500` 테스트는 fetch 호출 횟수 `1`로 PASS하고, 다섯 개의 일시
장애 테스트는 호출 횟수 `2`로 PASS한다.

- [ ] **Step 5: 알림 SSE 단위 테스트 전체를 실행한다**

Run:

```bash
node --test lib/notificationSse.test.ts
```

Expected: 총 13개 테스트가 PASS하고 실패가 없다. 기존 SSE 파서,
`Last-Event-ID`, 인증 오류, abort 및 재연결 동작이 유지된다.

- [ ] **Step 6: 프론트 단위 테스트 전체를 실행한다**

Run:

```bash
node --test lib/*.test.ts
```

Expected: 프로세스가 exit code `0`으로 종료되고 실패한 테스트가 없다.

- [ ] **Step 7: 변경 파일의 정적 분석과 전체 lint를 실행한다**

Run:

```bash
npx eslint lib/notificationSse.ts lib/notificationSse.test.ts
npm run lint
```

Expected: 두 명령 모두 exit code `0`으로 종료되고 ESLint 오류가 없다.

- [ ] **Step 8: 최종 변경 범위와 공백 오류를 검토한다**

Run:

```bash
git diff --check
git diff -- lib/notificationSse.ts lib/notificationSse.test.ts
git status --short
```

Expected:

- `git diff --check`가 출력 없이 exit code `0`으로 종료한다.
- 애플리케이션 변경은 `lib/notificationSse.ts`,
  `lib/notificationSse.test.ts` 두 파일에만 존재한다.
- 백엔드, Gateway, Vercel 설정 또는 Header 변경이 없다.

- [ ] **Step 9: 구현과 테스트를 하나의 버그 수정 커밋으로 만든다**

```bash
git add lib/notificationSse.ts lib/notificationSse.test.ts
git commit -m "fix: frontend 알림 SSE 500 재연결 중단"
```

Expected: 테스트와 구현 두 파일만 포함하는 커밋이 생성된다.
