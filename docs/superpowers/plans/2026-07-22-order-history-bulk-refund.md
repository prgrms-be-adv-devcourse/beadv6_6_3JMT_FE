# Order History Bulk Refund Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 마이페이지 주문 내역에서 환불 가능한 주문상품을 선택하고 선택 개수와 결제 당시 금액을 확인한 뒤 선택 상품만 한 번에 환불 신청할 수 있게 한다.

**Architecture:** Payment Service 결제 목록과 Order Service 주문상품 목록을 페이지에서 함께 조회하고, `lib/orderGrouping.ts`의 순수 어댑터에서 주문 내역 화면 모델로 결합한다. `OrderList`는 펼침과 선택 상태만 소유하고 페이지는 확인 모달, API 요청, 성공 후 서버 상태의 로컬 동기화를 담당한다.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4 Client Components, TypeScript, Tailwind CSS 4, Axios, Node.js `node:test`

## Global Constraints

- 구현 기준 문서는 `docs/superpowers/specs/2026-07-22-order-history-bulk-refund-design.md`다.
- 백엔드 선행 계약은 `docs/payment/order-history-bulk-refund-backend-requirements.md`다.
- `GET /api/v2/orders`의 각 주문상품은 주문 시 확정 금액인 필수 `amount: number`를 반환한다.
- 결제 목록은 Payment Service의 `GET /api/v2/payments?page={page}&size={size}`에서 조회한다.
- 환불 접수는 `POST /api/v2/orders/refunds`에 `{ paymentId, orderProductIds }`를 전송한다.
- 상품 선택 조건은 `orderProductStatus === 'PAID' && isRefundable === true`다.
- 선택 금액 합계는 현재 상품가가 아니라 주문상품의 `amount`로 계산한다.
- 환불 요청 중에는 같은 주문의 체크박스와 환불 버튼을 잠근다.
- 요청 실패 시 선택을 보존하고, 성공 시 선택 상품만 `REFUND_REQUESTED`로 갱신한다.
- 기존 로딩, 빈 상태, 더 보기 페이지네이션, 구매 탭 환불 오버레이를 유지한다.
- 신규 런타임 의존성을 추가하지 않는다.
- Next.js 16.2.9 문서 `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`, `01-app/01-getting-started/05-server-and-client-components.md`, `01-app/01-getting-started/11-css.md`의 Client Component와 Tailwind 규칙을 따른다.
- 현재 추적되지 않은 `docs/superpowers/plans/2026-07-22-frontend-free-paid-checkout.md`는 사용자 작업이므로 수정·스테이징하지 않는다.

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `types/api/orders.ts` | 주문상품별 결제 금액과 서버 결제 상태 계약 정의 |
| `lib/orderGrouping.ts` | 결제와 주문상품 결합, 상태 문구, 선택 합계, 성공 후 상품 상태 갱신 순수 함수 |
| `lib/orderGrouping.test.ts` | 화면 모델과 선택 환불 순수 규칙 검증 |
| `lib/refundContracts.ts` | 선택 환불 요청 경로와 body 생성 |
| `lib/refundContracts.test.ts` | 선택 환불 HTTP 계약 검증 |
| `lib/payments.ts` | 결제 목록 조회와 선택 환불 API 호출 |
| `components/ui/OrderList.tsx` | 주문 아코디언, 상품 체크박스, 합계와 환불 액션 바 렌더링 |
| `app/mypage/page.tsx` | 데이터 조회, 페이지네이션, 확인 모달, 환불 요청과 로컬 상태 동기화 |

---

### Task 1: 주문 내역 화면 모델과 선택 계산

**Files:**

- Modify: `types/api/orders.ts:62-115`
- Modify: `lib/orderGrouping.ts:1-34`
- Modify: `lib/orderGrouping.test.ts:1-100`

**Interfaces:**

- Consumes: `PaymentItem[]`, `OrderListItem[]`, 선택된 `orderProductId[]`
- Produces: `groupOrders(payments, orderItems): GroupedOrder[]`, `getSelectedRefundSummary(items, selectedIds): RefundSelectionSummary`, `markRefundRequested(orderItems, selectedIds): OrderListItem[]`

- [ ] **Step 1: 결합·상태·선택 규칙의 실패 테스트 작성**

`lib/orderGrouping.test.ts`를 다음 테스트로 교체한다.

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getSelectedRefundSummary,
  groupOrders,
  markRefundRequested,
  orderProductStatusLabel,
} from './orderGrouping.ts'
import type { OrderListItem, PaymentItem } from '@/types/api/orders'

function payment(overrides: Partial<PaymentItem> = {}): PaymentItem {
  return {
    orderId: 'order-1',
    paymentId: 'payment-1',
    paymentStatus: 'PAID',
    amount: 15000,
    paidAt: '2026-07-22T10:00:00',
    orderProductIds: ['line-1', 'line-2'],
    downloaded: false,
    isRefundable: true,
    title: '첫 상품 외 1건',
    ...overrides,
  }
}

