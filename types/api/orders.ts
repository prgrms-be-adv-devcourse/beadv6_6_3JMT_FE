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
  productType?: string;
  title?: string;
  model?: string | null;
  rating?: number | null;
  paidAt?: string | null;
  createdAt?: string;
  purchasedAt?: string;
  product?: ProductInfo | null;
}

export interface OrderListItem {
  orderId: string;
  orderProductId: string;
  productId: string;
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
  paymentStatus: Exclude<PaymentStatus, 'REFUNDING'>;
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
  productCount: number;
  orderAmount: number;
}

export interface AdminOrder {
  orderId: string;
  sellerCount: number;
  sellers: AdminOrderSellerSummary[];
  productTitle: string;
  totalOrderCount: number;
  totalOrderAmount: number;
  orderStatus: string;
  createdAt: string;
}
