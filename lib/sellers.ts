import api from '@/lib/auth'

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
    '/api/v1/seller',
    params,
  )
  return res.data.data
}

export async function getSellerApplyStatus(): Promise<{ status: string }> {
  const res = await api.get<{ success: boolean; data: { status: string }; message: string }>(
    '/api/v1/sellers/apply-status',
  )
  return res.data.data
}
