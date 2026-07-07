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

export interface MyOrderItem {
  orderId: string;
  orderProductId?: string;
  productId?: string;
  orderStatus?: string;
  downloaded: boolean;
  isRefundable: boolean;
  productType?: string;
  title?: string;
  model?: string | null;
  rating?: number | null;
  paidAt?: string | null;
  createdAt?: string;
  purchasedAt?: string;
  product: ProductInfo | null;
}

export interface CreateOrderResult {
  orderId: string;
}

export type PaymentStatus = 'PAID' | 'REFUNDING' | 'REFUNDED';

export interface PaymentItem {
  orderId: string;
  orderProductId?: string;
  paymentId: string;
  paymentStatus: PaymentStatus;
  downloaded: boolean;
  isRefundable: boolean;
  productType: string;
  title: string;
  amount: number;
  paidAt: string;
}

export interface AdminOrder {
  orderId: string;
  sellerNickname: string;
  productTitle: string;
  totalOrderCount: number;
  totalOrderAmount: number;
  orderStatus: string;
  createdAt: string;
}
