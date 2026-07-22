type PreparePaidOrderOptions<TPayment, TOrder> = {
  paymentInstance: TPayment | null
  clientKey: string | undefined
  // eslint-disable-next-line no-unused-vars
  loadPayments: (_clientKey: string) => Promise<TPayment>
  createOrder: () => Promise<TOrder>
}

export type CheckoutStage = 'payment_setup' | 'order_creation' | 'payment_request'

export type CheckoutFailure = {
  stage: CheckoutStage
  status: number | null
  code: string | null
  message: string
}

export class CheckoutStageError extends Error {
  readonly stage: CheckoutStage
  readonly originalError?: unknown

  constructor(
    stage: CheckoutStage,
    message: string,
    originalError?: unknown,
  ) {
    super(message)
    this.name = 'CheckoutStageError'
    this.stage = stage
    this.originalError = originalError
  }
}

export function shouldRequestPayment(totalAmount: number): boolean {
  return totalAmount > 0
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

export function normalizeCheckoutFailure(
  error: unknown,
  fallbackStage: CheckoutStage,
): CheckoutFailure {
  const stagedError = error instanceof CheckoutStageError ? error : null
  const source = stagedError?.originalError ?? error
  const sourceRecord = asRecord(source)
  const response = asRecord(sourceRecord?.response)
  const data = asRecord(response?.data)
  const status = typeof response?.status === 'number' ? response.status : null
  const code = typeof data?.code === 'string' ? data.code : null
  const serverMessage = typeof data?.message === 'string' ? data.message : null
  const localMessage = error instanceof Error ? error.message : null

  return {
    stage: stagedError?.stage ?? fallbackStage,
    status,
    code,
    message:
      serverMessage ??
      (status === 503
        ? '주문 서비스를 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'
        : localMessage ?? '주문 요청을 처리하지 못했습니다.'),
  }
}

export async function preparePaidOrder<TPayment, TOrder>({
  paymentInstance,
  clientKey,
  loadPayments,
  createOrder,
}: PreparePaidOrderOptions<TPayment, TOrder>): Promise<{
  paymentInstance: TPayment
  order: TOrder
}> {
  let readyPayment = paymentInstance

  if (!readyPayment) {
    if (!clientKey) {
      throw new CheckoutStageError('payment_setup', '결제 설정이 완료되지 않았습니다.')
    }

    try {
      readyPayment = await loadPayments(clientKey)
    } catch (error: unknown) {
      throw new CheckoutStageError(
        'payment_setup',
        '결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        error,
      )
    }
  }

  try {
    const order = await createOrder()
    return { paymentInstance: readyPayment, order }
  } catch (error: unknown) {
    throw new CheckoutStageError(
      'order_creation',
      '주문 요청을 처리하지 못했습니다.',
      error,
    )
  }
}
