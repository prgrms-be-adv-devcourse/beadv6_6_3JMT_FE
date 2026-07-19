# 주문 내역 UI (결제 내역 → 주문 내역) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mypage "결제 내역" 탭을 아이템 단위 플랫 테이블(`PaymentTable`)에서 주문 단위 그룹 + 아코디언 펼침 UI(`OrderList`)로 교체하고, 관련 텍스트를 "결제"→"주문"으로 바꾼다.

**Architecture:** `PaymentItem[]`를 `orderId` 기준으로 그룹핑하는 순수 함수(`lib/orderGrouping.ts`)를 새로 만들고, 이를 소비하는 프레젠테이션 컴포넌트(`components/ui/OrderList.tsx`)를 작성한 뒤, `../../app/mypage/page.tsx`의 결제 내역 탭에서 `PaymentTable` 대신 `OrderList`를 사용하도록 교체한다. API, 환불 컨펌 플로우, 탭 id/URL은 변경하지 않는다.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind CSS v4 (`--ph-*` 토큰), `node:test` + `node:assert/strict` (이 저장소의 기존 유닛 테스트 방식, `../../lib/orderAdapters.test.ts` 참고).

## Global Constraints

- `../../app/mypage/page.tsx`의 결제 내역 탭 UI만 교체한다. 탭 id(`payments`)/`TabId`/`VALID_TABS`/URL 쿼리(`?tab=payments`), API(`getPayments`), 환불 컨펌 플로우(`ConfirmDialog` + `handleRefund`)는 변경하지 않는다.
- 백엔드 변경 없음. `PaymentItem[]`(아이템 단위, `orderId` 포함)을 클라이언트에서 그룹핑한다.
- 화면 노출 텍스트만 "결제"→"주문"으로 바꾼다 (탭 라벨, 섹션 타이틀/부제, 빈 상태 문구). 그 외 문구는 그대로 둔다.
- 새 UI는 반드시 `--ph-*` 디자인 토큰 기반 Tailwind 클래스를 쓴다. 원본이 인라인 리터럴로 쓴 값(`#fdeceb`, `rgba(217,45,32,0.10)`)만 예외로 그대로 이식하고, 그 외 임의 색상/HEX는 새로 도입하지 않는다.
- 아이템 행 환불 버튼은 커스텀 버튼을 만들지 않고 `components/ui/Button`(`variant="secondary" size="sm"`)을 재사용한다.
- `'use client'`는 useState/이벤트 핸들러를 쓰는 파일에만 붙인다.
- 스타일은 `--ph-*` 토큰 기반 Tailwind 클래스 우선, `style={{}}` 인라인은 동적 계산값 외에는 쓰지 않는다.
- `PaymentTable`은 이 작업으로 대체되어 다른 곳에서 쓰이지 않게 되면 삭제한다.

---

### Task 1: `groupOrders` 순수 함수

**Files:**
- Create: `lib/orderGrouping.ts`
- Test: `lib/orderGrouping.test.ts`

