import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'

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
  }>(`${API_BASE}/admin/sellers/register`, { params })
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
    `${API_BASE}/admin/sellers/register/${registerId}/approve`,
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
    `${API_BASE}/admin/sellers/register/${registerId}/reject`,
    { rejectReason },
  )
  return res.data.data
}
