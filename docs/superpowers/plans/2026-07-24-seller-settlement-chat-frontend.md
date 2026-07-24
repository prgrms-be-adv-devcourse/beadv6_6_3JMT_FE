# Seller Settlement Chat Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/shop`의 두 탭에서 항상 접근 가능한 셀러 정산 도우미를 만들고, 기존 AI REST·SSE API와 인증된 실시간 대화로 연결한다.

**Architecture:** `/shop` 전용 React UI는 `app/shop/_components/settlement-chat`에 두고, REST 계약과 인증 SSE 파서는 `lib`에 분리한다. Redis가 24시간 대화와 run을 관리하며, 프론트는 화면 상태만 순수 reducer와 route-local hook으로 관리한다.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Axios, Fetch `ReadableStream`, Tailwind CSS v4, Lucide React, `node:test`.

> **Execution note (2026-07-24):** 프론트는 주요 개발 범위가 아니며 속도를 우선한다는 사용자 결정에
> 따라 Trigger·Panel·Messages·Composer·hook을 `SettlementChat.tsx` 하나로 합쳤다. REST, SSE,
> 순수 상태와 테스트 경계는 계획대로 분리한다.

## Global Constraints

- 설계 기준 문서: `docs/superpowers/specs/2026-07-24-seller-settlement-chat-frontend-design.md`.
- 셀러 전용 `/shop`에서만 UI를 노출한다.
- `내 상품`과 `정산 내역` 탭 전환으로 챗봇을 언마운트하지 않는다.
- PC 패널 너비는 420px이고, 모바일 `max-width: 767px`에서는 전체 화면이다.
- 현재 범위는 월·주 정산 분석과 지급 상태 조회까지다.
- 주문 분석, CSV 다운로드, 어드민 UI, role 기반 응답, 로컬스토리지 대화 저장은 구현하지 않는다.
- 답변 중에는 새 질문과 추천 질문을 막는다.
- SSE 자동 재연결은 최초 실패 뒤 1회만 수행한다.
- REST는 기존 `lib/auth.ts` Axios 인스턴스를 사용한다.
- SSE는 Bearer 헤더가 필요한 `fetch` 스트림을 사용하고 native `EventSource`를 사용하지 않는다.
- 운영 프론트는 `X-User-Id`와 role을 직접 만들지 않는다. 로컬 direct routing 헤더는 기존 `directRoutingHeaders`만 재사용한다.
- 새 외부 의존성을 추가하지 않는다.
- 테스트는 SSE parser와 순수 상태 전이에 집중하고 React 테스트 프레임워크를 새로 도입하지 않는다.
- 테스트 명령은 `node --experimental-strip-types --test <파일>`을 사용한다.

---

## File Map

| Path | Responsibility |
|---|---|
| `lib/settlementChat.ts` | REST DTO, 대화 조회, 질문 등록 |
| `lib/settlementChatSse.ts` | SSE event union, block parser, authenticated stream |
| `lib/settlementChatSse.test.ts` | snapshot/progress/delta/done/heartbeat parser tests |
| `app/shop/_components/settlement-chat/types.ts` | UI-only message and phase types |
| `app/shop/_components/settlement-chat/settlementChatState.ts` | pure reducer and selectors |
| `app/shop/_components/settlement-chat/settlementChatState.test.ts` | restore, running, delta, terminal, duplicate-submit tests |
| `app/shop/_components/settlement-chat/useSettlementChat.ts` | restore, submit, stream, one reconnect orchestration |
| `app/shop/_components/settlement-chat/SettlementChatTrigger.tsx` | desktop tab-row and mobile floating trigger |
| `app/shop/_components/settlement-chat/SettlementChatMessages.tsx` | history, suggestions, progress, streamed answer, retry |
| `app/shop/_components/settlement-chat/SettlementChatComposer.tsx` | 2,000-character composer |
| `app/shop/_components/settlement-chat/SettlementChatPanel.tsx` | fixed responsive side panel |
| `app/shop/_components/settlement-chat/SettlementChat.tsx` | open state, focus, keyboard, child composition |
| `app/shop/page.tsx` | mount one chat instance at the right edge of the tab row |

---

