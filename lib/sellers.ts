import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import { splitUniqueIds } from '@/lib/batchIds'

export interface SellerRegisterRequest {
  categories: string[]
  introduction?: string
  portfolioUrl?: string
  agreedToTerms: boolean
}

export interface SellerRegisterResponse {
  sellerRequestId: string
  status: 'PENDING'
  submittedAt: string
}

export async function registerSeller(params: SellerRegisterRequest): Promise<SellerRegisterResponse> {
  const res = await api.post<{ success: boolean; data: SellerRegisterResponse; message: string }>(
    `${API_BASE}/seller/register`,
    params,
  )
  return res.data.data
}

interface SellerBatchItem {
  sellerId: string
  sellerName: string | null
}

type SellerNamesPath = 'sellers/products' | 'sellers/wishlists' | 'users/order-products'

async function getSellerNamesByPath(
  sellerIds: string[],
  path: SellerNamesPath,
): Promise<Record<string, string | null>> {
  const chunks = splitUniqueIds(sellerIds)
  if (chunks.length === 0) return {}

  const responses = await Promise.all(
    chunks.map((sellerIdsChunk) =>
      api.post<{ success: boolean; data: { sellers: SellerBatchItem[] }; message: string }>(
        `${API_BASE}/${path}`,
        { sellerIds: sellerIdsChunk },
      ),
    ),
  )

  const names: Record<string, string | null> = {}
  responses.forEach((res) => {
    res.data.data.sellers.forEach((seller) => {
      names[seller.sellerId] = seller.sellerName
    })
  })
  return names
}

export function getSellerNames(sellerIds: string[]): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'sellers/products')
}

export function getWishlistSellerNames(
  sellerIds: string[],
): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'sellers/wishlists')
}

export function getOrderProductSellerNames(
  sellerIds: string[],
): Promise<Record<string, string | null>> {
  return getSellerNamesByPath(sellerIds, 'users/order-products')
}

export interface SellerProfile {
  sellerName: string
  profileImageUrl: string | null
}

export async function getSellerProfile(sellerId: string): Promise<SellerProfile | null> {
  try {
    const res = await api.get<{ success: boolean; data: SellerProfile; message: string }>(
      `${API_BASE}/sellers/product`,
      { params: { sellerId } },
    )
    return res.data.data
  } catch {
    return null
  }
}

// GET /api/v2/users/order-product — 구매한 프롬프트 리더(/reader)용 판매자 정보 단건 조회
export async function getOrderProductSellerProfile(sellerId: string): Promise<SellerProfile | null> {
  try {
    const res = await api.get<{ success: boolean; data: SellerProfile; message: string }>(
      `${API_BASE}/users/order-product`,
      { params: { sellerId } },
    )
    return res.data.data
  } catch {
    return null
  }
}
