import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

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
    `${API_BASE}/seller`,
    params,
  )
  return res.data.data
}

export async function getSellerApplyStatus(): Promise<{ status: string }> {
  const res = await api.get<{ success: boolean; data: { status: string }; message: string }>(
    `${API_BASE}/sellers/apply-status`,
  )
  return res.data.data
}

interface SellerBatchItem {
  sellerId: string
  sellerName: string | null
}

const SELLER_BATCH_MAX = 30

export async function getSellerNames(sellerIds: string[]): Promise<Record<string, string | null>> {
  const unique = Array.from(new Set(sellerIds))
  const chunks: string[][] = []
  for (let i = 0; i < unique.length; i += SELLER_BATCH_MAX) {
    chunks.push(unique.slice(i, i + SELLER_BATCH_MAX))
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      api.post<{ success: boolean; data: { sellers: SellerBatchItem[] }; message: string }>(
        `${API_BASE}/sellers/products`,
        { sellerIds: chunk },
      ),
    ),
  )

  const map: Record<string, string | null> = {}
  responses.forEach((res) => {
    res.data.data.sellers.forEach((s) => { map[s.sellerId] = s.sellerName })
  })
  return map
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