function orderProduct(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    orderId: 'order-1',
    orderProductId: 'line-1',
    productId: 'product-1',
    amount: 6000,
    orderStatus: 'COMPLETED',
    orderProductStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    productType: 'PROMPT',
    title: 'Spring Boot 코드 리뷰',
    model: 'GPT',
    rating: 4.8,
    paidAt: '2026-07-22T10:00:00',
    createdAt: '2026-07-22T09:58:00',
    ...overrides,
  }
}

test('groupOrders joins products and keeps the payment total', () => {
  const groups = groupOrders(
    [payment()],
    [
      orderProduct(),
      orderProduct({
        orderProductId: 'line-2',
        productId: 'product-2',
        title: 'Spring Boot 테스트 작성',
        amount: 9000,
      }),
    ],
  )

  assert.equal(groups[0].paymentId, 'payment-1')
  assert.equal(groups[0].amount, 15000)
  assert.deepEqual(groups[0].items.map((item) => item.amount), [6000, 9000])
  assert.deepEqual(groups[0].items.map((item) => item.selectable), [true, true])
})

test('groupOrders preserves payment order and allows an empty detail', () => {
  const groups = groupOrders(
    [payment({ orderId: 'order-2', paymentId: 'payment-2' }), payment()],
    [orderProduct()],
  )

  assert.deepEqual(groups.map((group) => group.paymentId), ['payment-2', 'payment-1'])
  assert.deepEqual(groups[0].items, [])
  assert.equal(groups[1].items.length, 1)
})

test('groupOrders maps every payment status', () => {
  const statuses = ['PAID', 'REFUNDING', 'PARTIAL_REFUNDED', 'ALL_REFUNDED'] as const
  const groups = groupOrders(
    statuses.map((paymentStatus, index) => payment({
      orderId: `order-${index}`,
      paymentId: `payment-${index}`,
      paymentStatus,
    })),
    [],
  )

  assert.deepEqual(groups.map((group) => group.status), [
    '결제완료',
    '환불 신청 중',
    '부분 환불',
    '전체 환불',
  ])
})

test('only paid and refundable products are selectable', () => {
  const [group] = groupOrders(
    [payment()],
    [
      orderProduct({ orderProductId: 'selectable' }),
      orderProduct({ orderProductId: 'downloaded', downloaded: true, isRefundable: false }),
      orderProduct({
        orderProductId: 'requested',
        orderProductStatus: 'REFUND_REQUESTED',
        isRefundable: false,
      }),
      orderProduct({
        orderProductId: 'refunded',
        orderProductStatus: 'REFUNDED',
        isRefundable: false,
      }),
    ],
  )

  assert.deepEqual(group.items.map((item) => item.selectable), [true, false, false, false])
  assert.equal(orderProductStatusLabel('PAID'), '결제완료')
  assert.equal(orderProductStatusLabel('REFUND_REQUESTED'), '환불 신청 중')
  assert.equal(orderProductStatusLabel('REFUNDED'), '환불 완료')
  assert.equal(orderProductStatusLabel('PENDING'), '결제 대기')
  assert.equal(orderProductStatusLabel('FAILED'), '결제 실패')
})

test('getSelectedRefundSummary ignores unavailable products', () => {
  const [group] = groupOrders(
    [payment()],
    [
      orderProduct({ orderProductId: 'line-1', amount: 6000 }),
      orderProduct({ orderProductId: 'line-2', amount: 4000 }),
      orderProduct({
        orderProductId: 'line-3',
        amount: 5000,
        orderProductStatus: 'REFUND_REQUESTED',
        isRefundable: false,
      }),
    ],
  )

  assert.deepEqual(
    getSelectedRefundSummary(group.items, ['line-2', 'line-3', 'missing']),
    { count: 1, amount: 4000, orderProductIds: ['line-2'] },
  )
})

