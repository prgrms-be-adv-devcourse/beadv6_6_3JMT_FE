import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

export interface PurchasedProductDetail {
  productId: string
  title: string
  productType: string
  model: string | null
  content: string | null
  fileUrl: string | null
  externalUrl: string | null
  thumbnailUrl: string | null
  sellerId: string
  averageRating: number
  myRating: number | null
}

// GET /api/v2/products/{productId}/orders — 구매한 상품 reader 데이터 조회 (#550)
export async function getPurchasedProduct(productId: string): Promise<PurchasedProductDetail> {
  const res = await api.get<{ success: boolean; data: PurchasedProductDetail; message: string }>(
    `${API_BASE}/products/${productId}/orders`,
  )
  return res.data.data
}

export type Deliverable =
  | { kind: 'text'; value: string }
  | { kind: 'file'; value: string }
  | { kind: 'link'; value: string }
  | null

// 유형별 산출물 해석: PROMPT=본문, PPT·EXCEL=presigned 파일 URL, NOTION=외부 링크
export function resolveDeliverable(
  detail: Pick<PurchasedProductDetail, 'productType' | 'content' | 'fileUrl' | 'externalUrl'>,
): Deliverable {
  if (detail.productType === 'PPT' || detail.productType === 'EXCEL') {
    return detail.fileUrl ? { kind: 'file', value: detail.fileUrl } : null
  }
  if (detail.productType === 'NOTION') {
    return detail.externalUrl ? { kind: 'link', value: detail.externalUrl } : null
  }
  return detail.content ? { kind: 'text', value: detail.content } : null
}