**Interfaces:**
- Consumes: `PaymentItem` (`types/api/orders.ts:57-68`) — `{ orderId, orderProductId?, paymentId, paymentStatus: 'PAID'|'REFUNDING'|'REFUNDED', downloaded, isRefundable, productType, title, amount, paidAt }`
- Produces: `export type OrderStatus = '결제완료' | '부분 환불' | '전체 환불'`, `export interface GroupedOrder { orderId: string; paidAt: string; amount: number; status: OrderStatus; items: PaymentItem[] }`, `export function groupOrders(payments: PaymentItem[]): GroupedOrder[]` — Task 2의 `OrderList.tsx`가 이 함수와 타입을 그대로 import해서 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/orderGrouping.test.ts` 생성:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

import { groupOrders } from './orderGrouping.ts'
import type { PaymentItem } from '@/types/api/orders'

function item(overrides: Partial<PaymentItem>): PaymentItem {
  return {
    orderId: 'order-1',
    paymentId: 'pay-1',
    paymentStatus: 'PAID',
    downloaded: false,
    isRefundable: true,
    productType: 'PROMPT',
    title: 'Prompt A',
    amount: 5000,
    paidAt: '2026-06-28T10:00:00',
    ...overrides,
  }
}

test('groupOrders: 단일 아이템 주문', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', amount: 9000, paidAt: '2026-06-28T10:00:00' }),
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].orderId, 'ORD-1')
  assert.equal(result[0].amount, 9000)
  assert.equal(result[0].paidAt, '2026-06-28T10:00:00')
  assert.equal(result[0].status, '결제완료')
  assert.equal(result[0].items.length, 1)
})

test('groupOrders: 다중 아이템, 전부 PAID → 결제완료', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'PAID', amount: 4000 }),
  ])

  assert.equal(result.length, 1)
  assert.equal(result[0].amount, 10000)
  assert.equal(result[0].status, '결제완료')
  assert.equal(result[0].items.length, 2)
})

test('groupOrders: 다중 아이템, 일부 REFUNDING → 부분 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDING', amount: 4000 }),
  ])

  assert.equal(result[0].status, '부분 환불')
})

test('groupOrders: 다중 아이템, 일부 REFUNDED → 부분 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'PAID', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDED', amount: 4000 }),
  ])

  assert.equal(result[0].status, '부분 환불')
})

test('groupOrders: 다중 아이템, 전부 REFUNDED → 전체 환불', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1', paymentStatus: 'REFUNDED', amount: 6000 }),
    item({ orderId: 'ORD-1', paymentId: 'pay-2', paymentStatus: 'REFUNDED', amount: 4000 }),
  ])

  assert.equal(result[0].status, '전체 환불')
})

test('groupOrders: 서로 다른 orderId는 별도 그룹으로 유지', () => {
  const result = groupOrders([
    item({ orderId: 'ORD-1', paymentId: 'pay-1' }),
    item({ orderId: 'ORD-2', paymentId: 'pay-2' }),
  ])

  assert.equal(result.length, 2)
  assert.deepEqual(result.map((o) => o.orderId), ['ORD-1', 'ORD-2'])
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --experimental-strip-types --test lib/orderGrouping.test.ts`
Expected: FAIL — `Cannot find module './orderGrouping.ts'` (또는 동일 취지의 module-not-found 에러)

- [ ] **Step 3: `groupOrders` 구현**

`lib/orderGrouping.ts` 생성:

```ts
import type { PaymentItem } from '@/types/api/orders';

export type OrderStatus = '결제완료' | '부분 환불' | '전체 환불';

export interface GroupedOrder {
  orderId: string;
  paidAt: string;
  amount: number;
  status: OrderStatus;
  items: PaymentItem[];
}

export function groupOrders(payments: PaymentItem[]): GroupedOrder[] {
  const grouped = new Map<string, PaymentItem[]>();
  for (const payment of payments) {
    const items = grouped.get(payment.orderId) ?? [];
    items.push(payment);
    grouped.set(payment.orderId, items);
  }

  return Array.from(grouped.entries()).map(([orderId, items]) => {
    const allPaid = items.every((it) => it.paymentStatus === 'PAID');
    const allRefunded = items.every((it) => it.paymentStatus === 'REFUNDED');
    const status: OrderStatus = allPaid ? '결제완료' : allRefunded ? '전체 환불' : '부분 환불';

    return {
      orderId,
      paidAt: items[0].paidAt,
      amount: items.reduce((sum, it) => sum + it.amount, 0),
      status,
      items,
    };
  });
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --experimental-strip-types --test lib/orderGrouping.test.ts`
Expected: `# pass 6`, `# fail 0`

- [ ] **Step 5: 커밋**

```bash
git add lib/orderGrouping.ts lib/orderGrouping.test.ts
git commit -m "feat: 결제 내역 orderId 그룹핑 순수 함수 추가"
```

---

### Task 2: `OrderList` 컴포넌트

**Files:**
- Create: `components/ui/OrderList.tsx`

**Interfaces:**
- Consumes: `groupOrders`, `GroupedOrder` (Task 1, `lib/orderGrouping.ts`) / `PaymentItem` (`../../types/api/orders.ts`) / `Button` (`../../components/ui/Button.tsx` — `variant?: 'solid'|'secondary'`, `size?: 'sm'|'md'|'lg'`, `disabled?`, `onClick?`) / `won` (`../../lib/utils.ts`)
- Produces: `export interface OrderListProps { payments: PaymentItem[]; onRefund: (paymentId: string) => void }`, `export default function OrderList(props: OrderListProps)` — Task 3의 `../../app/mypage/page.tsx`가 `<OrderList payments={payments} onRefund={...} />` 형태로 그대로 사용한다.

