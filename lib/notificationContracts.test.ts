import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNotificationListRequest,
  buildReadAllNotificationsRequest,
  buildReadNotificationRequest,
  buildUnreadNotificationCountRequest,
  readNotificationListData,
  readUnreadNotificationCount,
} from './notificationContracts.ts'
import type { NotificationItem } from '../types/api/notifications.ts'

test('default notification list request targets the backend v1 first page', () => {
  assert.deepEqual(buildNotificationListRequest(), {
    method: 'get',
    url: '/api/v1/notifications',
    params: {
      page: 1,
      size: 20,
    },
  })
})

test('notification list request clamps page and size to backend bounds', () => {
  assert.deepEqual(buildNotificationListRequest({ page: 0, size: 0 }).params, {
    page: 1,
    size: 1,
  })
  assert.deepEqual(buildNotificationListRequest({ page: -3, size: 101 }).params, {
    page: 1,
    size: 100,
  })
})

test('notification list request preserves a category filter', () => {
  assert.deepEqual(buildNotificationListRequest({ category: 'PAYMENT' }).params, {
    page: 1,
    size: 20,
    category: 'PAYMENT',
  })
})

test('notification read requests use backend v1 PATCH endpoints', () => {
  assert.deepEqual(buildReadNotificationRequest('notification-1'), {
    method: 'patch',
    url: '/api/v1/notifications/notification-1/read',
  })
  assert.deepEqual(buildReadAllNotificationsRequest(), {
    method: 'patch',
    url: '/api/v1/notifications/read-all',
  })
})

test('unread count request targets the backend v1 endpoint', () => {
  assert.deepEqual(buildUnreadNotificationCountRequest(), {
    method: 'get',
    url: '/api/v1/notifications/unread-count',
  })
})

const notification: NotificationItem = {
  notificationId: 'd0a1eb5c-55f2-45ff-9d8e-f3b59d8e4654',
  type: 'ORDER_PAID',
  category: 'PAYMENT',
  title: '결제가 완료되었어요',
  content: '주문한 상품을 지금 확인할 수 있어요.',
  linkUrl: '/mypage?tab=payments',
  reference: {
    type: 'ORDER',
    id: '7d5279b1-f82d-43ce-bd86-88e9a64cbcb1',
  },
  read: false,
  readAt: null,
  occurredAt: '2026-07-30T01:02:03Z',
  createdAt: '2026-07-30T01:02:04Z',
}

test('notification list response keeps the complete backend item contract', () => {
  assert.deepEqual(
    readNotificationListData({
      success: true,
      data: [notification],
      message: 'success',
      meta: {
        page: 1,
        size: 20,
        total: 1,
        hasNext: false,
      },
    }),
    [notification],
  )
})

test('notification list response treats a missing data array as an empty page', () => {
  assert.deepEqual(readNotificationListData({ data: null }), [])
})

test('unread count response reads the nested backend count', () => {
  assert.equal(
    readUnreadNotificationCount({
      success: true,
      data: {
        unreadCount: 27,
      },
      message: 'success',
    }),
    27,
  )
})