test('markRefundRequested updates only accepted products', () => {
  const result = markRefundRequested(
    [orderProduct({ orderProductId: 'line-1' }), orderProduct({ orderProductId: 'line-2' })],
    ['line-2'],
  )

  assert.equal(result[0].orderProductStatus, 'PAID')
  assert.equal(result[0].isRefundable, true)
  assert.equal(result[1].orderProductStatus, 'REFUND_REQUESTED')
  assert.equal(result[1].isRefundable, false)
})
```

- [ ] **Step 2: 테스트를 실행해 새 계약 때문에 실패하는지 확인**

Run:

```bash
node --experimental-strip-types --test lib/orderGrouping.test.ts
```

Expected: `groupOrders` 두 번째 인자, `amount`, 선택 요약 또는 상태 갱신 함수가 없어 FAIL.

- [ ] **Step 3: API 타입과 순수 화면 모델 구현**

`types/api/orders.ts`에서 `OrderListItem`에 `amount: number`를 추가하고 `PaymentHistoryItem.paymentStatus`를 `PaymentStatus`로 확장한다.

```ts
export interface OrderListItem {
  orderId: string;
  orderProductId: string;
  productId: string;
  amount: number;
  orderStatus: OrderStatus;
  orderProductStatus: OrderProductStatus;
  downloaded: boolean;
  isRefundable: boolean;
  productType: string;
  title: string;
  model: string | null;
  rating: number | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentHistoryItem {
  orderId: string;
  paymentId: string;
  paymentStatus: PaymentStatus;
  amount: number;
  paidAt: string;
}
```

`lib/orderGrouping.ts`를 다음 순수 모델로 교체한다.

```ts
import type {
  OrderListItem,
  OrderProductStatus,
  PaymentItem,
  PaymentStatus,
} from '@/types/api/orders';

export type OrderHistoryStatus = '결제완료' | '환불 신청 중' | '부분 환불' | '전체 환불';
export type OrderHistoryProductStatus =
  | '결제완료'
  | '환불 신청 중'
  | '환불 완료'
  | '결제 대기'
  | '결제 실패';

export interface GroupedOrderItem {
  orderProductId: string;
  productId: string;
  title: string;
  amount: number;
  orderProductStatus: OrderProductStatus;
  downloaded: boolean;
  isRefundable: boolean;
  selectable: boolean;
}

export interface GroupedOrder {
  orderId: string;
  paymentId: string;
  paidAt: string;
  amount: number;
  status: OrderHistoryStatus;
  items: GroupedOrderItem[];
}

export interface RefundSelectionSummary {
  count: number;
  amount: number;
  orderProductIds: string[];
}

const ORDER_STATUS_LABEL: Record<PaymentStatus, OrderHistoryStatus> = {
  PAID: '결제완료',
  REFUNDING: '환불 신청 중',
  PARTIAL_REFUNDED: '부분 환불',
  ALL_REFUNDED: '전체 환불',
};

const ORDER_PRODUCT_STATUS_LABEL: Record<OrderProductStatus, OrderHistoryProductStatus> = {
  PENDING: '결제 대기',
  PAID: '결제완료',
  FAILED: '결제 실패',
  REFUND_REQUESTED: '환불 신청 중',
  REFUNDED: '환불 완료',
};

export function orderProductStatusLabel(status: OrderProductStatus): OrderHistoryProductStatus {
  return ORDER_PRODUCT_STATUS_LABEL[status];
}

export function groupOrders(payments: PaymentItem[], orderItems: OrderListItem[]): GroupedOrder[] {
  return payments.map((payment) => ({
    orderId: payment.orderId,
    paymentId: payment.paymentId,
    paidAt: payment.paidAt,
    amount: payment.amount,
    status: ORDER_STATUS_LABEL[payment.paymentStatus],
    items: orderItems
      .filter((item) => item.orderId === payment.orderId)
      .map((item) => ({
        orderProductId: item.orderProductId,
        productId: item.productId,
        title: item.title,
        amount: item.amount,
        orderProductStatus: item.orderProductStatus,
        downloaded: item.downloaded,
        isRefundable: item.isRefundable,
        selectable: item.orderProductStatus === 'PAID' && item.isRefundable,
      })),
  }));
}

export function getSelectedRefundSummary(
  items: GroupedOrderItem[],
  selectedIds: readonly string[],
): RefundSelectionSummary {
  const selected = new Set(selectedIds);
  const selectedItems = items.filter(
    (item) => item.selectable && selected.has(item.orderProductId),
  );
  return {
    count: selectedItems.length,
    amount: selectedItems.reduce((sum, item) => sum + item.amount, 0),
    orderProductIds: selectedItems.map((item) => item.orderProductId),
  };
}

export function markRefundRequested(
  orderItems: OrderListItem[],
  selectedIds: readonly string[],
): OrderListItem[] {
  const selected = new Set(selectedIds);
  return orderItems.map((item) =>
    selected.has(item.orderProductId)
      ? { ...item, orderProductStatus: 'REFUND_REQUESTED', isRefundable: false }
      : item,
  );
}
```

- [ ] **Step 4: 화면 모델 테스트 통과 확인**

Run:

```bash
node --experimental-strip-types --test lib/orderGrouping.test.ts
```

Expected: 모든 결합, 상태, 선택 합계, 로컬 상태 갱신 테스트 PASS.

- [ ] **Step 5: 첫 번째 기능 단위 커밋**

```bash
git add types/api/orders.ts lib/orderGrouping.ts lib/orderGrouping.test.ts
git commit -m "feat: frontend 주문 내역 선택 환불 화면 모델 추가"
```

---

### Task 2: 결제 목록과 선택 환불 HTTP 계약 복원

**Files:**

- Modify: `lib/refundContracts.test.ts:1-11`
- Modify: `lib/refundContracts.ts:1-8`
- Modify: `lib/payments.ts:1-24`
- Verify: `lib/paymentAdapters.test.ts`

**Interfaces:**

- Consumes: 결제 페이지 번호·크기, `paymentId`, 선택된 `orderProductIds`
- Produces: `getPaymentHistory(page, size)`, `requestRefund({ paymentId, orderProductIds })`, `buildRefundRequest(paymentId, orderProductIds)`

- [ ] **Step 1: 선택 환불 요청의 실패 테스트 작성**

`lib/refundContracts.test.ts`를 다음 계약으로 수정한다.

```ts
import assert from 'node:assert/strict'
import test from 'node:test'

import { buildRefundRequest } from './refundContracts.ts'

test('buildRefundRequest sends payment id and only selected order product ids', () => {
  assert.deepEqual(buildRefundRequest('payment-1', ['line-2', 'line-3']), {
    path: '/api/v2/orders/refunds',
    body: {
      paymentId: 'payment-1',
      orderProductIds: ['line-2', 'line-3'],
    },
  })
})
```

- [ ] **Step 2: 기존 order-scoped 경로 때문에 실패하는지 확인**

Run:

```bash
node --experimental-strip-types --test lib/refundContracts.test.ts
```

Expected: 실제 경로가 `/orders/{orderId}/refund`이고 body에 `paymentId`가 없어 FAIL.

- [ ] **Step 3: 환불 계약 수정과 결제 목록 조회 함수 복원**

`lib/refundContracts.ts`를 다음처럼 수정한다.

```ts
import { API_BASE } from './apiBase.ts'

export function buildRefundRequest(paymentId: string, orderProductIds: string[]) {
  return {
    path: `${API_BASE}/orders/refunds`,
    body: { paymentId, orderProductIds },
  }
}
```

`lib/payments.ts`에 결제 목록 조회를 복원하고 환불 인자를 변경한다.

```ts
import api from '@/lib/auth'
import type { PaginationMeta, PaymentHistoryItem } from '@/types/api/orders'
import { API_BASE } from '@/lib/apiBase'
import { buildRefundRequest } from '@/lib/refundContracts'

export async function confirmPayment(params: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<{ paymentId: string }> {
  const res = await api.post(`${API_BASE}/payments/confirm`, params)
  return res.data.data as { paymentId: string }
}

export async function getPaymentHistory(
  page = 1,
  size = 20,
): Promise<{ data: PaymentHistoryItem[]; meta: PaginationMeta }> {
  const res = await api.get(`${API_BASE}/payments`, { params: { page, size } })
  return { data: res.data.data ?? [], meta: res.data.meta }
}

export async function requestRefund(params: {
  paymentId: string
  orderProductIds: string[]
}): Promise<void> {
  const request = buildRefundRequest(params.paymentId, params.orderProductIds)
  await api.post(request.path, request.body)
}
```

- [ ] **Step 4: 환불 계약과 결제 어댑터 회귀 테스트 실행**

Run:

```bash
node --experimental-strip-types --test lib/refundContracts.test.ts lib/paymentAdapters.test.ts
```

Expected: 선택 환불 경로·body와 기존 결제/주문 조합 테스트 PASS.

- [ ] **Step 5: 두 번째 기능 단위 커밋**

```bash
git add lib/refundContracts.ts lib/refundContracts.test.ts lib/payments.ts
git commit -m "fix: frontend 선택 상품 환불 API 계약 복원"
```

---

### Task 3: 주문 목록 체크박스와 일괄 환불 액션 바

**Files:**

- Modify: `components/ui/OrderList.tsx:1-143`
- Test: `lib/orderGrouping.test.ts`

**Interfaces:**

- Consumes: `GroupedOrder[]`, `refundingOrderId`, `onRefund(target)`
- Produces: `RefundTarget`, 접근 가능한 주문 아코디언, 주문별 상품 선택과 선택 합계 UI

- [ ] **Step 1: 순수 선택 계산 테스트가 녹색인지 확인**

Run:

```bash
node --experimental-strip-types --test lib/orderGrouping.test.ts
```

Expected: Task 1의 선택 가능 조건과 선택 합계 테스트 PASS.

- [ ] **Step 2: `OrderList`를 선택형 주문 목록으로 교체**

`components/ui/OrderList.tsx`를 다음 구조로 구현한다.

```tsx
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  getSelectedRefundSummary,
  orderProductStatusLabel,
  type GroupedOrder,
  type GroupedOrderItem,
} from '@/lib/orderGrouping';
import Button from './Button';
import { won } from '@/lib/utils';

export interface RefundTarget {
  paymentId: string;
  orderId: string;
  orderProductIds: string[];
  count: number;
  amount: number;
}

export interface OrderListProps {
  orders: GroupedOrder[];
  refundingOrderId: string | null;
  onRefund: (target: RefundTarget) => void;
}

const GRID_COLS = 'grid-cols-[1.4fr_1fr_1fr_1fr_96px]';

const ORDER_STATUS_CLASS: Record<GroupedOrder['status'], string> = {
  결제완료: 'bg-ph-secondary text-ph-primary',
  '환불 신청 중': 'bg-ph-warning-bg text-ph-warning',
  '부분 환불': 'bg-[#fdeceb] text-ph-error',
  '전체 환불': 'bg-ph-gray-100 text-ph-text-secondary',
};

const ITEM_STATUS_CLASS: Record<GroupedOrderItem['orderProductStatus'], string> = {
  PENDING: 'bg-ph-gray-100 text-ph-text-secondary',
  PAID: 'bg-ph-secondary text-ph-primary',
  FAILED: 'bg-[#fdeceb] text-ph-error',
  REFUND_REQUESTED: 'bg-ph-warning-bg text-ph-warning',
  REFUNDED: 'bg-ph-gray-100 text-ph-text-secondary',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR');
}

function unavailableReason(item: GroupedOrderItem): string {
  if (item.downloaded) return '이미 다운로드한 상품은 환불할 수 없습니다.';
  if (item.orderProductStatus === 'REFUND_REQUESTED') return '환불 신청 중인 상품입니다.';
  if (item.orderProductStatus === 'REFUNDED') return '환불이 완료된 상품입니다.';
  if (item.orderProductStatus === 'PENDING') return '결제가 완료되지 않은 상품입니다.';
  if (item.orderProductStatus === 'FAILED') return '결제에 실패한 상품입니다.';
  return '현재 환불할 수 없는 상품입니다.';
}

export default function OrderList({ orders, refundingOrderId, onRefund }: OrderListProps) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [selectedByOrder, setSelectedByOrder] = useState<Record<string, string[]>>({});

