import type {
  ApiResult,
  NotificationCategory,
  NotificationItem,
  NotificationListResponse,
  UnreadNotificationCountResponse,
} from '../types/api/notifications.ts'

export const NOTIFICATION_API_BASE = '/api/v1/notifications'

export interface NotificationListQuery {
  category?: NotificationCategory
  page?: number
  size?: number
}

interface NotificationListRequest {
  method: 'get'
  url: string
  params: {
    category?: NotificationCategory
    page: number
    size: number
  }
}

interface NotificationPatchRequest {
  method: 'patch'
  url: string
}

function boundedInteger(value: number | undefined, fallback: number, min: number, max?: number) {
  const integer = value === undefined || !Number.isFinite(value) ? fallback : Math.trunc(value)
  return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, integer))
}

export function buildNotificationListRequest(
  query: NotificationListQuery = {},
): NotificationListRequest {
  const params: NotificationListRequest['params'] = {
    page: boundedInteger(query.page, 1, 1),
    size: boundedInteger(query.size, 20, 1, 100),
  }

  if (query.category !== undefined) {
    params.category = query.category
  }

  return {
    method: 'get',
    url: NOTIFICATION_API_BASE,
    params,
  }
}

export function buildUnreadNotificationCountRequest() {
  return {
    method: 'get' as const,
    url: `${NOTIFICATION_API_BASE}/unread-count`,
  }
}

export function buildReadNotificationRequest(notificationId: string): NotificationPatchRequest {
  return {
    method: 'patch',
    url: `${NOTIFICATION_API_BASE}/${encodeURIComponent(notificationId)}/read`,
  }
}

export function buildReadAllNotificationsRequest(): NotificationPatchRequest {
  return {
    method: 'patch',
    url: `${NOTIFICATION_API_BASE}/read-all`,
  }
}

export function getNotificationStreamUrl() {
  return `${NOTIFICATION_API_BASE}/stream`
}

export function readNotificationListData(
  response: NotificationListResponse | { data?: NotificationItem[] | null },
): NotificationItem[] {
  return response.data ?? []
}

export function readUnreadNotificationCount(
  response: ApiResult<UnreadNotificationCountResponse>,
): number {
  return response.data.unreadCount
}
