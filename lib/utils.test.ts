import assert from 'node:assert/strict'
import test from 'node:test'

import { apiErrorMessage, isValidProductPrice, settlementMonthLabel, settlementPeriodLabel } from './utils.ts'

test('settlementMonthLabel formats a YYYY-MM settlement month', () => {
  assert.equal(settlementMonthLabel('2026-07'), '2026년 7월')
})

test('settlementPeriodLabel shortens the end date within a weekly period', () => {
  assert.equal(settlementPeriodLabel('2026-06-29', '2026-07-05'), '2026.06.29 ~ 07.05')
})

test('apiErrorMessage uses a backend message or falls back safely', () => {
  assert.equal(
    apiErrorMessage({ response: { data: { message: '처리 불가' } } }, '실패'),
    '처리 불가',
  )
  assert.equal(apiErrorMessage(new Error('network'), '실패'), '실패')
})

test('isValidProductPrice allows free (0) or >= 100, rejects 1~99', () => {
  assert.equal(isValidProductPrice(0), true)
  assert.equal(isValidProductPrice(100), true)
  assert.equal(isValidProductPrice(4900), true)
  assert.equal(isValidProductPrice(1), false)
  assert.equal(isValidProductPrice(50), false)
  assert.equal(isValidProductPrice(99), false)
})
