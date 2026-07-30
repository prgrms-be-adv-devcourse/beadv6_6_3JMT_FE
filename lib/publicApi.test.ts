import assert from 'node:assert/strict'
import test from 'node:test'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

import { publicApi } from './publicApi.ts'

test('publicApi sends OAuth requests without an Authorization header', async () => {
  let authorization: unknown = 'not-inspected'

  await publicApi.post(
    '/auth/rejoin',
    { rejoinToken: 'one-time-token' },
    {
      adapter: async (config): Promise<AxiosResponse> => {
        authorization = config.headers.get('Authorization')
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config as InternalAxiosRequestConfig,
        }
      },
    },
  )

  assert.equal(authorization, undefined)
})

test('publicApi returns a 401 failure directly without a refresh interceptor', async () => {
  const invalidTokenError = new Error('A014')

  await assert.rejects(
    publicApi.post(
      '/auth/rejoin',
      { rejoinToken: 'expired-token' },
      {
        adapter: async () => {
          throw invalidTokenError
        },
      },
    ),
    (error) => error === invalidTokenError,
  )
})
