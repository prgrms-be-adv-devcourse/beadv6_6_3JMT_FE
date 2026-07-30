type ExtensibleString<T extends string> = T | (string & Record<never, never>)

export type NotificationCategory = ExtensibleString<
  'ORDER' | 'PAYMENT' | 'REFUND' | 'PRODUCT' | 'SYSTEM' | 'MARKETING'
>

export type NotificationType = ExtensibleString<
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'ORDER_PAYMENT_FAILED'
  | 'ORDER_EXPIRED'
  | 'ORDER_REFUND_REQUESTED'
  | 'ORDER_PARTIALLY_REFUNDED'
  | 'ORDER_REFUNDED'
  | 'ORDER_REFUND_FAILED'
>

export interface NotificationReference {
  type: string | null
  id: string | null
}

export interface NotificationItem {
  notificationId: string
  type: NotificationType
  category: NotificationCategory
  title: string
  content: string
  linkUrl: string | null
  reference: NotificationReference
  read: boolean
  readAt: string | null
  occurredAt: string
  createdAt: string
}

export interface NotificationPageMeta {
  page: number
  size: number
  total: number
  hasNext: boolean
}

export interface NotificationListResponse {
  success: boolean
  data: NotificationItem[]
  message: string
  meta: NotificationPageMeta
}

export interface ApiResult<T> {
  success: boolean
  data: T
  message: string
}

export interface UnreadNotificationCountResponse {
  unreadCount: number
}

export interface NotificationReadResponse {
  notificationId: string
  read: boolean
  readAt: string
}

export interface ReadAllNotificationsResponse {
  updatedCount: number
  readAt: string
}

export interface NotificationSsePayload {
  notificationId: string
  type: NotificationType
  title: string
  content: string
  unreadCount: number
}

export interface NotificationSyncRequiredPayload {
  code: string
  replayLimit: number
}

export type NotificationSseEvent =
  | {
      type: 'notification'
      id: string
      data: NotificationSsePayload
    }
  | {
      type: 'sync-required'
      data: NotificationSyncRequiredPayload
    }
