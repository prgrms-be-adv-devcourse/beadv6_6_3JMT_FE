import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canSubmitSettlementQuestion,
  initialSettlementChatState,
  settlementChatReducer,
} from './settlementChatState.ts'

test('restored active run keeps history and prevents another question', () => {
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

test('accepted question enters running state and prevents duplicate submit', () => {
  const ready = settlementChatReducer(initialSettlementChatState, {
    type: 'restored',
    conversation: null,
  })
  const submitting = settlementChatReducer(ready, { type: 'submitting' })
  const running = settlementChatReducer(submitting, {
    type: 'questionAccepted',
    runId: 'run-1',
    question: '이번 달 정산 요약',
    startedAt: '2026-07-24T00:00:00Z',
  })

  assert.equal(canSubmitSettlementQuestion(submitting), false)
  assert.equal(running.phase, 'running')
  assert.equal(running.messages.at(-1)?.content, '이번 달 정산 요약')
  assert.equal(canSubmitSettlementQuestion(running), false)
})

test('progress then delta then done creates one final assistant message', () => {
  let state = settlementChatReducer(initialSettlementChatState, {
    type: 'questionAccepted',
    runId: 'run-1',
    question: '요약해줘',
    startedAt: '2026-07-24T00:00:00Z',
  })
  state = settlementChatReducer(state, {
    type: 'progress',
    stage: 'FETCHING_DATA',
  })
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