### Task 1: REST contracts and API functions

**Files:**
- Create: `lib/settlementChat.ts`

**Interfaces:**
- Consumes: `api` from `@/lib/auth`, `API_BASE` from `@/lib/apiBase`.
- Produces:
  - `getCurrentSettlementConversation(): Promise<SettlementConversation | null>`
  - `createSettlementChatMessage(content: string): Promise<AcceptedSettlementRun>`
  - DTO types used by the state hook.

- [ ] **Step 1: Create the typed REST adapter**

Create `lib/settlementChat.ts` with these contracts and functions:

```ts
import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export type SettlementChatRole = 'USER' | 'ASSISTANT'
export type SettlementRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type SettlementRunStage = 'ANALYZING' | 'FETCHING_DATA' | 'GENERATING_ANSWER' | 'DONE'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string
}

export interface SettlementConversationMessage {
  messageId: string
  role: SettlementChatRole
  content: string
  createdAt: string
}

export interface SettlementLatestRun {
  runId: string
  question: string
  status: SettlementRunStatus
  stage: SettlementRunStage
  startedAt: string
  deadlineAt: string
}

export interface SettlementConversation {
  conversationId: string
  messages: SettlementConversationMessage[]
  latestRun: SettlementLatestRun | null
  activeRunId: string | null
  expiresAt: string
}

export interface AcceptedSettlementRun {
  conversationId: string
  runId: string
  status: 'RUNNING'
  startedAt: string
  deadlineAt: string
}

export async function getCurrentSettlementConversation(): Promise<SettlementConversation | null> {
  const response = await api.get<ApiEnvelope<SettlementConversation | null>>(
    `${API_BASE}/ai/settlement/conversations/current`,
  )
  return response.data.data
}

export async function createSettlementChatMessage(
  content: string,
): Promise<AcceptedSettlementRun> {
  const response = await api.post<ApiEnvelope<AcceptedSettlementRun>>(
    `${API_BASE}/ai/settlement/conversations/current/messages`,
    { content: content.trim() },
  )
  return response.data.data
}
```

- [ ] **Step 2: Run static checks**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 3: Commit the REST adapter**

```bash
git add lib/settlementChat.ts
git commit -m "feat: 셀러 정산 챗봇 API 계약 추가"
```

---

### Task 2: Authenticated SSE parser and stream

**Files:**
- Create: `lib/settlementChatSse.test.ts`
- Create: `lib/settlementChatSse.ts`

**Interfaces:**
- Consumes: access token and optional local direct-routing headers supplied by the hook.
- Produces:
  - `SettlementSseEvent` discriminated union.
  - `parseSettlementSseBlock(block: string): SettlementSseEvent | null`.
  - `streamSettlementRun(options): Promise<void>`.
  - `SettlementSseHttpError` with `status`.

- [ ] **Step 1: Write parser tests**

Create `lib/settlementChatSse.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { parseSettlementSseBlock } from './settlementChatSse.ts'

test('heartbeat comment is ignored', () => {
  assert.equal(parseSettlementSseBlock(':heartbeat'), null)
})

test('snapshot restores the current run stage', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:snapshot\ndata:{"runId":"run-1","status":"RUNNING","stage":"ANALYZING","startedAt":"2026-07-24T00:00:00Z","deadlineAt":"2026-07-24T00:01:30Z"}',
    ),
    {
      type: 'snapshot',
      runId: 'run-1',
      status: 'RUNNING',
      stage: 'ANALYZING',
      startedAt: '2026-07-24T00:00:00Z',
      deadlineAt: '2026-07-24T00:01:30Z',
    },
  )
})

test('progress event parses its stage', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:progress\ndata:{"runId":"run-1","stage":"FETCHING_DATA","occurredAt":"2026-07-24T00:00:00Z"}',
    ),
    {
      type: 'progress',
      runId: 'run-1',
      stage: 'FETCHING_DATA',
      occurredAt: '2026-07-24T00:00:00Z',
    },
  )
})

test('delta preserves text and sequence', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:delta\ndata:{"runId":"run-1","sequence":2,"text":"정산액은 "}',
    ),
    { type: 'delta', runId: 'run-1', sequence: 2, text: '정산액은 ' },
  )
})

test('done exposes the complete answer', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:done\ndata:{"runId":"run-1","answer":"최종 답변","completedAt":"2026-07-24T00:00:05Z"}',
    ),
    {
      type: 'done',
      runId: 'run-1',
      answer: '최종 답변',
      completedAt: '2026-07-24T00:00:05Z',
    },
  )
})

test('failed and cancelled terminal events preserve their payloads', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:failed\ndata:{"runId":"run-1","code":"OPENAI_TIMEOUT","message":"응답 시간이 초과됐어요.","failedAt":"2026-07-24T00:01:30Z"}',
    ),
    {
      type: 'failed',
      runId: 'run-1',
      code: 'OPENAI_TIMEOUT',
      message: '응답 시간이 초과됐어요.',
      failedAt: '2026-07-24T00:01:30Z',
    },
  )
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:cancelled\ndata:{"runId":"run-1","cancelledAt":"2026-07-24T00:00:10Z"}',
    ),
    {
      type: 'cancelled',
      runId: 'run-1',
      cancelledAt: '2026-07-24T00:00:10Z',
    },
  )
})
```

