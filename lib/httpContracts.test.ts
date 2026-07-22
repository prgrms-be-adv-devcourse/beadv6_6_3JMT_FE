import assert from 'node:assert/strict'
import test from 'node:test'

import { hasHttpStatus } from './httpContracts.ts'

test('hasHttpStatus recognizes an HTTP response status', () => {
  assert.equal(hasHttpStatus({ response: { status: 404 } }, 404), true)
  assert.equal(hasHttpStatus({ response: { status: 500 } }, 404), false)
  assert.equal(hasHttpStatus(new Error('network'), 404), false)
})
