import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export type SettlementChatRole = 'USER' | 'ASSISTANT'
export type SettlementRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type SettlementRunStage = 'ANALYZING' | 'FETCHING_DATA' | 'GENERATING_ANSWER' | 'DONE'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message: string
}

export interface SettlementConversationMessage {
  messageId: string
  role: SettlementChatRole
  content: string
  createdAt: string
}

export interface SettlementLatestRun {
  runId: string
  question: string
  status: SettlementRunStatus
  stage: SettlementRunStage
  startedAt: string
  deadlineAt: string
}

export interface SettlementConversation {
  conversationId: string
  messages: SettlementConversationMessage[]
  latestRun: SettlementLatestRun | null
  activeRunId: string | null
  expiresAt: string
}

export interface AcceptedSettlementRun {
  conversationId: string
  runId: string
  status: 'RUNNING'
  startedAt: string
  deadlineAt: string
}

export async function getCurrentSettlementConversation(): Promise<SettlementConversation | null> {
  const response = await api.get<ApiEnvelope<SettlementConversation | null>>(
    `${API_BASE}/ai/settlement/conversations/current`,
  )
  return response.data.data
}

export async function createSettlementChatMessage(
  content: string,
): Promise<AcceptedSettlementRun> {
  const response = await api.post<ApiEnvelope<AcceptedSettlementRun>>(
    `${API_BASE}/ai/settlement/conversations/current/messages`,
    { content: content.trim() },
  )
  return response.data.data
}
