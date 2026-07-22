import type {
  CreateOrderProduct,
  CreateOrderRequest,
  CreateOrderResponseData,
  CreateOrderResult,
  OrderListItem,
  OrderListResponse,
} from '../types/api/orders'

export function buildCreateOrderRequest(products: CreateOrderProduct[]): CreateOrderRequest {
  return { products }
}

export function mapCreateOrderResponse(data: CreateOrderResponseData): CreateOrderResult {
  return {
    orderId: data.order.orderId,
    totalAmount: data.totalAmount,
  }
}

export function mapOrderListResponse(orders: OrderListResponse[]): OrderListItem[] {
  return orders.flatMap((order) => order.products.map((product) => ({
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderTotalAmount: order.totalAmount,
    orderProductId: product.orderProductId,
    productId: product.productId,
    amount: product.amount,
    orderStatus: order.orderStatus,
    orderProductStatus: product.orderProductStatus,
    downloaded: product.downloaded,
    isRefundable: product.isRefundable,
    productType: product.productType,
    title: product.title,
    model: product.model,
    rating: product.rating,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
  })))
}
