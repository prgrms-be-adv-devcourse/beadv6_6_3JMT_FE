'use client'

import axios from 'axios'
import {
  ChevronRight,
  LoaderCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import Image from 'next/image'
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import {
  createSettlementChatMessage,
  getCurrentSettlementConversation,
  type SettlementRunStage,
} from '@/lib/settlementChat'
import {
  SettlementSseHttpError,
  streamSettlementRun,
} from '@/lib/settlementChatSse'
import { directRoutingHeaders } from '@/lib/directRouting'
import { useAuthStore } from '@/store/useAuthStore'

import {
  canSubmitSettlementQuestion,
  initialSettlementChatState,
  settlementChatReducer,
} from './settlementChatState'

const SUGGESTIONS = [
  {
    label: '이번 달 정산 요약',
    question: '이번 달 정산 판매액, 환불액, 수수료와 지급액을 요약해줘',
  },
  {
    label: '지난달과 이번 달 비교',
    question: '지난달과 이번 달 정산 금액과 증감률을 비교해줘',
  },
  {
    label: '이번 달 주간별 정산',
    question: '이번 달 정산을 완료된 주 단위로 나눠서 보여줘',
  },
  {
    label: '이번 달 지급 상태',
    question: '이번 달 주간 정산별 지급 상태와 상태별 건수를 알려줘',
  },
] as const

const STAGE_LABEL: Record<SettlementRunStage, string> = {
  ANALYZING: '질문을 분석하고 있어요',
  FETCHING_DATA: '정산 데이터를 확인하고 있어요',
  GENERATING_ANSWER: '답변을 정리하고 있어요',
  DONE: '답변을 완료했어요',
}

function messageForStatus(status?: number): string {
  if (status === 400) return '질문 내용을 확인해 주세요.'
  if (status === 401) return '로그인 정보를 확인해 주세요.'
  if (status === 403) return '셀러만 정산 도우미를 사용할 수 있어요.'
  if (status === 404) return '진행 중인 답변을 찾지 못했어요.'
  if (status === 429) return '현재 요청이 많아요. 잠시 후 다시 시도해 주세요.'
  if (status === 503) return '정산 도우미를 준비하고 있어요.'
  return '정산 도우미에 연결하지 못했어요.'
}

function statusOf(error: unknown): number | undefined {
  if (error instanceof SettlementSseHttpError) return error.status
  if (axios.isAxiosError(error)) return error.response?.status
  return undefined
}

function useSettlementChat() {
  const [state, dispatch] = useReducer(
    settlementChatReducer,
    initialSettlementChatState,
  )
  const stateRef = useRef(state)
  const loadedRef = useRef(false)
  const mountedRef = useRef(true)
  const controllerRef = useRef<AbortController | null>(null)
  stateRef.current = state

  const connectRun = useCallback(
    async function connect(runId: string, attempt: number): Promise<void> {
      if (!mountedRef.current) return

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      const { token, user } = useAuthStore.getState()
      if (!token) {
        dispatch({ type: 'failed', message: messageForStatus(401) })
        return
      }

      let terminalReceived = false
      const streamPath = `/api/v2/ai/settlement/runs/${runId}/events`

      try {
        await streamSettlementRun({
          runId,
          token,
          signal: controller.signal,
          headers: directRoutingHeaders(streamPath, user) ?? undefined,
          onEvent: (event) => {
            if (!mountedRef.current || event.runId !== runId) return

            if (event.type === 'snapshot') {
              dispatch({ type: 'snapshot', stage: event.stage })
            } else if (event.type === 'progress') {
              dispatch({ type: 'progress', stage: event.stage })
            } else if (event.type === 'delta') {
              dispatch({ type: 'delta', text: event.text })
            } else if (event.type === 'done') {
              terminalReceived = true
              dispatch({
                type: 'done',
                answer: event.answer,
                completedAt: event.completedAt,
              })
            } else if (event.type === 'failed') {
              terminalReceived = true
              dispatch({ type: 'failed', message: event.message })
            } else if (event.type === 'cancelled') {
              terminalReceived = true
              dispatch({ type: 'cancelled' })
            }
          },
        })

        if (
          mountedRef.current &&
          !controller.signal.aborted &&
          !terminalReceived
        ) {
          if (attempt === 0) {
            await connect(runId, 1)
          } else {
            dispatch({ type: 'connectionLost' })
          }
        }
      } catch (error) {
        if (!mountedRef.current || controller.signal.aborted) return

        const status = statusOf(error)
        if (status === 503) {
          dispatch({
            type: 'disabled',
            message: messageForStatus(status),
          })
          return
        }
        if (status === 403 || status === 404) {
          dispatch({ type: 'failed', message: messageForStatus(status) })
          return
        }

        if (status === 401 && attempt === 0) {
          try {
            await getCurrentSettlementConversation()
            await connect(runId, 1)
            return
          } catch (refreshError) {
            dispatch({
              type: 'failed',
              message: messageForStatus(statusOf(refreshError)),
            })
            return
          }
        }

        if (attempt === 0) {
          await connect(runId, 1)
        } else {
          dispatch({ type: 'connectionLost' })
        }
      } finally {
        if (controllerRef.current === controller && terminalReceived) {
          controllerRef.current = null
        }
      }
    },
    [],
  )

  const load = useCallback(async () => {
    if (loadedRef.current) return
    loadedRef.current = true
    dispatch({ type: 'loading' })

    try {
      const conversation = await getCurrentSettlementConversation()
      if (!mountedRef.current) return

      dispatch({ type: 'restored', conversation })
      if (conversation?.activeRunId) {
        void connectRun(conversation.activeRunId, 0)
      }
    } catch (error) {
      if (!mountedRef.current) return

      const status = statusOf(error)
      if (status === 503) {
        dispatch({ type: 'disabled', message: messageForStatus(status) })
      } else {
        loadedRef.current = false
        dispatch({ type: 'failed', message: messageForStatus(status) })
      }
    }
  }, [connectRun])

  const submit = useCallback(
    async (rawQuestion: string): Promise<boolean> => {
      const question = rawQuestion.trim()
      if (
        !question ||
        question.length > 2_000 ||
        !canSubmitSettlementQuestion(stateRef.current)
      ) {
        return false
      }

      dispatch({ type: 'submitting' })

      try {
        const accepted = await createSettlementChatMessage(question)
        if (!mountedRef.current) return false

        dispatch({
          type: 'questionAccepted',
          runId: accepted.runId,
          question,
          startedAt: accepted.startedAt,
        })
        void connectRun(accepted.runId, 0)
        return true
      } catch (error) {
        if (!mountedRef.current) return false

        const status = statusOf(error)
        if (status === 409) {
          try {
            const conversation = await getCurrentSettlementConversation()
            if (!mountedRef.current) return false

            dispatch({ type: 'restored', conversation })
            if (conversation?.activeRunId) {
              void connectRun(conversation.activeRunId, 0)
            }
          } catch (restoreError) {
            dispatch({
              type: 'failed',
              message: messageForStatus(statusOf(restoreError)),
            })
          }
          return false
        }

        if (status === 503) {
          dispatch({ type: 'disabled', message: messageForStatus(status) })
        } else {
          dispatch({ type: 'failed', message: messageForStatus(status) })
        }
        return false
      }
    },
    [connectRun],
  )

  const retryConnection = useCallback(() => {
    const runId = stateRef.current.activeRunId
    if (!runId) return
    dispatch({ type: 'clearError' })
    void connectRun(runId, 0)
  }, [connectRun])

  const retryLoad = useCallback(() => {
    loadedRef.current = false
    void load()
  }, [load])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  return {
    state,
    canSubmit: canSubmitSettlementQuestion(state),
    load,
    submit,
    retryConnection,
    retryLoad,
  }
}

export default function SettlementChat() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const {
    state,
    canSubmit,
    load,
    submit,
    retryConnection,
    retryLoad,
  } = useSettlementChat()

  const close = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  const toggle = () => {
    if (open) {
      close()
      return
    }
    setOpen(true)
    void load()
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, open])

  useEffect(() => {
    if (open && canSubmit) {
      window.setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [canSubmit, open])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [open, state.messages, state.stage, state.streamedAnswer])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (await submit(draft)) {
      setDraft('')
    }
  }

  const handleSuggestion = (question: string) => {
    void submit(question)
  }

  const showSuggestions =
    state.phase === 'ready' &&
    state.messages.length === 0 &&
    state.activeRunId === null
  const isWorking =
    state.phase === 'submitting' || state.phase === 'running'
  const composerDisabled = !canSubmit

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-controls="settlement-chat-panel"
        aria-expanded={open}
        aria-label={open ? 'AI 정산 도우미 닫기' : 'AI 정산 도우미 열기'}
        className={[
          'z-[39] ml-auto mb-1 inline-flex h-[38px] items-center justify-center gap-2',
          'rounded-ph-md border border-ph-border bg-ph-surface px-3.5',
          'font-ph text-ph-body-sm font-semibold text-ph-primary',
          'transition-colors hover:border-ph-primary hover:bg-ph-secondary',
          'max-[767px]:fixed max-[767px]:right-4 max-[767px]:bottom-4 max-[767px]:z-[70]',
          'max-[767px]:m-0 max-[767px]:h-[52px] max-[767px]:w-[52px]',
          'max-[767px]:rounded-ph-full max-[767px]:p-0',
          'motion-reduce:transition-none',
        ].join(' ')}
      >
        <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
        <span className="max-[767px]:hidden">AI 정산 도우미</span>
      </button>

      <aside
        id="settlement-chat-panel"
        role="dialog"
        aria-label="AI 정산 도우미"
        aria-hidden={!open}
        className={[
          'fixed top-[66px] right-0 z-[80] flex h-[calc(100vh-66px)]',
          'w-[min(420px,100vw)] flex-col border-l border-ph-border',
          'bg-ph-surface font-ph text-ph-text',
          'transition-transform duration-200 motion-reduce:transition-none',
          'max-[767px]:top-0 max-[767px]:h-dvh max-[767px]:w-screen max-[767px]:border-l-0',
          open
            ? 'visible translate-x-0'
            : 'invisible pointer-events-none translate-x-full',
        ].join(' ')}
      >
        <header className="flex min-h-[72px] items-center gap-3 border-b border-ph-border px-4 py-3.5">
          <span className="relative inline-flex h-[38px] w-[38px] shrink-0 overflow-hidden rounded-ph-md bg-ph-white">
            <Image
              src="/images/settlement-assistant.png"
              alt=""
              fill
              sizes="38px"
              className="object-contain"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-base font-bold">정산 도우미</h2>
            <p className="mt-0.5 text-xs text-ph-text-muted">
              내 상점 · 정산 데이터
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="정산 도우미 닫기"
            className="inline-flex h-11 w-11 items-center justify-center rounded-ph-md text-ph-text-secondary md:h-10 md:w-10 hover:bg-ph-gray-50 hover:text-ph-text"
          >
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </header>

        <div
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-[18px] pb-6"
          aria-live="polite"
          aria-busy={isWorking}
        >
          {state.phase === 'loading' && (
            <StatusRow label="이전 대화를 불러오고 있어요" />
          )}

          {state.messages.length === 0 && state.phase !== 'loading' && (
            <div className="flex w-full">
              <div className="max-w-[88%] rounded-ph-lg border border-ph-border bg-ph-gray-50 px-3.5 py-3 text-ph-body-sm leading-[1.55] break-keep">
                <strong className="mb-1 block">
                  정산과 관련해 무엇을 확인할까요?
                </strong>
                월·주 정산 요약, 기간별 비교, 주간 내역과 지급 상태를
                확인할 수 있어요.
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="grid gap-2" aria-label="추천 질문">
              {SUGGESTIONS.map(({ label, question }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSuggestion(question)}
                  className="flex min-h-[42px] w-full items-center justify-between gap-2.5 rounded-ph-md border border-ph-border bg-ph-surface px-3 py-2.5 text-left text-ph-caption font-semibold text-ph-text-secondary hover:border-ph-primary hover:bg-ph-secondary hover:text-ph-primary"
                >
                  <span>{label}</span>
                  <ChevronRight
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          )}

          {state.messages.map((message) => (
            <div
              key={message.id}
              className={[
                'flex w-full',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              ].join(' ')}
            >
              <div
                className={[
                  'max-w-[88%] whitespace-pre-wrap rounded-ph-lg border px-3.5 py-3',
                  'text-ph-body-sm leading-[1.55] break-keep',
                  message.role === 'user'
                    ? 'border-ph-primary bg-ph-primary text-ph-white'
                    : 'border-ph-border bg-ph-gray-50 text-ph-text',
                ].join(' ')}
              >
                {message.content}
              </div>
            </div>
          ))}

          {state.streamedAnswer && (
            <div className="flex w-full justify-start">
              <div className="max-w-[88%] whitespace-pre-wrap rounded-ph-lg border border-ph-border bg-ph-gray-50 px-3.5 py-3 text-ph-body-sm leading-[1.55] text-ph-text break-keep">
                {state.streamedAnswer}
              </div>
            </div>
          )}

          {state.phase === 'submitting' && (
            <StatusRow label="질문을 전달하고 있어요" />
          )}

          {state.phase === 'running' &&
            state.stage &&
            !state.reconnectAvailable && (
              <StatusRow label={STAGE_LABEL[state.stage]} />
            )}

          {state.error && (
            <div className="rounded-ph-md border border-ph-border bg-ph-gray-50 px-3 py-2.5 text-ph-caption leading-[1.5] text-ph-text-secondary">
              <p>{state.error}</p>
              {state.reconnectAvailable && (
                <button
                  type="button"
                  onClick={retryConnection}
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-ph-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  다시 연결
                </button>
              )}
              {!state.historyLoaded &&
                state.phase === 'ready' &&
                !state.reconnectAvailable && (
                  <button
                    type="button"
                    onClick={retryLoad}
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold text-ph-primary"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    다시 시도
                  </button>
                )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-ph-border px-3.5 pt-3 pb-3.5">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-ph-md border border-ph-border bg-ph-white p-1.5 pl-3 focus-within:border-ph-primary"
          >
            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={2_000}
              disabled={composerDisabled}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                state.phase === 'disabled'
                  ? '현재 정산 도우미를 사용할 수 없어요'
                  : '정산 관련 질문을 입력하세요'
              }
              aria-label="정산 관련 질문 입력"
              className="h-9 min-w-0 flex-1 bg-transparent py-2 text-ph-body-sm text-ph-text outline-none placeholder:text-ph-text-muted disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={composerDisabled || draft.trim().length === 0}
              aria-label="질문 보내기"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-ph-sm bg-ph-primary md:h-9 md:w-9 text-ph-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-1.5 text-center text-[11px] leading-[1.4] text-ph-text-muted">
            {isWorking
              ? '답변을 생성하는 동안에는 새 질문을 보낼 수 없어요.'
              : 'AI 답변은 실제 정산 데이터를 기준으로 생성됩니다.'}
          </p>
        </div>
      </aside>
    </>
  )
}

function StatusRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-ph-md border border-ph-border bg-ph-gray-50 px-3 py-2.5 text-ph-caption text-ph-text-muted">
      <LoaderCircle
        className="h-4 w-4 shrink-0 animate-spin text-ph-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}
