import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAuthErrorCode,
  getOAuthLoginDestination,
  normalizeOAuthLoginResult,
} from './rejoinContracts.ts'

const completedLogin = {
  loginStatus: 'COMPLETED' as const,
  isNewUser: false,
  user: {
    id: 'user-1',
    name: '카카오사용자',
    email: 'user@example.com',
    roles: ['BUYER'],
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  tokenType: 'Bearer' as const,
  expiresAt: '2026-07-30T12:15:00Z',
}

test('normalizeOAuthLoginResult treats a legacy response without loginStatus as completed', () => {
  const legacyResponse = {
    isNewUser: completedLogin.isNewUser,
    user: completedLogin.user,
    accessToken: completedLogin.accessToken,
    refreshToken: completedLogin.refreshToken,
    tokenType: completedLogin.tokenType,
    expiresAt: completedLogin.expiresAt,
  }

  assert.deepEqual(normalizeOAuthLoginResult(legacyResponse), completedLogin)
})

test('getOAuthLoginDestination separates new, existing, and rejoin-required users', () => {
  assert.equal(getOAuthLoginDestination({ ...completedLogin, isNewUser: true }), '/onboarding')
  assert.equal(getOAuthLoginDestination(completedLogin), '/')
  assert.equal(
    getOAuthLoginDestination({
      loginStatus: 'REJOIN_REQUIRED',
      isNewUser: false,
      rejoinToken: 'one-time-token',
      rejoinExpiresAt: '2026-07-30T12:05:00Z',
    }),
    '/auth/rejoin',
  )
})

test('getAuthErrorCode reads short and named backend auth error codes', () => {
  assert.equal(getAuthErrorCode({ response: { data: { code: 'A014' } } }), 'A014')
  assert.equal(
    getAuthErrorCode({
      response: { data: { code: 'AUTH_REJOIN_TOKEN_INVALID(A014)' } },
    }),
    'A014',
  )
  assert.equal(
    getAuthErrorCode({ response: { data: { errorCode: 'AUTH_FORBIDDEN(A004)' } } }),
    'A004',
  )
  assert.equal(getAuthErrorCode(new Error('network')), null)
})
