export type NotificationCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'REFUND'
  | 'PRODUCT'
  | 'SYSTEM'
  | 'MARKETING'

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'ORDER_PAYMENT_FAILED'
  | 'ORDER_EXPIRED'
  | 'ORDER_REFUND_REQUESTED'
  | 'ORDER_PARTIALLY_REFUNDED'
  | 'ORDER_REFUNDED'
  | 'ORDER_REFUND_FAILED'

export interface NotificationReference {
  type: string | null
  id: string | null
}

export interface NotificationItem {
  notificationId: string
  type: NotificationType | string
  category: NotificationCategory | string
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

export interface UnreadCountData {
  unreadCount: number
}

export interface UnreadCountResponse {
  success: boolean
  data: UnreadCountData
  message: string
}

export interface ReadSingleNotificationData {
  notificationId: string
  read: boolean
  readAt: string
}

export interface ReadSingleNotificationResponse {
  success: boolean
  data: ReadSingleNotificationData
  message: string
}

export interface ReadAllNotificationsData {
  updatedCount: number
  readAt: string
}

export interface ReadAllNotificationsResponse {
  success: boolean
  data: ReadAllNotificationsData
  message: string
}

export interface NotificationSseData {
  notificationId: string
  type: NotificationType | string
  title: string
  content: string
  unreadCount: number
}

export interface NotificationSyncRequiredData {
  code: string
  replayLimit: number
}

export type NotificationSseEvent =
  | {
      type: 'notification'
      id: string
      data: NotificationSseData
    }
  | {
      type: 'sync-required'
      data: NotificationSyncRequiredData
    }

export interface NotificationApiErrorResponse {
  success: false
  data: null
  message: string
  code: 'V001' | 'N001' | 'N002' | 'SYS001' | string
}
