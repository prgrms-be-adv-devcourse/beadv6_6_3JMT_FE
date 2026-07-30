import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveDeliverable } from './purchasedProductDeliverable.ts'

test('resolveDeliverable returns text for PROMPT', () => {
  const result = resolveDeliverable({
    productType: 'PROMPT', content: '본문', fileUrl: null, externalUrl: null,
  })
  assert.deepEqual(result, { kind: 'text', value: '본문' })
})

test('resolveDeliverable returns file for PPT/EXCEL', () => {
  const result = resolveDeliverable({
    productType: 'PPT', content: null, fileUrl: 'https://s3/presigned', externalUrl: null,
  })
  assert.deepEqual(result, { kind: 'file', value: 'https://s3/presigned' })
})

test('resolveDeliverable returns link for NOTION', () => {
  const result = resolveDeliverable({
    productType: 'NOTION', content: null, fileUrl: null, externalUrl: 'https://notion.so/x',
  })
  assert.deepEqual(result, { kind: 'link', value: 'https://notion.so/x' })
})

test('resolveDeliverable returns null when the deliverable field is empty', () => {
  const result = resolveDeliverable({
    productType: 'EXCEL', content: null, fileUrl: null, externalUrl: null,
  })
  assert.equal(result, null)
})