- [ ] **Step 1: 컴포넌트 작성**

`components/ui/OrderList.tsx` 생성:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { PaymentItem } from '@/types/api/orders';
import { groupOrders, type GroupedOrder } from '@/lib/orderGrouping';
import Button from './Button';
import { won } from '@/lib/utils';

export interface OrderListProps {
  payments: PaymentItem[];
  onRefund: (paymentId: string) => void;
}

const GRID_COLS = 'grid-cols-[1.4fr_1fr_1fr_1fr_96px]';

const ORDER_STATUS_CLASS: Record<GroupedOrder['status'], string> = {
  '결제완료': 'bg-ph-secondary text-ph-primary',
  '부분 환불': 'bg-[#fdeceb] text-ph-error',
  '전체 환불': 'bg-ph-gray-100 text-ph-text-secondary',
};

const ITEM_STATUS: Record<PaymentItem['paymentStatus'], { label: string; className: string }> = {
  PAID: { label: '결제완료', className: 'bg-ph-secondary text-ph-primary' },
  REFUNDING: { label: '환불 신청 중', className: 'bg-[rgba(217,45,32,0.10)] text-ph-error' },
  REFUNDED: { label: '환불 완료', className: 'bg-ph-gray-100 text-ph-text-secondary' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR');
}

function ItemRefundCell({
  item,
  onRefund,
}: {
  item: PaymentItem;
  onRefund: (paymentId: string) => void;
}) {
  if (item.paymentStatus === 'REFUNDED') {
    return <span className="text-ph-caption text-ph-text-muted">—</span>;
  }
  if (item.paymentStatus === 'REFUNDING') {
    return (
      <Button variant="secondary" size="sm" disabled>
        신청됨
      </Button>
    );
  }
  if (item.isRefundable) {
    return (
      <Button variant="secondary" size="sm" onClick={() => onRefund(item.paymentId)}>
        환불 신청
      </Button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-ph-caption text-ph-text-muted">—</span>
      {item.downloaded && (
        <p
          className="m-0 text-[11px] leading-tight text-ph-error text-right"
          style={{ wordBreak: 'keep-all' }}
        >
          이미 다운로드한 상품은 환불할 수 없습니다.
        </p>
      )}
    </div>
  );
}

export default function OrderList({ payments, onRefund }: OrderListProps) {
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const orders = useMemo(() => groupOrders(payments), [payments]);

  return (
    <div className="bg-ph-surface border border-ph-border rounded-ph-lg overflow-hidden">
      <div
        className={`grid ${GRID_COLS} py-ph-12 px-ph-16 border-b border-ph-border text-ph-caption font-medium text-ph-text-secondary`}
      >
        <span>주문 번호</span>
        <span>주문일</span>
        <span>주문 금액</span>
        <span>상태</span>
        <span />
      </div>
      {orders.map((order) => {
        const isOpen = openOrderId === order.orderId;
        return (
          <div key={order.orderId}>
            <div
              className={`grid ${GRID_COLS} items-center py-4.5 px-ph-16 text-ph-body-sm border-b border-ph-border hover:bg-ph-gray-50 cursor-pointer`}
              onClick={() => setOpenOrderId(isOpen ? null : order.orderId)}
            >
              <span className="font-bold text-ph-text">{order.orderId}</span>
              <span className="text-ph-text-secondary">{formatDate(order.paidAt)}</span>
              <span className="font-bold text-ph-text">{won(order.amount)}</span>
              <span>
                <span
                  className={`inline-block text-ph-caption font-medium px-ph-12 py-ph-4 rounded-ph-full ${ORDER_STATUS_CLASS[order.status]}`}
                >
                  {order.status}
                </span>
              </span>
              <span className="text-right">
                <ChevronDown
                  size={12}
                  className={`inline-block text-ph-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
                />
              </span>
            </div>
            {isOpen && (
              <div className="bg-ph-gray-50">
                {order.items.map((item, i) => {
                  const meta = ITEM_STATUS[item.paymentStatus];
                  return (
                    <div
                      key={item.paymentId}
                      className={`grid ${GRID_COLS} items-center py-3.5 px-ph-16 ${i ? 'border-t border-ph-border' : ''}`}
                    >
                      <div className="col-span-2 pr-3 text-ph-body-sm font-medium">{item.title}</div>
                      <div className="text-ph-body-sm text-ph-text-secondary">{won(item.amount)}</div>
                      <div>
                        <span
                          className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-ph-full ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <ItemRefundCell item={item} onRefund={onRefund} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: `OrderList.tsx` 관련 에러 없음 (기존에 있던 무관한 에러는 무시)

- [ ] **Step 3: 커밋**

```bash
git add components/ui/OrderList.tsx
git commit -m "feat: 주문 단위 아코디언 OrderList 컴포넌트 추가"
```

---

### Task 3: mypage 결제 내역 탭 교체 + 텍스트 변경 + `PaymentTable` 삭제

**Files:**
- Modify: `app/mypage/page.tsx:23` (import), `app/mypage/page.tsx:560` (NAV 라벨), `app/mypage/page.tsx:807-841` (결제 내역 탭 블록)
- Modify: `../../components/CLAUDE.md` (컴포넌트 목록 갱신)
- Delete: `../../components/ui/PaymentTable.tsx`

**Interfaces:**
- Consumes: `OrderList` (Task 2, `components/ui/OrderList.tsx`) — `<OrderList payments={payments} onRefund={(paymentId) => setRefundTargetId(paymentId)} />`

- [ ] **Step 1: import 교체**

`app/mypage/page.tsx:23`에서:

```tsx
import PaymentTable from '@/components/ui/PaymentTable';
```

를 다음으로 교체:

```tsx
import OrderList from '@/components/ui/OrderList';
```

- [ ] **Step 2: NAV 라벨 변경**

`app/mypage/page.tsx:556-562`의 `NAV` 배열에서:

```tsx
  const NAV: { id: TabId; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'profile',   label: '프로필',         icon: User        },
    { id: 'purchased', label: '구매한 프롬프트', icon: ShoppingBag },
    { id: 'wishlist',  label: '찜한 프롬프트',   icon: Heart       },
    { id: 'payments',  label: '결제 내역',       icon: Receipt     },
    { id: 'settings',  label: '설정',            icon: Settings    },
  ];
```

`payments` 항목의 `label`만 교체:

```tsx
  const NAV: { id: TabId; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> }[] = [
    { id: 'profile',   label: '프로필',         icon: User        },
    { id: 'purchased', label: '구매한 프롬프트', icon: ShoppingBag },
    { id: 'wishlist',  label: '찜한 프롬프트',   icon: Heart       },
    { id: 'payments',  label: '주문 내역',       icon: Receipt     },
    { id: 'settings',  label: '설정',            icon: Settings    },
  ];
```

- [ ] **Step 3: 결제 내역 탭 블록 교체**

`app/mypage/page.tsx:807-841`:

```tsx
          {/* ── 결제 내역 탭 ── */}
          {tab === 'payments' && (
            <div>
              <SectionTitle sub="결제한 내역과 환불 상태를 확인하세요.">결제 내역</SectionTitle>
              {loadingPayments ? (
                <TableSkeleton />
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  text="아직 결제 내역이 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <>
                  <PaymentTable
                    payments={payments}
                    showRefundColumn
                    onRefund={(paymentId) => setRefundTargetId(paymentId)}
                  />
                  {paymentsHasNext && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
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
              )}
            </div>
          )}
```

를 다음으로 교체:

```tsx
          {/* ── 주문 내역 탭 ── */}
          {tab === 'payments' && (
            <div>
              <SectionTitle sub="주문한 내역과 환불 상태를 확인하세요.">주문 내역</SectionTitle>
              {loadingPayments ? (
                <TableSkeleton />
              ) : payments.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  text="아직 주문 내역이 없어요."
                  cta="프롬프트 둘러보기"
                  onCta={() => router.push('/browse')}
                />
              ) : (
                <>
                  <OrderList
                    payments={payments}
                    onRefund={(paymentId) => setRefundTargetId(paymentId)}
                  />
                  {paymentsHasNext && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
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
              )}
            </div>
          )}
```

- [ ] **Step 4: `PaymentTable` 참조 없음 확인 후 삭제**

Run: `grep -rn "PaymentTable" --include="*.tsx" --include="*.ts" app components | grep -v node_modules`
Expected: 결과 없음 (모든 참조가 제거됨)

`../../components/ui/PaymentTable.tsx` 삭제:

```bash
git rm components/ui/PaymentTable.tsx
```

- [ ] **Step 5: `../../components/CLAUDE.md` 컴포넌트 목록 갱신**

`../../components/CLAUDE.md`의 `../../components/ui` 현재 목록 표에서:

```
| `PaymentTable` | `payments`, `showRefundColumn`, `onRefund` |
```

를 다음으로 교체:

```
| `OrderList` | `payments`, `onRefund` |
```

- [ ] **Step 6: 타입체크 + 린트**

Run: `npx tsc --noEmit && npx eslint app/mypage/page.tsx components/ui/OrderList.tsx`
Expected: 에러 없음

- [ ] **Step 7: 브라우저에서 원본(`../../order_list.html`) 대비 확인**

Run: `npm run dev`

`/mypage?tab=payments` 접속(로그인 + 결제 내역 존재하는 계정) 후 `../../order_list.html`을 브라우저로 열어 나란히 비교:
- 헤더 행 5열 그리드(주문 번호/주문일/주문 금액/상태/빈 열), 폰트·패딩·구분선
- 주문 행 hover 시 `#fafafa` 배경, 클릭 시 아코디언 펼침 + 쉐브론 180도 회전
- 펼침 패널 배경 `#fafafa`, 아이템 행 2열 병합된 상품명 + 가격 + 상태 배지 + 환불 버튼/문구
- 상태 배지 3종(결제완료/부분 환불/전체 환불) 색상, 아이템 배지 3종(결제완료/환불 신청 중/환불 완료) 색상
- 다른 주문 클릭 시 이전 펼침 닫히는 단일 아코디언 동작
- "더 보기" 클릭 시 새 주문이 그룹에 자동 반영되는지

문제 있으면 수정 후 재확인.

- [ ] **Step 8: 커밋**

```bash
git add app/mypage/page.tsx components/CLAUDE.md
git commit -m "feat: 결제 내역 탭을 주문 단위 OrderList로 교체"
```

---

## Self-Review

**Spec coverage:**
- 아이템→주문 그룹핑 순수 함수 분리(`groupOrders`) — Task 1 ✅
- `GroupedOrder`/`status` 계산 규칙(전부 PAID/전부 REFUNDED/그 외) — Task 1 ✅
- 단일 아코디언(`openOrderId`), 다른 주문 클릭 시 이전 것 닫힘 — Task 2 (`useState<string|null>` + 토글) ✅
- Refund 버튼 → 기존 `Button` 재사용, 커스텀 버튼 제거 — Task 2 (`ItemRefundCell`) ✅
- 아이템 상태별 버튼 분기(REFUNDED/REFUNDING/PAID+환불가능/PAID+환불불가) — Task 2 ✅
- 그리드 `1.4fr 1fr 1fr 1fr 96px`, 아이템명 `col-span-2` — Task 2 (`GRID_COLS`, `col-span-2`) ✅
- 토큰 매핑 표의 모든 색상/패딩/폰트 — Task 2 코드에 전부 반영 ✅
- 텍스트 변경 4곳(탭 라벨/섹션 타이틀/부제/빈 상태) — Task 3 Step 1~3 ✅
- 탭 id/URL/API/환불 플로우 불변 — Task 3에서 해당 코드 손대지 않음 ✅
- 페이지네이션(`handleLoadMorePayments`) 그대로, `useMemo` 재계산 — Task 2 `useMemo(() => groupOrders(payments), [payments])` ✅
- 에러/로딩/빈 상태 기존 로직 재사용 — Task 3에서 `loadingPayments`/`TableSkeleton`/`EmptyState` 그대로 유지 ✅
- `groupOrders` 유닛 테스트(단일/전부 PAID/일부 REFUNDING/일부 REFUNDED/전부 REFUNDED) — Task 1 ✅

**Placeholder scan:** 없음 — 모든 스텝에 실제 코드/명령 포함.

**Type consistency:** `PaymentItem`(`../../types/api/orders.ts`) 필드명이 Task 1의 `groupOrders` 입력과 Task 2의 `OrderList`/`ItemRefundCell` 전체에서 동일(`orderId`, `paymentId`, `paymentStatus`, `downloaded`, `isRefundable`, `amount`, `paidAt`, `title`)하게 쓰임. `GroupedOrder`는 Task 1에서 정의, Task 2에서 그대로 import해 `ORDER_STATUS_CLASS: Record<GroupedOrder['status'], string>`로 사용 — 일치.