- [ ] **Step 2: Run the parser test and verify failure**

Run:

```bash
node --experimental-strip-types --test lib/settlementChatSse.test.ts
```

Expected: FAIL because `lib/settlementChatSse.ts` does not exist.

- [ ] **Step 3: Implement event types and parser**

Create `lib/settlementChatSse.ts`. Define the six server events with exact payload names:

```ts
import type { SettlementRunStage, SettlementRunStatus } from '@/lib/settlementChat'

export type SettlementSseEvent =
  | {
      type: 'snapshot'
      runId: string
      status: SettlementRunStatus
      stage: SettlementRunStage
      startedAt: string
      deadlineAt: string
    }
  | { type: 'progress'; runId: string; stage: SettlementRunStage; occurredAt: string }
  | { type: 'delta'; runId: string; sequence: number; text: string }
  | { type: 'done'; runId: string; answer: string; completedAt: string }
  | { type: 'failed'; runId: string; code: string; message: string; failedAt: string }
  | { type: 'cancelled'; runId: string; cancelledAt: string }

export class SettlementSseHttpError extends Error {
  constructor(public readonly status: number) {
    super(`Settlement SSE request failed with ${status}`)
  }
}

export function parseSettlementSseBlock(block: string): SettlementSseEvent | null {
  const lines = block.split(/\r?\n/)
  if (lines.every((line) => line === '' || line.startsWith(':'))) return null

  let eventName = ''
  const dataLines: string[] = []
  for (const line of lines) {
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  if (!eventName || dataLines.length === 0) return null

  return {
    type: eventName,
    ...JSON.parse(dataLines.join('\n')),
  } as SettlementSseEvent
}
```

- [ ] **Step 4: Implement the fetch stream**

Append this streaming API to the same file:

```ts
interface StreamSettlementRunOptions {
  runId: string
  token: string
  signal: AbortSignal
  headers?: Record<string, string>
  onEvent: (event: SettlementSseEvent) => void
}

export async function streamSettlementRun({
  runId,
  token,
  signal,
  headers = {},
  onEvent,
}: StreamSettlementRunOptions): Promise<void> {
  const response = await fetch(`/api/v2/ai/settlement/runs/${runId}/events`, {
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    signal,
  })

  if (!response.ok) throw new SettlementSseHttpError(response.status)
  if (!response.body) throw new Error('SSE response body is missing')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const event = parseSettlementSseBlock(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      if (event) onEvent(event)
      boundary = buffer.indexOf('\n\n')
    }

    if (done) break
  }

  if (buffer.trim()) {
    const event = parseSettlementSseBlock(buffer)
    if (event) onEvent(event)
  }
}
```

- [ ] **Step 5: Run parser tests and static checks**

Run:

```bash
node --experimental-strip-types --test lib/settlementChatSse.test.ts
npx tsc --noEmit
```

Expected: all six tests pass and TypeScript exits `0`.

- [ ] **Step 6: Commit the SSE client**

