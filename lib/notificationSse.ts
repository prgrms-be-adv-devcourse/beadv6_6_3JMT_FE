import type { NotificationSseEvent } from '@/types/api/notifications'
import { NOTIFICATIONS_API_BASE } from '@/lib/notifications'

export class NotificationSseHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Notification SSE request failed with ${status}`)
    this.status = status
  }
}

export function parseNotificationSseBlock(block: string): NotificationSseEvent | null {
  const lines = block.split(/\r?\n/)
  if (lines.every((line) => line === '' || line.startsWith(':'))) {
    return null
  }

  let eventName = ''
  let id = ''
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('id:')) {
      id = line.slice(3).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (!eventName || dataLines.length === 0) {
    return null
  }

  try {
    const payload = JSON.parse(dataLines.join('\n'))
    if (eventName === 'notification') {
      return {
        type: 'notification',
        id: id || payload.notificationId || '',
        data: payload,
      }
    }
    if (eventName === 'sync-required') {
      return {
        type: 'sync-required',
        data: payload,
      }
    }
    return null
  } catch {
    return null
  }
}

export interface StreamNotificationsOptions {
  token?: string
  userId?: string
  lastEventId?: string
  signal: AbortSignal
  headers?: Record<string, string>
  // eslint-disable-next-line no-unused-vars
  onEvent(event: NotificationSseEvent): void
}

export async function streamNotifications({
  token,
  userId,
  lastEventId,
  signal,
  headers = {},
  onEvent,
}: StreamNotificationsOptions): Promise<void> {
  const reqHeaders: Record<string, string> = {
    Accept: 'text/event-stream',
    ...headers,
  }

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`
  }
  if (userId) {
    reqHeaders['X-User-Id'] = userId
  }
  if (lastEventId) {
    reqHeaders['Last-Event-ID'] = lastEventId
  }

  const response = await fetch(`${NOTIFICATIONS_API_BASE}/stream`, {
    headers: reqHeaders,
    signal,
  })

  if (!response.ok) {
    throw new NotificationSseHttpError(response.status)
  }
  if (!response.body) {
    throw new Error('SSE response body is missing')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const event = parseNotificationSseBlock(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      if (event) {
        onEvent(event)
      }
      boundary = buffer.indexOf('\n\n')
    }

    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    const event = parseNotificationSseBlock(buffer)
    if (event) {
      onEvent(event)
    }
  }
}
