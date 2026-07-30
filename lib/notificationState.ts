import type { NotificationItem } from '../types/api/notifications.ts'

export interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
}

export type NotificationStateAction =
  | {
      type: 'hydrate'
      items: NotificationItem[]
      unreadCount: number
    }
  | {
      type: 'replace-items'
      items: NotificationItem[]
    }
  | {
      type: 'set-unread-count'
      unreadCount: number
    }
  | {
      type: 'read-one'
      notificationId: string
      readAt: string
    }
  | {
      type: 'read-all'
      readAt: string
    }
  | {
      type: 'reset'
    }

export const initialNotificationState: NotificationState = {
  items: [],
  unreadCount: 0,
}

export function notificationStateReducer(
  state: NotificationState,
  action: NotificationStateAction,
): NotificationState {
  switch (action.type) {
    case 'hydrate':
      return {
        items: action.items,
        unreadCount: Math.max(0, action.unreadCount),
      }
    case 'replace-items':
      return {
        ...state,
        items: action.items,
      }
    case 'set-unread-count':
      return {
        ...state,
        unreadCount: Math.max(0, action.unreadCount),
      }
    case 'read-one': {
      const notification = state.items.find(
        (item) => item.notificationId === action.notificationId,
      )
      if (!notification || notification.read) return state

      return {
        items: state.items.map((item) => (
          item.notificationId === action.notificationId
            ? {
                ...item,
                read: true,
                readAt: action.readAt,
              }
            : item
        )),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }
    case 'read-all':
      return {
        items: state.items.map((item) => (
          item.read
            ? item
            : {
                ...item,
                read: true,
                readAt: action.readAt,
              }
        )),
        unreadCount: 0,
      }
    case 'reset':
      return initialNotificationState
  }
}