```bash
git add lib/settlementChatSse.ts lib/settlementChatSse.test.ts
git commit -m "feat: 정산 챗봇 SSE 스트림 처리 추가"
```

---

### Task 3: Pure chat state and reducer tests

**Files:**
- Create: `app/shop/_components/settlement-chat/types.ts`
- Create: `app/shop/_components/settlement-chat/settlementChatState.test.ts`
- Create: `app/shop/_components/settlement-chat/settlementChatState.ts`

**Interfaces:**
- Consumes: REST message/run types and `SettlementSseEvent`.
- Produces:
  - `SettlementChatState`.
  - `initialSettlementChatState`.
  - `settlementChatReducer(state, action)`.
  - `canSubmitSettlementQuestion(state)`.

- [ ] **Step 1: Define UI types**

Create `types.ts`:

```ts
import type { SettlementRunStage } from '@/lib/settlementChat'

export type SettlementChatPhase = 'idle' | 'loading' | 'ready' | 'running' | 'disabled'

export interface SettlementUiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface SettlementChatState {
  phase: SettlementChatPhase
  historyLoaded: boolean
  messages: SettlementUiMessage[]
  activeRunId: string | null
  stage: SettlementRunStage | null
  streamedAnswer: string
  error: string | null
  reconnectAvailable: boolean
}
```

- [ ] **Step 2: Write reducer tests**

Create `settlementChatState.test.ts` with tests for:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canSubmitSettlementQuestion,
  initialSettlementChatState,
  settlementChatReducer,
} from './settlementChatState.ts'

test('accepted question enters running state and prevents another submit', () => {
  const state = settlementChatReducer(initialSettlementChatState, {
    type: 'questionAccepted',
    runId: 'run-1',
    question: '이번 달 정산 요약',
    startedAt: '2026-07-24T00:00:00Z',
  })
  assert.equal(state.phase, 'running')
  assert.equal(state.messages.at(-1)?.content, '이번 달 정산 요약')
  assert.equal(canSubmitSettlementQuestion(state), false)
})

test('restored active run keeps history and prevents another submit', () => {
  const state = settlementChatReducer(initialSettlementChatState, {
    type: 'restored',
    conversation: {
      conversationId: 'conversation-1',
      messages: [
        {
          messageId: 'message-1',
          role: 'ASSISTANT',
          content: '이전 답변',
          createdAt: '2026-07-23T23:00:00Z',
        },
      ],
      latestRun: {
        runId: 'run-1',
        question: '진행 중인 질문',
        status: 'RUNNING',
        stage: 'ANALYZING',
        startedAt: '2026-07-24T00:00:00Z',
        deadlineAt: '2026-07-24T00:01:30Z',
      },
      activeRunId: 'run-1',
      expiresAt: '2026-07-25T00:00:00Z',
    },
  })

  assert.equal(state.phase, 'running')
  assert.equal(state.activeRunId, 'run-1')
  assert.equal(state.messages.at(-1)?.content, '진행 중인 질문')
  assert.equal(canSubmitSettlementQuestion(state), false)
})

test('progress then delta then done produces one final assistant message', () => {
  let state = settlementChatReducer(initialSettlementChatState, {
    type: 'questionAccepted',
    runId: 'run-1',
    question: '요약해줘',
    startedAt: '2026-07-24T00:00:00Z',
  })
  state = settlementChatReducer(state, { type: 'progress', stage: 'FETCHING_DATA' })
  state = settlementChatReducer(state, { type: 'delta', text: '일부 ' })
  state = settlementChatReducer(state, { type: 'delta', text: '답변' })
  state = settlementChatReducer(state, {
    type: 'done',
    answer: '최종 답변',
    completedAt: '2026-07-24T00:00:05Z',
  })

  assert.equal(state.phase, 'ready')
  assert.equal(state.streamedAnswer, '')
  assert.equal(state.messages.at(-1)?.content, '최종 답변')
  assert.equal(canSubmitSettlementQuestion(state), true)
})

