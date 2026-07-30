import assert from 'node:assert/strict'
import test from 'node:test'

import { createSingleFlight } from './rejoinSubmission.ts'

test('createSingleFlight rejects duplicate work while the first submission is pending', async () => {
  let finishFirst!: () => void
  let calls = 0
  const firstPending = new Promise<void>((resolve) => {
    finishFirst = resolve
  })
  const singleFlight = createSingleFlight()

  const first = singleFlight.run(async () => {
    calls += 1
    await firstPending
  })
  const duplicate = singleFlight.run(async () => {
    calls += 1
  })

  assert.equal(duplicate, null)
  assert.equal(calls, 1)
  finishFirst()
  await first
})

test('createSingleFlight allows a retry after failed work settles', async () => {
  const singleFlight = createSingleFlight()

  await assert.rejects(
    singleFlight.run(async () => {
      throw new Error('temporary failure')
    })!,
    /temporary failure/,
  )

  const retry = singleFlight.run(async () => 'recovered')
  assert.ok(retry)
  assert.equal(await retry, 'recovered')
})
