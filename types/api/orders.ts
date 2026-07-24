export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  hasNext: boolean;
}

export interface ProductInfo {
  id: string;
  orderId?: string;
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
  orderProductId?: string;
  priceLabel?: string;
}

export type OrderStatus =
  | 'CREATED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUND_REQUESTED'
  | 'PARTIAL_REFUNDED'
  | 'ALL_REFUNDED'

export type OrderProductStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_REQUESTED' | 'REFUNDED'

export interface MyOrderItem {
  orderId: string;
  orderProductId?: string;
  productId?: string;
  orderStatus?: OrderStatus | 'PENDING' | 'PAID' | 'CANCELED' | 'REFUNDED';
  orderProductStatus?: OrderProductStatus;
  downloaded: boolean;
  isRefundable: boolean;
  productType?: string | null;
  title?: string;
  model?: string | null;
  rating?: number | null;
  paidAt?: string | null;
  createdAt?: string;
  purchasedAt?: string;
  product?: ProductInfo | null;
}

export interface OrderListProductResponse {
  orderProductId: string;
  productId: string;
  orderProductStatus: OrderProductStatus;
  amount: number;
  isRefundable: boolean;
  downloaded: boolean;
  productType?: string | null;
  title: string;
  model?: string | null;
  rating?: number | null;
}

export interface OrderListResponse {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  products: OrderListProductResponse[];
  paidAt?: string | null;
  createdAt: string;
}

export interface OrderListItem {
  orderId: string;
  orderNumber?: string;
  orderTotalAmount?: number;
  orderProductId: string;
  productId: string;
  amount: number;
  orderStatus: OrderStatus;
  orderProductStatus: OrderProductStatus;
  downloaded: boolean;
  isRefundable: boolean;
  productType?: string | null;
  title: string;
  model?: string | null;
  rating?: number | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface CreateOrderProduct {
  productId: string;
  productTitle: string;
}

export interface CreateOrderRequest {
  products: CreateOrderProduct[];
}

export interface CreateOrderResponseData {
  totalAmount: number;
  order: {
    orderId: string;
  };
}

export interface CreateOrderResult {
  orderId: string;
  totalAmount: number;
}

export type PaymentStatus = 'PAID' | 'REFUNDING' | 'PARTIAL_REFUNDED' | 'ALL_REFUNDED';

export interface PaymentHistoryItem {
  orderId: string;
  paymentId: string;
  paymentStatus: PaymentStatus;
  amount: number;
  paidAt: string;
}

export interface PaymentItem extends Omit<PaymentHistoryItem, 'paymentStatus'> {
  paymentStatus: PaymentStatus;
  orderProductIds: string[];
  downloaded: boolean;
  isRefundable: boolean;
  title: string;
}

export interface AdminOrderSellerSummary {
  sellerId: string;
  sellerNickname: string;
  profileImageUrl: string | null;
  productCount: number;
  orderAmount: number;
}

export interface AdminOrderBuyer {
  buyerId: string;
  buyerName: string;
  email?: string;
  profileImageUrl?: string | null;
}

export interface AdminOrder {
  orderNumber: string;
  sellerCount: number;
  sellers: AdminOrderSellerSummary[];
  buyer: AdminOrderBuyer | null;
  productTitle: string;
  totalOrderCount: number;
  totalOrderAmount: number;
  orderStatus: string;
  createdAt: string;
}

export interface UserSummary {
  userId?: string;
  name?: string;
  profileImageUrl?: string | null;
  // 호환용 옵셔널 필드
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerNickname?: string;
  email?: string;
}

export interface OrderProductSummary {
  seller?: UserSummary | null;
  productTitle: string;
  productAmount: number;
  orderProductStatus: OrderProductStatus | string;
}

export interface AdminOrderListResponse {
  orderNumber: string;
  buyer?: UserSummary | null;
  totalOrderAmount: number;
  orderStatus: string;
  orderedAt?: string;
  createdAt?: string;
  orderProducts?: OrderProductSummary[];
}

export type AdminOrderProductV2 = OrderProductSummary;
export type AdminOrderBuyerV2 = UserSummary;
export type AdminOrderV2 = AdminOrderListResponse;

export interface PageResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  meta: {
    page: number;
    size: number;
    total: number;
    hasNext: boolean;
  };
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  CREATED: '결제 대기',
  COMPLETED: '결제 완료',
  FAILED: '결제 실패',
  REFUND_REQUESTED: '환불 요청',
  PARTIAL_REFUNDED: '부분 환불',
  ALL_REFUNDED: '전체 환불',
};

export const ORDER_PRODUCT_STATUS_LABEL: Record<string, string> = {
  PENDING: '결제 대기',
  PAID: '결제 완료',
  FAILED: '결제 실패',
  REFUND_REQUESTED: '환불 처리 중',
  REFUNDED: '환불 완료',
};