test('connection loss keeps the active run for manual reconnect', () => {
  const running = settlementChatReducer(initialSettlementChatState, {
    type: 'questionAccepted',
    runId: 'run-1',
    question: '요약해줘',
    startedAt: '2026-07-24T00:00:00Z',
  })
  const lost = settlementChatReducer(running, { type: 'connectionLost' })
  assert.equal(lost.activeRunId, 'run-1')
  assert.equal(lost.reconnectAvailable, true)
  assert.equal(canSubmitSettlementQuestion(lost), false)
})
```

- [ ] **Step 3: Run reducer tests and verify failure**

Run:

```bash
node --experimental-strip-types --test app/shop/_components/settlement-chat/settlementChatState.test.ts
```

Expected: FAIL because `settlementChatState.ts` does not exist.

- [ ] **Step 4: Implement the reducer**

Create `settlementChatState.ts` with explicit actions for `loading`, `restored`, `questionAccepted`, `snapshot`, `progress`, `delta`, `done`, `failed`, `cancelled`, `disabled`, and `connectionLost`. The terminal actions must clear `activeRunId`, `stage`, and `streamedAnswer`; `connectionLost` must retain `activeRunId`.

Use these exported signatures:

```ts
import type {
  SettlementConversation,
  SettlementRunStage,
} from '@/lib/settlementChat'
import type { SettlementChatState, SettlementUiMessage } from './types'

export type SettlementChatAction =
  | { type: 'loading' }
  | { type: 'restored'; conversation: SettlementConversation | null }
  | { type: 'questionAccepted'; runId: string; question: string; startedAt: string }
  | { type: 'snapshot'; stage: SettlementRunStage }
  | { type: 'progress'; stage: SettlementRunStage }
  | { type: 'delta'; text: string }
  | { type: 'done'; answer: string; completedAt: string }
  | { type: 'failed'; message: string }
  | { type: 'cancelled' }
  | { type: 'disabled'; message: string }
  | { type: 'connectionLost' }
  | { type: 'clearError' }

export const initialSettlementChatState: SettlementChatState = {
  phase: 'idle',
  historyLoaded: false,
  messages: [],
  activeRunId: null,
  stage: null,
  streamedAnswer: '',
  error: null,
  reconnectAvailable: false,
}

function terminalAssistantMessage(content: string, createdAt = new Date().toISOString()): SettlementUiMessage {
  return { id: crypto.randomUUID(), role: 'assistant', content, createdAt }
}

export function canSubmitSettlementQuestion(state: SettlementChatState): boolean {
  return state.phase === 'ready' && state.activeRunId === null
}

export function settlementChatReducer(
  state: SettlementChatState,
  action: SettlementChatAction,
): SettlementChatState {
  switch (action.type) {
    case 'loading':
      return { ...state, phase: 'loading', error: null }
    case 'restored': {
      const conversation = action.conversation
      const messages: SettlementUiMessage[] = (conversation?.messages ?? []).map((message) => ({
        id: message.messageId,
        role: message.role === 'USER' ? 'user' : 'assistant',
        content: message.content,
        createdAt: message.createdAt,
      }))
      if (
        conversation?.activeRunId &&
        conversation.latestRun?.status === 'RUNNING' &&
        !messages.some(
          (message) =>
            message.role === 'user' && message.content === conversation.latestRun?.question,
        )
      ) {
        messages.push({
          id: `active-${conversation.activeRunId}`,
          role: 'user',
          content: conversation.latestRun.question,
          createdAt: conversation.latestRun.startedAt,
        })
      }
      return {
        ...state,
        phase: conversation?.activeRunId ? 'running' : 'ready',
        historyLoaded: true,
        messages,
        activeRunId: conversation?.activeRunId ?? null,
        stage: conversation?.latestRun?.stage ?? null,
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }
    }
    case 'questionAccepted':
      return {
        ...state,
        phase: 'running',
        messages: [
          ...state.messages,
          {
            id: `question-${action.runId}`,
            role: 'user',
            content: action.question,
            createdAt: action.startedAt,
          },
        ],
        activeRunId: action.runId,
        stage: 'ANALYZING',
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }
    case 'snapshot':
    case 'progress':
      return { ...state, phase: 'running', stage: action.stage, error: null }
    case 'delta':
      return { ...state, streamedAnswer: state.streamedAnswer + action.text }
    case 'done':
      return {
        ...state,
        phase: 'ready',
        messages: [...state.messages, terminalAssistantMessage(action.answer, action.completedAt)],
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }
    case 'failed':
      return {
        ...state,
        phase: 'ready',
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: action.message,
        reconnectAvailable: false,
      }
    case 'cancelled':
      return {
        ...state,
        phase: 'ready',
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: '답변 생성이 취소됐어요.',
        reconnectAvailable: false,
      }
    case 'disabled':
      return { ...state, phase: 'disabled', error: action.message }
    case 'connectionLost':
      return {
        ...state,
        error: '연결이 끊겼어요. 다시 시도해 주세요.',
        reconnectAvailable: true,
      }
    case 'clearError':
      return { ...state, error: null }
  }
}
```

- [ ] **Step 5: Run reducer and parser tests**

Run:

```bash
node --experimental-strip-types --test \
  lib/settlementChatSse.test.ts \
  app/shop/_components/settlement-chat/settlementChatState.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit the state model**

