import type {
  NotificationSseEvent,
  NotificationSsePayload,
  NotificationSyncRequiredPayload,
} from '../types/api/notifications.ts'
import { getNotificationStreamUrl } from './notificationContracts.ts'

// eslint-disable-next-line no-unused-vars
export type NotificationFetch = (..._args: [string, RequestInit]) => Promise<Response>

export interface NotificationStreamOptions {
  token: string
  signal: AbortSignal
  // eslint-disable-next-line no-unused-vars
  onEvent: (..._args: [NotificationSseEvent]) => void
  lastEventId?: string
  reconnectDelayMs?: number
  fetcher?: NotificationFetch
}

interface NotificationStreamConnectionOptions extends NotificationStreamOptions {
  reconnectDelayMs?: never
}

export class NotificationStreamHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Notification stream failed with status ${status}`)
    this.name = 'NotificationStreamHttpError'
    this.status = status
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNotificationPayload(value: unknown): value is NotificationSsePayload {
  return isRecord(value)
    && typeof value.notificationId === 'string'
    && typeof value.type === 'string'
    && typeof value.title === 'string'
    && typeof value.content === 'string'
    && typeof value.unreadCount === 'number'
    && Number.isFinite(value.unreadCount)
    && value.unreadCount >= 0
}

function isSyncRequiredPayload(value: unknown): value is NotificationSyncRequiredPayload {
  return isRecord(value)
    && typeof value.code === 'string'
    && typeof value.replayLimit === 'number'
    && Number.isFinite(value.replayLimit)
    && value.replayLimit >= 0
}

export function parseNotificationSseBlock(block: string): NotificationSseEvent | null {
  let eventType = ''
  let eventId = ''
  const dataLines: string[] = []

  for (const rawLine of block.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')) {
    if (!rawLine || rawLine.startsWith(':')) continue

    const separator = rawLine.indexOf(':')
    const field = separator < 0 ? rawLine : rawLine.slice(0, separator)
    let value = separator < 0 ? '' : rawLine.slice(separator + 1)
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') eventType = value
    else if (field === 'id') eventId = value
    else if (field === 'data') dataLines.push(value)
  }

  if (dataLines.length === 0) return null

  let data: unknown
  try {
    data = JSON.parse(dataLines.join('\n'))
  } catch {
    return null
  }

  if (eventType === 'notification' && eventId && isNotificationPayload(data)) {
    return {
      type: 'notification',
      id: eventId,
      data,
    }
  }

  if (eventType === 'sync-required' && isSyncRequiredPayload(data)) {
    return {
      type: 'sync-required',
      data,
    }
  }

  return null
}

function buildStreamHeaders(token: string, lastEventId?: string) {
  const headers = new Headers({
    Accept: 'text/event-stream',
    Authorization: `Bearer ${token}`,
  })
  if (lastEventId) headers.set('Last-Event-ID', lastEventId)
  return headers
}

export async function consumeNotificationStreamOnce({
  token,
  signal,
  onEvent,
  lastEventId,
  fetcher = (url, init) => fetch(url, init),
}: NotificationStreamConnectionOptions): Promise<string | undefined> {
  const response = await fetcher(getNotificationStreamUrl(), {
    method: 'GET',
    headers: buildStreamHeaders(token, lastEventId),
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new NotificationStreamHttpError(response.status)
  }
  if (!response.body) {
    throw new Error('Notification stream response has no body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let latestEventId = lastEventId

  const dispatchCompleteBlocks = () => {
    buffer = buffer.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
    let boundary = buffer.indexOf('\n\n')

    while (boundary >= 0) {
      const event = parseNotificationSseBlock(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)

      if (event) {
        if (event.type === 'notification') latestEventId = event.id
        onEvent(event)
      }

      boundary = buffer.indexOf('\n\n')
    }
  }

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      dispatchCompleteBlocks()
    }
    buffer += decoder.decode()
    dispatchCompleteBlocks()
  } finally {
    reader.releaseLock()
  }

  return latestEventId
}

const RETRYABLE_STREAM_HTTP_STATUSES: ReadonlySet<number> = new Set([
  408,
  429,
  502,
  503,
  504,
])

function shouldRetryStream(error: unknown) {
  if (!(error instanceof NotificationStreamHttpError)) return true
  return RETRYABLE_STREAM_HTTP_STATUSES.has(error.status)
}

function waitForReconnect(delayMs: number, signal: AbortSignal) {
  if (delayMs <= 0 || signal.aborted) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    const timer = setTimeout(finish, delayMs)
    signal.addEventListener('abort', finish, { once: true })
  })
}

export async function streamNotifications({
  reconnectDelayMs = 1_000,
  ...connectionOptions
}: NotificationStreamOptions): Promise<void> {
  let lastEventId = connectionOptions.lastEventId

  while (!connectionOptions.signal.aborted) {
    try {
      lastEventId = await consumeNotificationStreamOnce({
        ...connectionOptions,
        lastEventId,
      })
    } catch (error) {
      if (connectionOptions.signal.aborted) return
      if (!shouldRetryStream(error)) throw error
    }

    if (connectionOptions.signal.aborted) return
    await waitForReconnect(reconnectDelayMs, connectionOptions.signal)
  }
}
