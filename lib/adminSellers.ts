import api from '@/lib/auth'

export type SellerRegister = {
  registerId: string
  userId: string
  name: string
  email: string
  introduction: string | null
  categories: string[]
  portfolioUrl: string | null
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

export interface GetSellerRegistersParams {
  page?: number
  size?: number
  status?: 'pending' | 'approved' | 'rejected' | 'ALL'
}

export interface GetSellerRegistersResponse {
  data: SellerRegister[]
  meta: {
    page: number
    size: number
    total: number
    hasNext: boolean
  }
}

export async function getSellerRegisters(
  params?: GetSellerRegistersParams,
): Promise<GetSellerRegistersResponse> {
  const res = await api.get<{
    success: boolean
    data: SellerRegister[]
    message: string
    meta: GetSellerRegistersResponse['meta']
  }>('/api/v1/admin/sellers/register', { params })
  return { data: res.data.data, meta: res.data.meta }
}

export type ApproveSellerRegisterResponse = {
  registerId: string
  userId: string
  status: string
  reviewedAt: string
}

export async function approveSellerRegister(registerId: string): Promise<ApproveSellerRegisterResponse> {
  const res = await api.patch<{ success: boolean; data: ApproveSellerRegisterResponse; message: string }>(
    `/api/v1/admin/sellers/register/${registerId}/approve`,
  )
  return res.data.data
}

export type RejectSellerRegisterResponse = {
  registerId: string
  userId: string
  status: string
  rejectReason: string
  reviewedAt: string
}

export async function rejectSellerRegister(
  registerId: string,
  rejectReason: string,
): Promise<RejectSellerRegisterResponse> {
  const res = await api.patch<{ success: boolean; data: RejectSellerRegisterResponse; message: string }>(
    `/api/v1/admin/sellers/register/${registerId}/reject`,
    { rejectReason },
  )
  return res.data.data
}

export interface SellerApply {
  id: string
  userId: string
  userName: string
  email: string
  categories: string[]
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export async function getAdminSellerApplies(): Promise<SellerApply[]> {
  const res = await api.get<{ success: boolean; data: SellerApply[]; message: string }>(
    '/api/v1/admin/sellers/applies',
  )
  return res.data.data
}

export async function approveSellerApply(id: string): Promise<void> {
  await api.put(`/api/v1/admin/sellers/${id}/approve`, {})
}

export async function rejectSellerApply(id: string): Promise<void> {
  await api.put(`/api/v1/admin/sellers/${id}/reject`, {})
}
