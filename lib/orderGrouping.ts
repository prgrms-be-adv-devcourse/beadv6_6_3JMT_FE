import type {
  OrderListItem,
  OrderStatus,
  OrderProductStatus,
} from '@/types/api/orders';

export type OrderHistoryStatus =
  | '결제 대기'
  | '결제완료'
  | '결제 실패'
  | '환불 신청 중'
  | '부분 환불'
  | '전체 환불';
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
  orderNumber?: string;
  titleSummary: string;
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

const ORDER_STATUS_LABEL: Record<OrderStatus, OrderHistoryStatus> = {
  CREATED: '결제 대기',
  COMPLETED: '결제완료',
  FAILED: '결제 실패',
  REFUND_REQUESTED: '환불 신청 중',
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

export function groupOrders(orderItems: OrderListItem[]): GroupedOrder[] {
  const itemsByOrder = new Map<string, OrderListItem[]>();

  orderItems.forEach((item) => {
    const items = itemsByOrder.get(item.orderId) ?? [];
    items.push(item);
    itemsByOrder.set(item.orderId, items);
  });

  return Array.from(itemsByOrder.values()).map((items) => {
    const first = items[0];
    const paidAt = items.find((item) => item.paidAt)?.paidAt ?? first.createdAt;
    const firstTitle = first.title || '주문 상품';
    const titleSummary = items.length > 1 ? `${firstTitle} 외 ${items.length - 1}건` : firstTitle;
    const orderNumber = (first as unknown as { orderNumber?: string }).orderNumber;

    return {
      orderId: first.orderId,
      orderNumber,
      titleSummary,
      paidAt,
      amount: items.reduce((sum, item) => {
        const amt = Number.isFinite(item.amount) ? item.amount : 0;
        return sum + amt;
      }, 0),
      status: ORDER_STATUS_LABEL[first.orderStatus] ?? '결제 대기',
      items: items.map((item) => ({
        orderProductId: item.orderProductId,
        productId: item.productId,
        title: item.title,
        amount: Number.isFinite(item.amount) ? item.amount : 0,
        orderProductStatus: item.orderProductStatus,
        downloaded: item.downloaded,
        isRefundable: item.isRefundable,
        selectable: item.orderProductStatus === 'PAID' && item.isRefundable,
      })),
    };
  });
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
  const requestedOrderIds = new Set(
    orderItems
      .filter((item) => selected.has(item.orderProductId))
      .map((item) => item.orderId),
  );

  return orderItems.map((item) => ({
    ...item,
    ...(requestedOrderIds.has(item.orderId) ? { orderStatus: 'REFUND_REQUESTED' as const } : {}),
    ...(selected.has(item.orderProductId)
      ? { orderProductStatus: 'REFUND_REQUESTED' as const, isRefundable: false }
      : {}),
  }));
}
