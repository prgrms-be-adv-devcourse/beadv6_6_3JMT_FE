import test from 'node:test'
import assert from 'node:assert/strict'

import {
  initialNotificationState,
  notificationStateReducer,
} from './notificationState.ts'
import type { NotificationItem } from '../types/api/notifications.ts'

const unreadNotification: NotificationItem = {
  notificationId: 'notification-1',
  type: 'ORDER_CREATED',
  category: 'ORDER',
  title: '주문이 생성되었어요',
  content: '결제를 진행해주세요.',
  linkUrl: '/mypage?tab=payments',
  reference: {
    type: 'ORDER',
    id: 'order-1',
  },
  read: false,
  readAt: null,
  occurredAt: '2026-07-30T01:00:00Z',
  createdAt: '2026-07-30T01:00:01Z',
}

const secondUnreadNotification: NotificationItem = {
  ...unreadNotification,
  notificationId: 'notification-2',
  type: 'ORDER_PAID',
  category: 'PAYMENT',
  title: '결제가 완료되었어요',
  createdAt: '2026-07-30T01:01:01Z',
}

test('hydrate keeps the backend unread count independent from visible rows', () => {
  assert.deepEqual(
    notificationStateReducer(initialNotificationState, {
      type: 'hydrate',
      items: [unreadNotification],
      unreadCount: 27,
    }),
    {
      items: [unreadNotification],
      unreadCount: 27,
    },
  )
})

test('SSE unread count update does not synthesize an incomplete list item', () => {
  const state = {
    items: [unreadNotification],
    unreadCount: 1,
  }

  assert.deepEqual(
    notificationStateReducer(state, {
      type: 'set-unread-count',
      unreadCount: 2,
    }),
    {
      items: [unreadNotification],
      unreadCount: 2,
    },
  )
})

test('reading one notification decrements the count only once and records readAt', () => {
  const state = {
    items: [unreadNotification],
    unreadCount: 3,
  }
  const action = {
    type: 'read-one' as const,
    notificationId: unreadNotification.notificationId,
    readAt: '2026-07-30T02:00:00Z',
  }

  const firstRead = notificationStateReducer(state, action)
  assert.deepEqual(firstRead, {
    items: [{
      ...unreadNotification,
      read: true,
      readAt: '2026-07-30T02:00:00Z',
    }],
    unreadCount: 2,
  })
  assert.deepEqual(notificationStateReducer(firstRead, action), firstRead)
})

test('reading all notifications marks visible rows read and clears the backend count', () => {
  const readAt = '2026-07-30T02:00:00Z'

  assert.deepEqual(
    notificationStateReducer({
      items: [unreadNotification, secondUnreadNotification],
      unreadCount: 12,
    }, {
      type: 'read-all',
      readAt,
    }),
    {
      items: [
        {
          ...unreadNotification,
          read: true,
          readAt,
        },
        {
          ...secondUnreadNotification,
          read: true,
          readAt,
        },
      ],
      unreadCount: 0,
    },
  )
})

test('reset clears notification items and unread count', () => {
  assert.deepEqual(
    notificationStateReducer({
      items: [unreadNotification],
      unreadCount: 1,
    }, {
      type: 'reset',
    }),
    initialNotificationState,
  )
})