```bash
git add app/shop/_components/settlement-chat/types.ts \
  app/shop/_components/settlement-chat/settlementChatState.ts \
  app/shop/_components/settlement-chat/settlementChatState.test.ts
git commit -m "feat: 정산 챗봇 화면 상태 모델 추가"
```

---

### Task 4: Conversation orchestration hook

**Files:**
- Create: `app/shop/_components/settlement-chat/useSettlementChat.ts`

**Interfaces:**
- Consumes: Task 1 REST functions, Task 2 stream function, Task 3 reducer, `useAuthStore`, `directRoutingHeaders`.
- Produces:
  - `state`
  - `load()`
  - `submit(question)`
  - `retryConnection()`
  - `canSubmit`
  - `dispose()` through React effect cleanup.

- [ ] **Step 1: Implement the hook**

Implement `useSettlementChat` with one persistent `AbortController` ref. `load()` must run once, restore the conversation, and call `connect(activeRunId, 0)` when present. `submit()` must trim and reject empty or over-2,000-character input before the API call.

Use this event mapping inside `connect`:

```ts
const terminal = { received: false }

await streamSettlementRun({
  runId,
  token,
  signal: controller.signal,
  headers: directRoutingHeaders(
    `/api/v2/ai/settlement/runs/${runId}/events`,
    user,
  ) ?? undefined,
  onEvent: (event) => {
    if (event.type === 'snapshot') dispatch({ type: 'snapshot', stage: event.stage })
    if (event.type === 'progress') dispatch({ type: 'progress', stage: event.stage })
    if (event.type === 'delta') dispatch({ type: 'delta', text: event.text })
    if (event.type === 'done') {
      terminal.received = true
      dispatch({ type: 'done', answer: event.answer, completedAt: event.completedAt })
    }
    if (event.type === 'failed') {
      terminal.received = true
      dispatch({ type: 'failed', message: event.message })
    }
    if (event.type === 'cancelled') {
      terminal.received = true
      dispatch({ type: 'cancelled' })
    }
  },
})
```

After a non-terminal disconnect, call `connect(runId, 1)` only when `attempt === 0`. On the second disconnect, dispatch `connectionLost`.

When `SettlementSseHttpError.status === 401` on the first attempt, call `getCurrentSettlementConversation()` through Axios first so the existing response interceptor refreshes the token, then read the updated token from `useAuthStore.getState()` and reconnect once.

Map Axios errors as follows:

```ts
function messageForStatus(status?: number): string {
  if (status === 400) return '질문 내용을 확인해 주세요.'
  if (status === 403) return '셀러만 정산 도우미를 사용할 수 있어요.'
  if (status === 429) return '현재 요청이 많아요. 잠시 후 다시 시도해 주세요.'
  if (status === 503) return '정산 도우미를 준비하고 있어요.'
  return '정산 도우미에 연결하지 못했어요.'
}
```

For a `409`, call `getCurrentSettlementConversation()`, dispatch `restored`, and reconnect to its `activeRunId`. For `503`, dispatch `disabled`; for other terminal REST failures, dispatch `failed`.

- [ ] **Step 2: Run static checks**

Run:

