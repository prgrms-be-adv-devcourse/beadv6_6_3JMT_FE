import api from '@/lib/auth'
import type {
  NotificationCategory,
  NotificationListResponse,
  ReadAllNotificationsData,
  ReadAllNotificationsResponse,
  ReadSingleNotificationData,
  ReadSingleNotificationResponse,
  UnreadCountResponse,
} from '@/types/api/notifications'

export const NOTIFICATIONS_API_BASE = '/api/v1/notifications'

export interface GetNotificationsParams {
  category?: NotificationCategory
  page?: number
  size?: number
}

export function normalizeNotificationQueryParams(params?: GetNotificationsParams): {
  category?: NotificationCategory
  page: number
  size: number
} {
  let page = params?.page ?? 1
  if (typeof page !== 'number' || isNaN(page) || page < 1) {
    page = 1
  }

  let size = params?.size ?? 20
  if (typeof size !== 'number' || isNaN(size) || size < 1) {
    size = 20
  } else if (size > 100) {
    size = 100
  }

  return {
    ...(params?.category ? { category: params.category } : {}),
    page,
    size,
  }
}

// GET /api/v1/notifications - 알림 목록 조회
export async function getNotifications(
  params?: GetNotificationsParams,
): Promise<NotificationListResponse> {
  const query = normalizeNotificationQueryParams(params)
  const res = await api.get<NotificationListResponse>(NOTIFICATIONS_API_BASE, {
    params: query,
  })
  return res.data
}

// GET /api/v1/notifications/unread-count - 읽지 않은 알림 개수 조회
export async function getUnreadCount(): Promise<number> {
  const res = await api.get<UnreadCountResponse>(`${NOTIFICATIONS_API_BASE}/unread-count`)
  return res.data.data?.unreadCount ?? 0
}

// PATCH /api/v1/notifications/{notificationId}/read - 단건 알림 읽음 처리
export async function markNotificationAsRead(
  notificationId: string,
): Promise<ReadSingleNotificationData> {
  const res = await api.patch<ReadSingleNotificationResponse>(
    `${NOTIFICATIONS_API_BASE}/${notificationId}/read`,
  )
  return res.data.data
}

// PATCH /api/v1/notifications/read-all - 전체 알림 읽음 처리
export async function markAllNotificationsAsRead(): Promise<ReadAllNotificationsData> {
  const res = await api.patch<ReadAllNotificationsResponse>(
    `${NOTIFICATIONS_API_BASE}/read-all`,
  )
  return res.data.data
}
