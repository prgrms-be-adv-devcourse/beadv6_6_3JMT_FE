import assert from 'node:assert/strict'
import test from 'node:test'

import { parseSettlementSseBlock } from './settlementChatSse.ts'

test('heartbeat comment is ignored', () => {
  assert.equal(parseSettlementSseBlock(':heartbeat'), null)
})

test('snapshot and progress events preserve the run stage', () => {
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
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:progress\ndata:{"runId":"run-1","stage":"FETCHING_DATA","occurredAt":"2026-07-24T00:00:01Z"}',
    ),
    {
      type: 'progress',
      runId: 'run-1',
      stage: 'FETCHING_DATA',
      occurredAt: '2026-07-24T00:00:01Z',
    },
  )
})

test('delta and done events preserve streamed and final answers', () => {
  assert.deepEqual(
    parseSettlementSseBlock(
      'event:delta\ndata:{"runId":"run-1","sequence":2,"text":"정산액은 "}',
    ),
    {
      type: 'delta',
      runId: 'run-1',
      sequence: 2,
      text: '정산액은 ',
    },
  )
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

test('failed and cancelled events preserve terminal payloads', () => {
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
