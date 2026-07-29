export const ADMIN_SETTLEMENT_DELIVERIES_CHANGED_EVENT = 'admin-settlement-deliveries-changed'

export function notifyAdminSettlementDeliveriesChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_SETTLEMENT_DELIVERIES_CHANGED_EVENT))
  }
}
