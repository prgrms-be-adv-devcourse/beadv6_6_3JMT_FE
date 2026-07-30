import api from '@/lib/auth'
import type {
  ApiResult,
  NotificationListResponse,
  NotificationReadResponse,
  ReadAllNotificationsResponse,
  UnreadNotificationCountResponse,
} from '@/types/api/notifications'
import {
  buildNotificationListRequest,
  buildReadAllNotificationsRequest,
  buildReadNotificationRequest,
  buildUnreadNotificationCountRequest,
  readNotificationListData,
  readUnreadNotificationCount,
  type NotificationListQuery,
} from './notificationContracts'

export async function getNotifications(query: NotificationListQuery = {}) {
  const response = await api.request<NotificationListResponse>(buildNotificationListRequest(query))
  return readNotificationListData(response.data)
}

export async function getUnreadNotificationCount() {
  const response = await api.request<ApiResult<UnreadNotificationCountResponse>>(
    buildUnreadNotificationCountRequest(),
  )
  return readUnreadNotificationCount(response.data)
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await api.request<ApiResult<NotificationReadResponse>>(
    buildReadNotificationRequest(notificationId),
  )
  return response.data.data
}

export async function markAllNotificationsAsRead() {
  const response = await api.request<ApiResult<ReadAllNotificationsResponse>>(
    buildReadAllNotificationsRequest(),
  )
  return response.data.data
}
