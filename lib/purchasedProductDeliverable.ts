export interface PurchasedProductDeliverableSource {
  productType: string
  content: string | null
  fileUrl: string | null
  externalUrl: string | null
}

export type Deliverable =
  | { kind: 'text'; value: string }
  | { kind: 'file'; value: string }
  | { kind: 'link'; value: string }
  | null

export function resolveDeliverable(
  detail: PurchasedProductDeliverableSource,
): Deliverable {
  if (detail.productType === 'PPT' || detail.productType === 'EXCEL') {
    return detail.fileUrl ? { kind: 'file', value: detail.fileUrl } : null
  }
  if (detail.productType === 'NOTION') {
    return detail.externalUrl ? { kind: 'link', value: detail.externalUrl } : null
  }
  return detail.content ? { kind: 'text', value: detail.content } : null
}