  const toggleSelection = (order: GroupedOrder, orderProductId: string, checked: boolean) => {
    setSelectedByOrder((previous) => {
      const selectableIds = new Set(
        order.items.filter((item) => item.selectable).map((item) => item.orderProductId),
      );
      const current = (previous[order.orderId] ?? []).filter((id) => selectableIds.has(id));
      const next = checked
        ? Array.from(new Set([...current, orderProductId]))
        : current.filter((id) => id !== orderProductId);
      return { ...previous, [order.orderId]: next };
    });
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div
          className={`grid ${GRID_COLS} border-b border-ph-border px-ph-16 py-ph-12 text-ph-caption font-medium text-ph-text-secondary`}
        >
          <span>주문 번호</span>
          <span>주문일</span>
          <span>주문 금액</span>
          <span>상태</span>
          <span />
        </div>

        {orders.map((order) => {
          const isOpen = openOrderId === order.orderId;
          const isRefunding = refundingOrderId === order.orderId;
          const effectiveSelectedIds = (selectedByOrder[order.orderId] ?? []).filter((id) =>
            order.items.some((item) => item.orderProductId === id && item.selectable),
          );
          const selection = getSelectedRefundSummary(order.items, effectiveSelectedIds);
          const hasSelectableItems = order.items.some((item) => item.selectable);
          const panelId = `order-detail-${order.orderId}`;

          return (
            <div key={order.paymentId}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`grid w-full ${GRID_COLS} cursor-pointer items-center border-0 border-b border-ph-border bg-transparent px-ph-16 py-4.5 text-left text-ph-body-sm font-[inherit] hover:bg-ph-gray-50`}
                onClick={() => setOpenOrderId(isOpen ? null : order.orderId)}
              >
                <span className="font-bold text-ph-text">{order.orderId}</span>
                <span className="text-ph-text-secondary">{formatDate(order.paidAt)}</span>
                <span className="font-bold text-ph-text">{won(order.amount)}</span>
                <span>
                  <span
                    className={`inline-block rounded-ph-full px-ph-12 py-ph-4 text-ph-caption font-medium ${ORDER_STATUS_CLASS[order.status]}`}
                  >
                    {order.status}
                  </span>
                </span>
                <span className="text-right">
                  <ChevronDown
                    size={12}
                    aria-hidden="true"
                    className={`inline-block text-ph-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>

              {isOpen && (
                <div id={panelId} className="bg-ph-gray-50" aria-busy={isRefunding}>
                  {order.items.map((item, index) => {
                    const checked = effectiveSelectedIds.includes(item.orderProductId);
                    const reason = item.selectable ? undefined : unavailableReason(item);

                    return (
                      <div
                        key={item.orderProductId}
                        className={`grid ${GRID_COLS} items-center px-ph-16 py-3.5 ${index ? 'border-t border-ph-border' : ''}`}
                      >
                        <div className="col-span-2 pr-3 text-ph-body-sm font-medium">{item.title}</div>
                        <div className="text-ph-body-sm text-ph-text-secondary">{won(item.amount)}</div>
                        <div>
                          <span
                            className={`inline-block rounded-ph-full px-2.5 py-0.5 text-xs font-medium ${ITEM_STATUS_CLASS[item.orderProductStatus]}`}
                          >
                            {orderProductStatusLabel(item.orderProductStatus)}
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <span className="relative inline-flex" title={reason}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!item.selectable || isRefunding}
                              aria-label={`${item.title} 환불 선택${reason ? `, ${reason}` : ''}`}
                              className="size-[18px] cursor-pointer rounded-ph-sm disabled:cursor-not-allowed disabled:appearance-none disabled:border disabled:border-ph-gray-400 disabled:bg-ph-gray-100"
                              style={{ accentColor: 'var(--ph-primary)' }}
                              onChange={(event) =>
                                toggleSelection(order, item.orderProductId, event.target.checked)
                              }
                            />
                            {!item.selectable && (
                              <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-ph-text-secondary"
                              >
                                ×
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {hasSelectableItems && (
                    <div className="flex items-center justify-end gap-3.5 border-t border-ph-border bg-ph-surface px-ph-16 py-ph-12">
                      <span className="text-ph-caption text-ph-text-secondary" aria-live="polite">
                        {selection.count > 0 ? (
                          <>
                            <strong className="font-bold text-ph-text">{selection.count}개</strong> 선택 ·{' '}
                            <strong className="font-bold text-ph-text">{won(selection.amount)}</strong>
                          </>
                        ) : (
                          '환불할 상품을 선택하세요'
                        )}
                      </span>
                      <Button
                        variant="solid"
                        size="sm"
                        disabled={selection.count === 0 || isRefunding}
                        style={{
                          minHeight: 36,
                          padding: '9px 16px',
                          fontSize: 13,
                          ...(selection.count === 0 || isRefunding
                            ? {
                                background: 'var(--ph-border)',
                                color: 'var(--ph-text-secondary)',
                                opacity: 1,
                              }
                            : {}),
                        }}
                        onClick={() =>
                          onRefund({
                            paymentId: order.paymentId,
                            orderId: order.orderId,
                            orderProductIds: selection.orderProductIds,
                            count: selection.count,
                            amount: selection.amount,
                          })
                        }
                      >
                        {isRefunding ? '신청 중...' : '환불 신청'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 컴포넌트 정적 검증 실행**

Run:

```bash
npx eslint components/ui/OrderList.tsx
npx tsc --noEmit
```

Expected: `OrderList.tsx` 자체 ESLint 오류 없음. 페이지가 아직 이전 props를 사용하므로 TypeScript는 `app/mypage/page.tsx`의 `payments` prop에서 FAIL.

- [ ] **Step 4: UI 변경을 다음 페이지 통합 커밋까지 유지**

Task 4가 새 props를 연결해야 전체 타입 검증이 통과하므로 이 단계에서는 커밋하지 않는다.

---

### Task 4: 마이페이지 데이터 조회와 환불 흐름 연결

**Files:**

- Modify: `app/mypage/page.tsx:1-30, 34-55, 229-390, 648-668, 789-800`
- Modify: `components/ui/OrderList.tsx`
- Test: `lib/orderGrouping.test.ts`
- Test: `lib/refundContracts.test.ts`

**Interfaces:**

- Consumes: `getOrders()`, `getPaymentHistory()`, `groupOrders()`, `RefundTarget`, `requestRefund()`
- Produces: 실제 주문 내역 조회, 페이지네이션, 확인 모달, 요청 중 잠금, 성공·실패 상태 동기화

- [ ] **Step 1: import와 페이지 상태를 새 계약으로 변경**

React import와 주문·결제 관련 import를 다음처럼 맞춘다.

```tsx
import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import {
  getPaymentHistory,
  requestRefund as apiRequestRefund,
} from '@/lib/payments';
import { getOrders } from '@/lib/orders';
import { mapOrderToPrompt } from '@/lib/orderAdapters';
import { mapPaymentHistory } from '@/lib/paymentAdapters';
import { groupOrders, markRefundRequested } from '@/lib/orderGrouping';
import type { OrderListItem, PaymentItem as ApiPaymentItem } from '@/types/api/orders';
import OrderList, { type RefundTarget } from '@/components/ui/OrderList';
```

`Prompt`에 주문상품 식별자를 추가한다. 나머지 필드는 현재 정의를 유지한다.

```ts
type Prompt = {
  id: string;
  orderId?: string;
  orderProductId?: string;
  title: string;
  productType: string;
  icon: string;
  model: string;
  amount: number;
  rating: number | string;
  salesCount: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  purchasedAt?: string;
};
```

기존 `refundTargetId`를 제거하고 다음 상태를 추가한다.

```tsx
const [refunds, setRefunds] = useState<Record<string, 'requested' | 'refunded'>>({});
const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);
const [refundingOrderId, setRefundingOrderId] = useState<string | null>(null);
const [purchased, setPurchased] = useState<Prompt[]>([]);
const [orderItems, setOrderItems] = useState<OrderListItem[]>([]);
const [wishlist, setWishlist] = useState<Prompt[]>([]);
const [payments, setPayments] = useState<ApiPaymentItem[]>([]);
const [paymentsPage, setPaymentsPage] = useState(1);
const [paymentsHasNext, setPaymentsHasNext] = useState(false);
const [loadingMorePayments, setLoadingMorePayments] = useState(false);
```

조건부 반환보다 앞에서 화면 모델을 계산한다.

```tsx
const groupedOrders = useMemo(
  () => groupOrders(payments, orderItems),
  [payments, orderItems],
);
```

- [ ] **Step 2: 주문상품과 결제 목록 초기 조회 복원**

로그인 확인 뒤의 기존 `getOrders()` 단독 호출을 다음 코드로 교체한다. 결제 API 실패가 구매 탭 데이터까지 버리지 않도록 두 로딩 결과를 분리한다.

```tsx
getOrders()
  .then((orders) => {
    setOrderItems(orders);
    setPurchased(orders.map(mapOrderToPrompt).filter((item): item is Prompt => item !== null));
    setLoadingPurchased(false);

    return getPaymentHistory(1)
      .then((paymentHistory) => {
        setPayments(mapPaymentHistory(paymentHistory.data, orders));
        setPaymentsPage(1);
        setPaymentsHasNext(paymentHistory.meta.hasNext);
      })
      .catch(() => {})
      .finally(() => setLoadingPayments(false));
  })
  .catch(() => {
    setLoadingPurchased(false);
    setLoadingPayments(false);
  });
```

`fetchUser()`와 찜 목록 조회의 현재 흐름은 유지한다.

- [ ] **Step 3: 선택 상품 환불 요청과 로컬 상태 동기화 구현**

기존 `handleRefund(paymentId)`를 다음 코드로 교체한다.

```tsx
const handleRefund = async () => {
  if (!refundTarget || refundingOrderId) return;

  setRefundingOrderId(refundTarget.orderId);
  try {
    await apiRequestRefund({
      paymentId: refundTarget.paymentId,
      orderProductIds: refundTarget.orderProductIds,
    });

    setOrderItems((previous) =>
      markRefundRequested(previous, refundTarget.orderProductIds),
    );
    setPayments((previous) =>
      previous.map((payment) =>
        payment.paymentId === refundTarget.paymentId
          ? { ...payment, paymentStatus: 'REFUNDING' }
          : payment,
      ),
    );

    const selectedIds = new Set(refundTarget.orderProductIds);
    setRefunds((previous) => {
      const next = { ...previous };
      for (const prompt of purchased) {
        if (prompt.orderProductId && selectedIds.has(prompt.orderProductId)) {
          next[prompt.id] = 'requested';
        }
      }
      return next;
    });
  } catch (error: unknown) {
    const response = (error as { response?: { status?: number } })?.response;
    const messages: Record<number, string> = {
      400: '환불할 상품을 다시 확인해 주세요.',
      403: '본인이 구매한 상품만 환불할 수 있어요.',
      404: '주문 상품을 찾을 수 없어요.',
      409: '이미 다운로드했거나 환불할 수 없는 상품이에요.',
    };
    showToast(messages[response?.status ?? 0] ?? '환불 신청에 실패했어요. 다시 시도해주세요');
  } finally {
    setRefundingOrderId(null);
    setRefundTarget(null);
  }
};
```

성공 시 갱신된 `orderItems`가 선택 상품의 `selectable`을 false로 만들기 때문에 `OrderList`의 유효 선택 계산에서 해당 ID가 제거된다. 실패 시 `orderItems`가 바뀌지 않아 선택이 유지된다.

- [ ] **Step 4: 결제 내역 더 보기 복원**

`NAV` 선언 앞에 다음 함수를 추가한다.

```tsx
const handleLoadMorePayments = async () => {
  if (loadingMorePayments || !paymentsHasNext) return;
  setLoadingMorePayments(true);
  try {
    const nextPage = paymentsPage + 1;
    const { data, meta } = await getPaymentHistory(nextPage);
    setPayments((previous) => [...previous, ...mapPaymentHistory(data, orderItems)]);
    setPaymentsPage(nextPage);
    setPaymentsHasNext(meta.hasNext);
  } catch {
    showToast('주문 내역을 더 불러오지 못했어요. 다시 시도해주세요');
  } finally {
    setLoadingMorePayments(false);
  }
};
```

- [ ] **Step 5: 주문 내역과 확인 모달 렌더링 연결**

주문 내역 탭의 목록 부분을 다음처럼 교체한다.

```tsx
<>
  <OrderList
    orders={groupedOrders}
    refundingOrderId={refundingOrderId}
    onRefund={setRefundTarget}
  />
  {paymentsHasNext && (
    <div className="mt-ph-16 flex justify-center">
      <Button
        variant="secondary"
        onClick={handleLoadMorePayments}
        disabled={loadingMorePayments}
      >
        {loadingMorePayments ? '불러오는 중...' : '더 보기'}
      </Button>
    </div>
  )}
</>
```

환불 확인 모달을 다음처럼 교체한다.

```tsx
<ConfirmDialog
  open={!!refundTarget}
  title="환불 신청"
  description={
    refundTarget ? (
      <>
        선택한 {refundTarget.count}개 상품 · {won(refundTarget.amount)}을 환불 신청합니다.
        <br />
        환불 신청 시 해당 상품을 열람할 수 없습니다.
      </>
    ) : ''
  }
  icon={AlertTriangle}
  iconBg="rgba(217,45,32,0.10)"
  iconColor="var(--ph-red)"
  confirmLabel="환불 신청"
  loading={!!refundTarget && refundingOrderId === refundTarget.orderId}
  onConfirm={handleRefund}
  onCancel={() => setRefundTarget(null)}
/>
```

- [ ] **Step 6: 전체 관련 테스트와 정적 검증 실행**

Run:

```bash
node --experimental-strip-types --test \
  lib/orderGrouping.test.ts \
  lib/refundContracts.test.ts \
  lib/paymentAdapters.test.ts \
  lib/orderAdapters.test.ts
npx eslint app/mypage/page.tsx components/ui/OrderList.tsx lib/orderGrouping.ts lib/payments.ts lib/refundContracts.ts
npx tsc --noEmit
```

Expected: 모든 Node 테스트 PASS, ESLint 오류 없음, TypeScript 오류 없음.

- [ ] **Step 7: UI와 페이지 통합 커밋**

```bash
git add app/mypage/page.tsx components/ui/OrderList.tsx
git commit -m "feat: frontend 주문 내역 선택 환불 UI 적용"
```

---

### Task 5: 빌드와 주문 내역 스모크 검증

**Files:**

- Verify: `app/mypage/page.tsx`
- Verify: `components/ui/OrderList.tsx`
- Verify: `docs/superpowers/specs/2026-07-22-order-history-bulk-refund-design.md`

**Interfaces:**

- Consumes: Task 1-4의 완성된 구현과 백엔드 API
- Produces: 빌드 가능한 프론트엔드와 수동 QA 결과

- [ ] **Step 1: 전체 린트 실행**

Run:

```bash
npm run lint
```

Expected: 종료 코드 0, ESLint 오류 없음.

- [ ] **Step 2: Next.js 프로덕션 빌드 실행**

Run:

```bash
npm run build
```

Expected: Next.js 16.2.9 빌드 성공, `/mypage` 타입 검사 성공.

- [ ] **Step 3: 주문 내역 브라우저 스모크 확인**

Run:

```bash
npm run dev
```

로그인한 테스트 계정으로 `/mypage?tab=payments`에서 다음을 확인한다.

1. 주문 행 하나만 펼쳐지고 키보드 Enter/Space로도 토글된다.
2. 상품별 결제 당시 금액과 상태 배지가 표시된다.
3. `PAID && isRefundable` 상품만 체크된다.
4. 선택 개수와 금액 합계가 즉시 갱신된다.
5. 다른 주문을 열었다 돌아와도 기존 선택이 유지된다.
6. 확인 모달에 선택 개수와 합계가 표시된다.
7. 요청 중 체크박스와 버튼, 모달 닫기가 잠긴다.
8. 성공한 상품만 `환불 신청 중`으로 바뀌고 나머지는 다시 선택할 수 있다.
9. 실패 시 토스트가 표시되고 선택은 유지된다.
10. 720px보다 좁은 화면에서 주문 목록 영역만 가로 스크롤된다.

백엔드 선행 계약이 아직 배포되지 않은 환경에서는 단위 테스트·린트·빌드를 완료 기준으로 사용하고, API 통합 스모크는 `docs/payment/order-history-bulk-refund-backend-requirements.md`의 배포 완료 후 실행한다.

- [ ] **Step 4: 최종 변경 범위 확인**

Run:

```bash
git status --short
git diff --check
git log -3 --oneline
```

Expected: 사용자 소유의 기존 미추적 계획 문서 외에 미커밋 구현 파일이 없고, 공백 오류가 없으며 세 개의 기능 커밋이 확인된다.
