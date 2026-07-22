import assert from 'node:assert/strict'
import test from 'node:test'
import { mapAdminProducts } from './adminProductAdapters.ts'

test('mapAdminProducts maps the current admin-service product response', () => {
  const result = mapAdminProducts([
    {
      productId: 'product-1',
      title: '검수 대기 프롬프트',
      sellerNickname: '프롬프트랩',
      productType: 'PROMPT',
      model: 'GPT-5',
      status: 'PENDING_REVIEW',
    },
  ])

  assert.deepEqual(result, [
    {
      id: 'product-1',
      title: '검수 대기 프롬프트',
      seller: '프롬프트랩',
      model: 'GPT-5',
      icon: 'PROMPT',
      status: 'review',
    },
  ])
})
