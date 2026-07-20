import type {
  CreateOrderProduct,
  CreateOrderRequest,
  CreateOrderResponseData,
  CreateOrderResult,
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
