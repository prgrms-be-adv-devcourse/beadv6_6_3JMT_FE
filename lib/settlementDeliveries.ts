import { API_BASE } from '@/lib/apiBase'
import api from '@/lib/auth'
import {
  buildAdminSettlementDeliveryQuery,
  mapAdminSettlementDeliveryPage,
  mapAdminSettlementDeliverySummary,
  type AdminSettlementDelivery,
  type AdminSettlementDeliveryPage,
  type AdminSettlementDeliverySummary,
  type SettlementDeliveryFilter,
} from '@/lib/settlementDeliveryContracts'

const ADMIN_SETTLEMENT_DELIVERIES_PATH = `${API_BASE}/admin/settlements/deliveries`

export async function getAdminSettlementDeliveries(
  filter: SettlementDeliveryFilter,
  identifier: string,
  page: number,
  size: number,
): Promise<AdminSettlementDeliveryPage> {
  const response = await api.get(ADMIN_SETTLEMENT_DELIVERIES_PATH, {
    params: buildAdminSettlementDeliveryQuery(filter, identifier, page, size),
  })

  return mapAdminSettlementDeliveryPage(response.data?.data)
}

export async function getAdminSettlementDeliverySummary(): Promise<AdminSettlementDeliverySummary> {
  const response = await api.get(`${ADMIN_SETTLEMENT_DELIVERIES_PATH}/summary`)
  return mapAdminSettlementDeliverySummary(response.data?.data)
}

export async function retryAdminSettlementDelivery(
  settlementDeliveryId: string,
): Promise<void> {
  await api.post(
    `${ADMIN_SETTLEMENT_DELIVERIES_PATH}/${settlementDeliveryId}/retry`,
  )
}

export type {
  AdminSettlementDelivery,
  AdminSettlementDeliveryPage,
  AdminSettlementDeliverySummary,
  SettlementDeliveryFilter,
}
