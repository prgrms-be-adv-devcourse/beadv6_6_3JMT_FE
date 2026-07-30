const REJOIN_SESSION_KEY = 'prompthub.rejoin-session'

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type RejoinSessionValue = {
  token: string
  expiresAt: string
}

export type RejoinSessionInspection =
  | { status: 'valid'; value: RejoinSessionValue }
  | { status: 'expired' }
  | { status: 'missing' }

function getCurrentTabStorage(): StorageLike | null {
  return typeof window === 'undefined' ? null : window.sessionStorage
}

function isRejoinSessionValue(value: unknown): value is RejoinSessionValue {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<RejoinSessionValue>
  return (
    typeof candidate.token === 'string' &&
    candidate.token.length > 0 &&
    typeof candidate.expiresAt === 'string' &&
    Number.isFinite(Date.parse(candidate.expiresAt))
  )
}

export function saveRejoinSession(
  value: RejoinSessionValue,
  storage: StorageLike | null = getCurrentTabStorage(),
) {
  storage?.setItem(REJOIN_SESSION_KEY, JSON.stringify(value))
}

export function clearRejoinSession(storage: StorageLike | null = getCurrentTabStorage()) {
  storage?.removeItem(REJOIN_SESSION_KEY)
}

export function inspectRejoinSession(
  storage: StorageLike | null = getCurrentTabStorage(),
  now = Date.now(),
): RejoinSessionInspection {
  const serialized = storage?.getItem(REJOIN_SESSION_KEY)
  if (!serialized) return { status: 'missing' }

  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch {
    clearRejoinSession(storage)
    return { status: 'missing' }
  }

  if (!isRejoinSessionValue(value)) {
    clearRejoinSession(storage)
    return { status: 'missing' }
  }

  if (Date.parse(value.expiresAt) <= now) {
    clearRejoinSession(storage)
    return { status: 'expired' }
  }

  return { status: 'valid', value }
}

export const rejoinSession = {
  save: saveRejoinSession,
  inspect: inspectRejoinSession,
  clear: clearRejoinSession,
}
