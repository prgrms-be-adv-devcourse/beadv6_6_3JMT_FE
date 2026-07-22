import assert from 'node:assert/strict'
import test from 'node:test'

import { splitUniqueIds } from './batchIds.ts'

test('splitUniqueIds returns no chunks for an empty list', () => {
  assert.deepEqual(splitUniqueIds([]), [])
})

test('splitUniqueIds removes duplicates and preserves first-seen order', () => {
  assert.deepEqual(splitUniqueIds(['a', 'b', 'a']), [['a', 'b']])
})

test('splitUniqueIds splits more than 30 ids into ordered chunks', () => {
  const ids = Array.from({ length: 31 }, (_, index) => `id-${index + 1}`)

  const chunks = splitUniqueIds(ids)

  assert.equal(chunks.length, 2)
  assert.equal(chunks[0].length, 30)
  assert.deepEqual(chunks[1], ['id-31'])
})
