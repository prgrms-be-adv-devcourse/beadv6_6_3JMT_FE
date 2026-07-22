import api from '@/lib/auth'
import { API_BASE } from '@/lib/apiBase'
import {
  adminActionPath,
  mapAdminSettlementDetail,
  mapAdminSettlementList,
  mapSellerSettlementDetail,
  mapSellerSettlementList,
  type AdminMonthlySettlement,
  type AdminSettlementDetail,
  type SellerMonthlySettlement,
  type SellerSettlementDetail,
  type SettlementAction,
  type SettlementActionType,
  type SettlementDisplayStatus,
  type SettlementListParams,
  type SettlementPage,
  type SettlementStatusCount,
  type WeeklySettlement,
} from '@/lib/settlementContracts'

export type {
  AdminMonthlySettlement,
  AdminSettlementDetail,
  SellerMonthlySettlement,
  SellerSettlementDetail,
  SettlementAction,
  SettlementActionType,
  SettlementDisplayStatus,
  SettlementListParams,
  SettlementPage,
  SettlementStatusCount,
  WeeklySettlement,
}

export const SETTLEMENT_STATUS_LABEL: Record<SettlementDisplayStatus, string> = {
  WAITING: '대기',
  APPROVAL_ON_HOLD: '승인 보류',
  APPROVED: '승인',
  PAYOUT_REQUESTED: '지급 신청',
  PAYOUT_ON_HOLD: '지급 보류',
  PAID: '지급 완료',
  CANCELLED: '취소',
}

export interface SettlementSummaryCard {
  status: SettlementDisplayStatus
  totalAmount: number
  count: number
}

export async function getAdminSettlementSummary(
  settlementMonth?: string,
): Promise<SettlementSummaryCard[]> {
  const res = await api.get(`${API_BASE}/admin/settlements/summary`, {
    params: settlementMonth ? { settlementMonth } : undefined,
  })
  const cards = (res.data?.data?.cards ?? []) as Record<string, unknown>[]
  return cards.map((card) => ({
    status: card.status as SettlementDisplayStatus,
    totalAmount: Number(card.totalAmount ?? 0),
    count: Number(card.count ?? 0),
  }))
}

export async function getAdminSettlements(
  params: SettlementListParams = {},
): Promise<SettlementPage<AdminMonthlySettlement>> {
  const res = await api.get(`${API_BASE}/admin/settlements`, { params })
  return mapAdminSettlementList(res.data?.data)
}

export async function getAdminSettlementDetail(
  sellerId: string,
  settlementMonth: string,
): Promise<AdminSettlementDetail> {
  const res = await api.get(
    `${API_BASE}/admin/settlements/sellers/${sellerId}/months/${settlementMonth}`,
  )
  return mapAdminSettlementDetail(res.data?.data)
}

export type AdminSettlementAction = Exclude<SettlementActionType, 'REQUEST_PAYOUT'>

export async function runAdminSettlementAction(
  settlementId: string,
  action: AdminSettlementAction,
): Promise<void> {
  await api.patch(`${API_BASE}/admin/settlements/${settlementId}/${adminActionPath(action)}`)
}

export interface SellerSettlementSummary {
  totalRevenueAmount: number
  totalSettlementAmount: number
}

export async function getSellerSettlementSummary(): Promise<SellerSettlementSummary> {
  const res = await api.get(`${API_BASE}/sellers/me/settlements/summary`)
  const data = res.data?.data ?? {}
  return {
    totalRevenueAmount: Number(data.totalRevenueAmount ?? 0),
    totalSettlementAmount: Number(data.totalSettlementAmount ?? 0),
  }
}

export async function getSellerSettlements(
  params: SettlementListParams = {},
): Promise<SettlementPage<SellerMonthlySettlement>> {
  const res = await api.get(`${API_BASE}/sellers/me/settlements`, { params })
  return mapSellerSettlementList(res.data?.data)
}

export async function getSellerSettlementDetail(
  settlementMonth: string,
): Promise<SellerSettlementDetail> {
  const res = await api.get(`${API_BASE}/sellers/me/settlements/months/${settlementMonth}`)
  return mapSellerSettlementDetail(res.data?.data)
}

export async function requestSettlementPayout(settlementId: string): Promise<void> {
  await api.patch(`${API_BASE}/sellers/me/settlements/${settlementId}/payout-request`)
}