```bash
npx tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 3: Commit the hook**

```bash
git add app/shop/_components/settlement-chat/useSettlementChat.ts
git commit -m "feat: 정산 챗봇 대화 실행 흐름 연결"
```

---

### Task 5: Responsive chatbot UI

**Files:**
- Create: `app/shop/_components/settlement-chat/SettlementChatTrigger.tsx`
- Create: `app/shop/_components/settlement-chat/SettlementChatMessages.tsx`
- Create: `app/shop/_components/settlement-chat/SettlementChatComposer.tsx`
- Create: `app/shop/_components/settlement-chat/SettlementChatPanel.tsx`
- Create: `app/shop/_components/settlement-chat/SettlementChat.tsx`

**Interfaces:**
- Consumes: `useSettlementChat` and PromptHub `--ph-*` Tailwind tokens.
- Produces: one `<SettlementChat />` component mounted by `/shop`.

- [ ] **Step 1: Create the trigger**

`SettlementChatTrigger` must expose `buttonRef`, `open`, and `onToggle`. Use `Sparkles` and these responsive rules:

```tsx
className={[
  'ml-auto inline-flex h-[38px] items-center justify-center gap-2 rounded-ph-md',
  'border border-ph-border bg-ph-surface px-3.5 text-ph-body-sm font-semibold text-ph-primary',
  'transition-colors hover:border-ph-primary hover:bg-ph-secondary',
  'max-[767px]:fixed max-[767px]:right-4 max-[767px]:bottom-4 max-[767px]:z-70',
  'max-[767px]:h-[52px] max-[767px]:w-[52px] max-[767px]:rounded-ph-full max-[767px]:p-0',
].join(' ')}
```

Hide the text label at `max-[767px]` and set `aria-expanded`, `aria-controls="settlement-chat-panel"`, and a state-specific `aria-label`.

- [ ] **Step 2: Create messages and suggestions**

`SettlementChatMessages` must render:

```ts
export const SETTLEMENT_CHAT_SUGGESTIONS = [
  '이번 달 정산 요약해줘',
  '지난달과 이번 달 정산을 비교해줘',
  '이번 달 정산을 주간별로 분석해줘',
  '이번 달 정산 지급 상태를 알려줘',
] as const

export const SETTLEMENT_STAGE_LABEL = {
  ANALYZING: '질문을 분석하고 있어요',
  FETCHING_DATA: '정산 데이터를 확인하고 있어요',
  GENERATING_ANSWER: '답변을 정리하고 있어요',
  DONE: '답변을 완료했어요',
} as const
```

Messages use `whitespace-pre-wrap break-keep` and render `content` as React text. Do not use `dangerouslySetInnerHTML`. Show suggestions only when history is empty and no run is active. Disable suggestions when `canSubmit` is false. Show the spinner/status row during `running`, the partial assistant bubble when `streamedAnswer` is non-empty, and a `다시 연결` button when `reconnectAvailable` is true.

- [ ] **Step 3: Create the composer**

`SettlementChatComposer` owns only the draft string. It must:

- submit through `onSubmit(draft)`;
- trim before submit;
- block empty or over-2,000-character content;
- clear only after `onSubmit` resolves successfully;
- disable input and button while loading, running, or disabled;
- show `답변을 생성하는 동안에는 새 질문을 보낼 수 없어요.` while running;
- use a `Send` icon and an accessible label.

- [ ] **Step 4: Create the panel**

`SettlementChatPanel` must use a fixed drawer:

```tsx
className={[
  'fixed top-[66px] right-0 z-80 flex h-[calc(100vh-66px)] w-[min(420px,100vw)]',
  'flex-col border-l border-ph-border bg-ph-surface text-ph-text',
  'transition-transform duration-200 motion-reduce:transition-none',
  'max-[767px]:top-0 max-[767px]:h-dvh max-[767px]:w-screen max-[767px]:border-l-0',
  open ? 'visible translate-x-0' : 'invisible translate-x-full',
].join(' ')}
```

The header uses `Sparkles`, title `정산 도우미`, subtitle `내 상점 · 정산 데이터`, and an `X` close button. The message container has `aria-live="polite"`. The composer stays below the scrollable message area.

- [ ] **Step 5: Create the root component**

`SettlementChat` must:

- hold `open` state;
- call `load()` on the first transition to open;
- focus the composer after opening;
- close on `Escape`;
- return focus to the trigger after close;
- never abort the hook stream merely because `open` becomes false;
- render the trigger and panel as one stable instance.

Use `useRef<HTMLButtonElement>` for the trigger, and pass a focusable input ref through the panel and composer.

- [ ] **Step 6: Run lint and type checks**

Run:

```bash
npm run lint
npx tsc --noEmit
```

Expected: both commands exit `0`.

- [ ] **Step 7: Commit the UI**

```bash
git add app/shop/_components/settlement-chat
git commit -m "feat: 셀러 정산 도우미 패널 UI 추가"
```

---

### Task 6: Mount the chatbot in both shop tabs

**Files:**
- Modify: `app/shop/page.tsx`

**Interfaces:**
- Consumes: `<SettlementChat />` from Task 5.
- Produces: a single stable chat instance in the shared tab row.

- [ ] **Step 1: Import and mount the component**

Add:

```tsx
import SettlementChat from '@/app/shop/_components/settlement-chat/SettlementChat'
```

Keep the current tab buttons and mount `<SettlementChat />` as the last child of the shared tab-row container:

```tsx
<div
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    borderBottom: '1px solid var(--ph-border)',
    marginTop: 36,
  }}
