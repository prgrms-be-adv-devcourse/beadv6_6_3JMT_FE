# 마이페이지 — 결제 대기 주문 재결제

> 관련: [[2026-07-22-frontend-free-paid-checkout]] (결제 확인/실패 콜백 로직 재사용)

## 배경

주문만 생성되고 결제가 진행되지 않은 주문(`OrderStatus === 'CREATED'`, 마이페이지 표시상 "결제 대기")은
기존에는 "결제 대기" 배지만 표시되고 재결제할 방법이 없었다.

## 결정 사항

- **범위**: `CREATED`(결제 대기) 상태만 대상. `FAILED`(결제 실패)는 이번 스코프 밖.
- **재결제 방식**: 새 주문을 다시 생성하지 않는다. 기존 `orderId`/`amount`를 그대로 사용해
  `payment.requestPayment()`를 호출한다. (백엔드가 기존 CREATED 주문의 orderId를 결제 승인
  대상으로 그대로 받아들이는 것을 전제로 함 — 확인됨)
- **콜백 페이지**: 기존 `/checkout/success`, `/checkout/fail`을 그대로 재사용한다.
  결제 성공 시 `/mypage?tab=purchased`로 이동하는 기존 동작을 그대로 따른다
  (주문 내역 탭이 아닌 구매한 프롬프트 탭으로 이동됨 — 의도된 동작).

## 구현

- `components/ui/OrderList.tsx`
  - 주문 행 전체를 감싸던 `<button>`을 `<div role="button" tabIndex={0}>`로 변경.
    (상태 셀에 실제 `<button>`을 중첩하려면 `button` 안에 `button`을 넣을 수 없어 필요한 수정)
  - `order.status === '결제 대기'`인 경우 상태 배지 대신 "결제하기" 버튼을 렌더링.
    클릭 시 행 토글이 함께 발생하지 않도록 `stopPropagation` 처리.
  - 신규 props: `payingOrderId: string | null`, `onPay: (order: GroupedOrder) => void`.
- `app/mypage/page.tsx`
  - 마운트 시 `loadTossPayments`로 SDK 미리 로드 (checkout 페이지와 동일 패턴).
  - `handlePay(order)`: SDK 준비 → `payment.requestPayment({ orderId: order.orderId, amount: order.amount, orderName: order.titleSummary, successUrl: '/checkout/success', failUrl: '/checkout/fail' })`.
  - 실패 시 `normalizeCheckoutFailure`로 메시지를 정규화해 토스트로 표시.
