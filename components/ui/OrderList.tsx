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
  REFUNDING: { label: '환불 신청 중', className: 'bg-ph-warning-bg text-ph-warning' },
  PARTIAL_REFUNDED: { label: '부분 환불', className: 'bg-[#fdeceb] text-ph-error' },
  ALL_REFUNDED: { label: '환불 완료', className: 'bg-ph-gray-100 text-ph-text-secondary' },
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
  if (item.paymentStatus === 'ALL_REFUNDED') {
    return null;
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
        <span className="text-center">상태</span>
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
              <span className="text-center">
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
                      <div className="text-center">
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
