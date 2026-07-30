import test from 'node:test'
import assert from 'node:assert/strict'

import {
  consumeNotificationStreamOnce,
  NotificationStreamHttpError,
  parseNotificationSseBlock,
  streamNotifications,
  type NotificationFetch,
} from './notificationSse.ts'

test('SSE parser ignores heartbeat comments', () => {
  assert.equal(parseNotificationSseBlock(': heartbeat\n\n'), null)
})

test('SSE parser returns a complete notification event and id', () => {
  assert.deepEqual(
    parseNotificationSseBlock([
      'id: 50669363-31ef-4bd4-a2df-341aaf4308ec',
      'event: notification',
      'data: {"notificationId":"50669363-31ef-4bd4-a2df-341aaf4308ec","type":"ORDER_PAID","title":"결제가 완료되었어요","content":"구매한 상품을 확인해보세요.","unreadCount":3}',
      '',
    ].join('\n')),
    {
      type: 'notification',
      id: '50669363-31ef-4bd4-a2df-341aaf4308ec',
      data: {
        notificationId: '50669363-31ef-4bd4-a2df-341aaf4308ec',
        type: 'ORDER_PAID',
        title: '결제가 완료되었어요',
        content: '구매한 상품을 확인해보세요.',
        unreadCount: 3,
      },
    },
  )
})

test('SSE parser returns a sync-required event', () => {
  assert.deepEqual(
    parseNotificationSseBlock([
      'event: sync-required',
      'data: {"code":"REPLAY_LIMIT_EXCEEDED","replayLimit":100}',
      '',
    ].join('\n')),
    {
      type: 'sync-required',
      data: {
        code: 'REPLAY_LIMIT_EXCEEDED',
        replayLimit: 100,
      },
    },
  )
})

test('SSE parser ignores invalid JSON, invalid payloads, and unknown events', () => {
  assert.equal(
    parseNotificationSseBlock('event: notification\nid: event-1\ndata: {broken}\n'),
    null,
  )
  assert.equal(
    parseNotificationSseBlock('event: notification\nid: event-1\ndata: {"unreadCount":1}\n'),
    null,
  )
  assert.equal(
    parseNotificationSseBlock('event: other\ndata: {"value":1}\n'),
    null,
  )
})

test('one SSE connection sends the authenticated backend stream headers', async () => {
  let requestedUrl: string | undefined
  let requestedHeaders: Headers | undefined
  const fetcher: NotificationFetch = async (url, init) => {
    requestedUrl = url
    requestedHeaders = new Headers(init.headers)
    return new Response('')
  }

  await consumeNotificationStreamOnce({
    token: 'access-token',
    lastEventId: 'previous-event-id',
    signal: new AbortController().signal,
    onEvent: () => {},
    fetcher,
  })

  assert.equal(requestedUrl, '/api/v1/notifications/stream')
  assert.equal(requestedHeaders?.get('Accept'), 'text/event-stream')
  assert.equal(requestedHeaders?.get('Authorization'), 'Bearer access-token')
  assert.equal(requestedHeaders?.get('Last-Event-ID'), 'previous-event-id')
  assert.equal(requestedHeaders?.get('X-User-Id'), null)
})

test('reconnect sends the last parsed notification id', async () => {
  const controller = new AbortController()
  const seenLastEventIds: Array<string | null> = []
  const receivedIds: string[] = []
  let calls = 0

  const fetcher: NotificationFetch = async (_url, init) => {
    calls += 1
    seenLastEventIds.push(new Headers(init.headers).get('Last-Event-ID'))

    if (calls === 1) {
      return new Response([
        'id: live-event-id',
        'event: notification',
        'data: {"notificationId":"live-event-id","type":"ORDER_CREATED","title":"주문이 생성되었어요","content":"결제를 진행해주세요.","unreadCount":1}',
        '',
        '',
      ].join('\n'))
    }

    controller.abort()
    return new Response('')
  }

  await streamNotifications({
    token: 'access-token',
    signal: controller.signal,
    reconnectDelayMs: 0,
    onEvent: (event) => {
      if (event.type === 'notification') receivedIds.push(event.id)
    },
    fetcher,
  })

  assert.deepEqual(receivedIds, ['live-event-id'])
  assert.deepEqual(seenLastEventIds, [null, 'live-event-id'])
})

test('stream does not retry an authentication failure', async () => {
  let calls = 0
  const fetcher: NotificationFetch = async () => {
    calls += 1
    return new Response('', { status: 401 })
  }

  await assert.rejects(
    streamNotifications({
      token: 'expired-token',
      signal: new AbortController().signal,
      reconnectDelayMs: 0,
      onEvent: () => {},
      fetcher,
    }),
    (error: unknown) => (
      error instanceof NotificationStreamHttpError
      && error.status === 401
    ),
  )
  assert.equal(calls, 1)
})

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
