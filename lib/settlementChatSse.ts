import type {
  SettlementRunStage,
  SettlementRunStatus,
} from '@/lib/settlementChat'

export type SettlementSseEvent =
  | {
      type: 'snapshot'
      runId: string
      status: SettlementRunStatus
      stage: SettlementRunStage
      startedAt: string
      deadlineAt: string
    }
  | {
      type: 'progress'
      runId: string
      stage: SettlementRunStage
      occurredAt: string
    }
  | {
      type: 'delta'
      runId: string
      sequence: number
      text: string
    }
  | {
      type: 'done'
      runId: string
      answer: string
      completedAt: string
    }
  | {
      type: 'failed'
      runId: string
      code: string
      message: string
      failedAt: string
    }
  | {
      type: 'cancelled'
      runId: string
      cancelledAt: string
    }

export class SettlementSseHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Settlement SSE request failed with ${status}`)
    this.status = status
  }
}

export function parseSettlementSseBlock(block: string): SettlementSseEvent | null {
  const lines = block.split(/\r?\n/)
  if (lines.every((line) => line === '' || line.startsWith(':'))) {
    return null
  }

  let eventName = ''
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart())
    }
  }

  if (!eventName || dataLines.length === 0) {
    return null
  }

  return {
    type: eventName,
    ...JSON.parse(dataLines.join('\n')),
  } as SettlementSseEvent
}

interface StreamSettlementRunOptions {
  runId: string
  token: string
  signal: AbortSignal
  headers?: Record<string, string>
  // eslint-disable-next-line no-unused-vars
  onEvent(event: SettlementSseEvent): void
}

export async function streamSettlementRun({
  runId,
  token,
  signal,
  headers = {},
  onEvent,
}: StreamSettlementRunOptions): Promise<void> {
  const response = await fetch(`/api/v2/ai/settlement/runs/${runId}/events`, {
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    signal,
  })

  if (!response.ok) {
    throw new SettlementSseHttpError(response.status)
  }
  if (!response.body) {
    throw new Error('SSE response body is missing')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const event = parseSettlementSseBlock(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      if (event) {
        onEvent(event)
      }
      boundary = buffer.indexOf('\n\n')
    }

    if (done) {
      break
    }
  }

  if (buffer.trim()) {
    const event = parseSettlementSseBlock(buffer)
    if (event) {
      onEvent(event)
    }
  }
}
