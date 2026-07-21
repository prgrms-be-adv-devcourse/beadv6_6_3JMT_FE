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
    const allRefunded = items.every((it) => it.paymentStatus === 'ALL_REFUNDED');
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
