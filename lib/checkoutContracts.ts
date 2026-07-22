type PreparePaidOrderOptions<TPayment, TOrder> = {
  paymentInstance: TPayment | null
  clientKey: string | undefined
  // eslint-disable-next-line no-unused-vars
  loadPayments: (_clientKey: string) => Promise<TPayment>
  createOrder: () => Promise<TOrder>
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
      throw new Error('결제 설정이 완료되지 않았습니다.')
    }

    try {
      readyPayment = await loadPayments(clientKey)
    } catch {
      throw new Error('결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  const order = await createOrder()
  return { paymentInstance: readyPayment, order }
}
