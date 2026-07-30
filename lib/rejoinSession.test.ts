import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearRejoinSession,
  inspectRejoinSession,
  saveRejoinSession,
  type StorageLike,
} from './rejoinSession.ts'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

test('saveRejoinSession keeps the token and expiry in the supplied current-tab storage', () => {
  const storage = new MemoryStorage()

  saveRejoinSession(
    {
      token: 'opaque-one-time-token',
      expiresAt: '2026-07-30T12:05:00Z',
    },
    storage,
  )

  assert.deepEqual(inspectRejoinSession(storage, Date.parse('2026-07-30T12:04:00Z')), {
    status: 'valid',
    value: {
      token: 'opaque-one-time-token',
      expiresAt: '2026-07-30T12:05:00Z',
    },
  })
})

test('inspectRejoinSession clears expired temporary credentials and reports expiry', () => {
  const storage = new MemoryStorage()
  saveRejoinSession(
    {
      token: 'expired-token',
      expiresAt: '2026-07-30T12:05:00Z',
    },
    storage,
  )

  assert.deepEqual(inspectRejoinSession(storage, Date.parse('2026-07-30T12:05:00Z')), {
    status: 'expired',
  })
  assert.deepEqual(inspectRejoinSession(storage, Date.parse('2026-07-30T12:05:01Z')), {
    status: 'missing',
  })
})

test('inspectRejoinSession rejects and clears malformed stored data', () => {
  const storage = new MemoryStorage()
  storage.setItem('prompthub.rejoin-session', '{"token":42}')

  assert.deepEqual(inspectRejoinSession(storage), { status: 'missing' })
  assert.equal(storage.getItem('prompthub.rejoin-session'), null)
})

test('clearRejoinSession removes valid temporary credentials', () => {
  const storage = new MemoryStorage()
  saveRejoinSession(
    {
      token: 'token-to-clear',
      expiresAt: '2026-07-30T12:05:00Z',
    },
    storage,
  )

  clearRejoinSession(storage)

  assert.deepEqual(inspectRejoinSession(storage), { status: 'missing' })
})
