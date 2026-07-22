export const ADMIN_SELLER_REGISTERS_CHANGED_EVENT = 'admin-seller-registers-changed'

export function notifyAdminSellerRegistersChanged() {
  window.dispatchEvent(new Event(ADMIN_SELLER_REGISTERS_CHANGED_EVENT))
}
