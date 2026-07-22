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

const GRID_COLS = 'grid-cols-[2fr_1fr_1fr_1fr_40px]';

const ORDER_STATUS_CLASS: Record<GroupedOrder['status'], string> = {
  '결제 대기': 'bg-ph-gray-100 text-ph-text-secondary',
  결제완료: 'bg-ph-secondary text-ph-primary',
  '결제 실패': 'bg-[#fdeceb] text-ph-error',
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
          <span>주문 상품 / 번호</span>
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
          const displayOrderNumber = order.orderNumber ?? order.orderId;

          return (
            <div key={order.orderId}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`grid w-full ${GRID_COLS} cursor-pointer items-center border-0 border-b border-ph-border bg-transparent px-ph-16 py-4.5 text-left text-ph-body-sm font-[inherit] hover:bg-ph-gray-50`}
                onClick={() => setOpenOrderId(isOpen ? null : order.orderId)}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-bold text-ph-text truncate" title={order.titleSummary}>
                    {order.titleSummary}
                  </span>
                  <span className="text-xs text-ph-text-muted truncate mt-0.5" title={displayOrderNumber}>
                    {displayOrderNumber}
                  </span>
                </div>
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
