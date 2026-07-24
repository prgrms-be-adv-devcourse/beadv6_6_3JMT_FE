import type {
  SettlementConversation,
  SettlementRunStage,
} from '@/lib/settlementChat'

export type SettlementChatPhase =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'submitting'
  | 'running'
  | 'disabled'

export interface SettlementUiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface SettlementChatState {
  phase: SettlementChatPhase
  historyLoaded: boolean
  messages: SettlementUiMessage[]
  activeRunId: string | null
  stage: SettlementRunStage | null
  streamedAnswer: string
  error: string | null
  reconnectAvailable: boolean
}

export type SettlementChatAction =
  | { type: 'loading' }
  | { type: 'restored'; conversation: SettlementConversation | null }
  | { type: 'submitting' }
  | {
      type: 'questionAccepted'
      runId: string
      question: string
      startedAt: string
    }
  | { type: 'snapshot'; stage: SettlementRunStage }
  | { type: 'progress'; stage: SettlementRunStage }
  | { type: 'delta'; text: string }
  | { type: 'done'; answer: string; completedAt: string }
  | { type: 'failed'; message: string }
  | { type: 'cancelled' }
  | { type: 'disabled'; message: string }
  | { type: 'connectionLost' }
  | { type: 'clearError' }

export const initialSettlementChatState: SettlementChatState = {
  phase: 'idle',
  historyLoaded: false,
  messages: [],
  activeRunId: null,
  stage: null,
  streamedAnswer: '',
  error: null,
  reconnectAvailable: false,
}

export function canSubmitSettlementQuestion(
  state: SettlementChatState,
): boolean {
  return state.phase === 'ready' && state.activeRunId === null
}

export function settlementChatReducer(
  state: SettlementChatState,
  action: SettlementChatAction,
): SettlementChatState {
  switch (action.type) {
    case 'loading':
      return { ...state, phase: 'loading', error: null }

    case 'restored': {
      const conversation = action.conversation
      const messages: SettlementUiMessage[] = (
        conversation?.messages ?? []
      ).map((message) => ({
        id: message.messageId,
        role: message.role === 'USER' ? 'user' : 'assistant',
        content: message.content,
        createdAt: message.createdAt,
      }))
      const hasActiveRun = Boolean(
        conversation?.activeRunId &&
          conversation.latestRun?.status === 'RUNNING',
      )

      if (hasActiveRun && conversation?.latestRun) {
        messages.push({
          id: `active-${conversation.latestRun.runId}`,
          role: 'user',
          content: conversation.latestRun.question,
          createdAt: conversation.latestRun.startedAt,
        })
      }

      return {
        ...state,
        phase: hasActiveRun ? 'running' : 'ready',
        historyLoaded: true,
        messages,
        activeRunId: hasActiveRun ? conversation?.activeRunId ?? null : null,
        stage: hasActiveRun ? conversation?.latestRun?.stage ?? null : null,
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }
    }

    case 'submitting':
      return {
        ...state,
        phase: 'submitting',
        error: null,
        reconnectAvailable: false,
      }

    case 'questionAccepted':
      return {
        ...state,
        phase: 'running',
        messages: [
          ...state.messages,
          {
            id: `question-${action.runId}`,
            role: 'user',
            content: action.question,
            createdAt: action.startedAt,
          },
        ],
        activeRunId: action.runId,
        stage: 'ANALYZING',
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }

    case 'snapshot':
    case 'progress':
      return {
        ...state,
        phase: 'running',
        stage: action.stage,
        error: null,
      }

    case 'delta':
      return {
        ...state,
        streamedAnswer: state.streamedAnswer + action.text,
      }

    case 'done':
      return {
        ...state,
        phase: 'ready',
        messages: [
          ...state.messages,
          {
            id: `answer-${action.completedAt}`,
            role: 'assistant',
            content: action.answer,
            createdAt: action.completedAt,
          },
        ],
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: null,
        reconnectAvailable: false,
      }

    case 'failed':
      return {
        ...state,
        phase: 'ready',
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: action.message,
        reconnectAvailable: false,
      }

    case 'cancelled':
      return {
        ...state,
        phase: 'ready',
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: '답변 생성이 취소됐어요.',
        reconnectAvailable: false,
      }

    case 'disabled':
      return {
        ...state,
        phase: 'disabled',
        activeRunId: null,
        stage: null,
        streamedAnswer: '',
        error: action.message,
        reconnectAvailable: false,
      }

    case 'connectionLost':
      return {
        ...state,
        phase: 'running',
        error: '연결이 끊겼어요. 다시 시도해 주세요.',
        reconnectAvailable: true,
      }

    case 'clearError':
      return { ...state, error: null }
  }
}
