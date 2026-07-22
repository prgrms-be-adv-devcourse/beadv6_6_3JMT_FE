export interface AdminProduct {
  id: string
  title: string
  seller: string
  model: string
  icon: string
  status?: string
}

export interface AdminProductResponse {
  productId: string
  title: string
  sellerNickname: string
  productType: string
  model?: string
  status: string
}

function displayStatus(status: string): string {
  if (status === 'PENDING_REVIEW') return 'review'
  if (status === 'ON_SALE') return 'active'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'STOPPED') return 'stopped'
  return status.toLowerCase()
}

export function mapAdminProducts(items: AdminProductResponse[]): AdminProduct[] {
  return items.map((item) => ({
    id: item.productId,
    title: item.title,
    seller: item.sellerNickname,
    model: item.model ?? '',
    icon: item.productType,
    status: displayStatus(item.status),
  }))
}
