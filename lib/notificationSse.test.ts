import assert from 'node:assert/strict'
import test from 'node:test'
import { parseNotificationSseBlock } from './notificationSse.ts'

test('parseNotificationSseBlock ignores heartbeat comments and empty lines', () => {
  assert.equal(parseNotificationSseBlock(': heartbeat\n\n'), null)
  assert.equal(parseNotificationSseBlock('\n\n'), null)
})

test('parseNotificationSseBlock parses notification event correctly', () => {
  const block = [
    'event: notification',
    'id: 72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa',
    'data: {"notificationId":"72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa","type":"ORDER_PAID","title":"주문 결제가 완료되었습니다.","content":"면접 준비 프롬프트 주문 결제가 완료되었습니다.","unreadCount":3}',
  ].join('\n')

  const parsed = parseNotificationSseBlock(block)
  assert.notEqual(parsed, null)
  assert.equal(parsed?.type, 'notification')
  if (parsed?.type === 'notification') {
    assert.equal(parsed.id, '72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa')
    assert.equal(parsed.data.notificationId, '72d95cb0-1835-49bf-8f08-2e0f1c4e4aaa')
    assert.equal(parsed.data.type, 'ORDER_PAID')
    assert.equal(parsed.data.unreadCount, 3)
  }
})

test('parseNotificationSseBlock parses sync-required event correctly', () => {
  const block = [
    'event: sync-required',
    'data: {"code":"REPLAY_LIMIT_EXCEEDED","replayLimit":100}',
  ].join('\n')

  const parsed = parseNotificationSseBlock(block)
  assert.notEqual(parsed, null)
  assert.equal(parsed?.type, 'sync-required')
  if (parsed?.type === 'sync-required') {
    assert.equal(parsed.data.code, 'REPLAY_LIMIT_EXCEEDED')
    assert.equal(parsed.data.replayLimit, 100)
  }
})