>
  {tabButtons}
  <SettlementChat />
</div>
```

Do not place it inside either `activeTab === 'listings'` or `activeTab === 'settlements'` branch.

- [ ] **Step 2: Run all focused tests**

Run:

```bash
node --experimental-strip-types --test \
  lib/settlementChatSse.test.ts \
  app/shop/_components/settlement-chat/settlementChatState.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run repository checks**

Run:

```bash
npm run lint
npm run build
```

Expected: lint and production build exit `0`.

- [ ] **Step 4: Commit shop integration**

```bash
git add app/shop/page.tsx
git commit -m "feat: 내 상점에 AI 정산 도우미 연결"
```

---

### Task 7: Manual browser verification and documentation check

**Files:**
- Verify: `docs/superpowers/specs/2026-07-24-seller-settlement-chat-frontend-design.md`
- Verify: all files from Tasks 1–6.

**Interfaces:**
- Consumes: a running frontend with a seller session and reachable AI API.
- Produces: evidence that desktop/mobile, restore, stream, and errors behave as designed.

- [ ] **Step 1: Start the frontend**

Run:

```bash
npm run dev
```

Expected: Next.js reports a local URL without compilation errors.

- [ ] **Step 2: Verify desktop behavior**

At a desktop viewport:

1. Open `/shop` as a seller.
2. Confirm `AI 정산 도우미` is visible next to the shared tab row.
3. Open the panel and confirm its width is 420px.
4. Switch both tabs and confirm the panel and messages remain.
5. Submit `이번 달 정산 요약해줘`.
6. Confirm input and suggestions are disabled until terminal event.
7. Confirm progress copy changes and the final answer preserves line breaks.
8. Close during a run, reopen, and confirm the run continued.

- [ ] **Step 3: Verify refresh recovery**

1. Start a question.
2. Refresh `/shop`.
3. Open the chatbot.
4. Confirm the current conversation is restored.
5. If the run is active, confirm it reconnects with `activeRunId`.
6. Confirm `done.answer` becomes the final assistant message.

- [ ] **Step 4: Verify mobile behavior**

At `390 × 844`:

1. Confirm only the circular floating trigger is visible.
2. Open it and confirm the panel fills the viewport.
3. Confirm the close button, message scroll, composer, and virtual keyboard layout remain usable.
4. Press Escape with a hardware keyboard and confirm focus returns to the trigger.

- [ ] **Step 5: Verify failure states**

Verify one controlled response for each of:

- `409`: existing run is restored rather than duplicating the question.
- `429`: busy message appears and input is re-enabled.
- `503 AI_CHAT_DISABLED`: preparation message appears and input stays disabled.
- two consecutive SSE disconnects: one automatic reconnect followed by the manual `다시 연결` button.

- [ ] **Step 6: Review the diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended chatbot and documentation files are listed.
