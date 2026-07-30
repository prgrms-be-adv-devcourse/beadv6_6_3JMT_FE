export interface SellerBackedProduct {
  sellerId?: string
  seller?: string
}

type SellerNameLookup = typeof import('./sellers').getSellerNames

export async function enrichBrowseProducts<T extends SellerBackedProduct>(
  products: T[],
  getSellerNames: SellerNameLookup,
): Promise<Array<T & { seller: string }>> {
  const sellerIds = products.flatMap((product) =>
    product.sellerId ? [product.sellerId] : [],
  )
  let sellerNames: Record<string, string | null> = {}

  try {
    if (sellerIds.length > 0) {
      sellerNames = await getSellerNames(sellerIds)
    }
  } catch {
    // 판매자 이름 조회 실패가 상품 목록 전체 실패로 번지지 않게 한다.
  }

  return products.map((product) => ({
    ...product,
    seller: sellerNames[product.sellerId ?? '']
      ?? product.seller
      ?? '탈퇴한 판매자',
  }))
}
