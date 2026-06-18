// 정산(Settlement) 상태머신 + Mock 데이터 (admin/seller 핸들러 공유)

export type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'SETTLEMENT_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_REQUESTED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED';

export interface Settlement {
  id: string;
  sellerId: string;
  sellerName: string;
  shop: string;
  periodStart: string;
  periodEnd: string;
  productCount: number;
  totalAmount: number;
  feeTotalAmount: number;
  refundAmount: number;
  settlementTotalAmount: number;
  status: SettlementStatus;
  calculatedAt: string;
  confirmedAt: string | null;
  paidAt: string | null;
}

// admin/seller 핸들러가 동일 참조를 공유하므로 한쪽 전이가 다른 쪽에도 반영된다
export const SETTLEMENTS: Settlement[] = [
  // ── 대기 (PENDING_APPROVAL) ──
  { id: 'stl-1', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 37, totalAmount: 540000, feeTotalAmount: 81000, refundAmount: 0, settlementTotalAmount: 459000, status: 'PENDING_APPROVAL', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-2', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 22, totalAmount: 320000, feeTotalAmount: 48000, refundAmount: 12000, settlementTotalAmount: 260000, status: 'PENDING_APPROVAL', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  // ── 승인 보류 (SETTLEMENT_ON_HOLD) ──
  { id: 'stl-3', sellerId: 'seller-6', sellerName: '데이터핀', shop: '데이터핀', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 15, totalAmount: 210000, feeTotalAmount: 31500, refundAmount: 0, settlementTotalAmount: 178500, status: 'SETTLEMENT_ON_HOLD', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-4', sellerId: 'seller-12', sellerName: '애널리틱스랩', shop: '애널리틱스랩', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 19, totalAmount: 280000, feeTotalAmount: 42000, refundAmount: 0, settlementTotalAmount: 238000, status: 'SETTLEMENT_ON_HOLD', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  // ── 승인 (APPROVED) ── seller가 지급 신청할 수 있는 상태
  { id: 'stl-5', sellerId: 'seller-5', sellerName: '토크봇', shop: '토크봇 랩', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 41, totalAmount: 610000, feeTotalAmount: 91500, refundAmount: 0, settlementTotalAmount: 518500, status: 'APPROVED', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: null },
  { id: 'stl-6', sellerId: 'seller-11', sellerName: '챗플로우', shop: '챗플로우', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 26, totalAmount: 390000, feeTotalAmount: 58500, refundAmount: 5000, settlementTotalAmount: 326500, status: 'APPROVED', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: '2026-07-02T09:00:00.000Z', paidAt: null },
  // 테스트 seller 계정용 승인 건 (지급 신청 버튼 확인용)
  { id: 'stl-13', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 18, totalAmount: 260000, feeTotalAmount: 39000, refundAmount: 0, settlementTotalAmount: 221000, status: 'APPROVED', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: null },
  { id: 'stl-14', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 31, totalAmount: 450000, feeTotalAmount: 67500, refundAmount: 0, settlementTotalAmount: 382500, status: 'APPROVED', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: '2026-05-02T09:00:00.000Z', paidAt: null },
  // ── 지급 보류 (PAYOUT_ON_HOLD) ──
  { id: 'stl-7', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 28, totalAmount: 430000, feeTotalAmount: 64500, refundAmount: 8000, settlementTotalAmount: 357500, status: 'PAYOUT_ON_HOLD', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: null },
  { id: 'stl-8', sellerId: 'seller-5', sellerName: '토크봇', shop: '토크봇 랩', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 33, totalAmount: 470000, feeTotalAmount: 70500, refundAmount: 0, settlementTotalAmount: 399500, status: 'PAYOUT_ON_HOLD', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: '2026-05-02T09:00:00.000Z', paidAt: null },
  // ── 지급 완료 (PAID) ── 누적 정산 수익 카드 합산 대상
  { id: 'stl-9', sellerId: 'seller-11', sellerName: '챗플로우', shop: '챗플로우', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 33, totalAmount: 500000, feeTotalAmount: 75000, refundAmount: 0, settlementTotalAmount: 425000, status: 'PAID', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: '2026-06-03T09:00:00.000Z' },
  { id: 'stl-10', sellerId: 'seller-6', sellerName: '데이터핀', shop: '데이터핀', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 24, totalAmount: 360000, feeTotalAmount: 54000, refundAmount: 0, settlementTotalAmount: 306000, status: 'PAID', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: '2026-05-02T09:00:00.000Z', paidAt: '2026-05-03T09:00:00.000Z' },
  // 테스트 seller 계정용 지급 완료 건 (누적 정산 수익 카드 확인용)
  { id: 'stl-15', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-03-01', periodEnd: '2026-03-31', productCount: 14, totalAmount: 200000, feeTotalAmount: 30000, refundAmount: 0, settlementTotalAmount: 170000, status: 'PAID', calculatedAt: '2026-04-01T02:00:00.000Z', confirmedAt: '2026-04-02T09:00:00.000Z', paidAt: '2026-04-03T09:00:00.000Z' },
  { id: 'stl-16', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-03-01', periodEnd: '2026-03-31', productCount: 25, totalAmount: 380000, feeTotalAmount: 57000, refundAmount: 0, settlementTotalAmount: 323000, status: 'PAID', calculatedAt: '2026-04-01T02:00:00.000Z', confirmedAt: '2026-04-02T09:00:00.000Z', paidAt: '2026-04-03T09:00:00.000Z' },
  // ── 취소 (CANCELLED) ──
  { id: 'stl-11', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 9, totalAmount: 120000, feeTotalAmount: 18000, refundAmount: 60000, settlementTotalAmount: 42000, status: 'CANCELLED', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-12', sellerId: 'seller-12', sellerName: '애널리틱스랩', shop: '애널리틱스랩', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 12, totalAmount: 160000, feeTotalAmount: 24000, refundAmount: 0, settlementTotalAmount: 136000, status: 'CANCELLED', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
];

// 정산 상태 전이 규칙 (action → 다음 상태). 허용되지 않으면 null
// requestPayout: seller가 승인(APPROVED) 건에 대해 지급을 신청 → PAYOUT_REQUESTED
export function nextSettlementStatus(current: SettlementStatus, action: string): SettlementStatus | null {
  switch (current) {
    case 'PENDING_APPROVAL':
      if (action === 'approve') return 'APPROVED';
      if (action === 'hold') return 'SETTLEMENT_ON_HOLD';
      return null;
    case 'SETTLEMENT_ON_HOLD':
      if (action === 'approve') return 'APPROVED';
      if (action === 'unhold') return 'PENDING_APPROVAL';
      if (action === 'cancel') return 'CANCELLED';
      return null;
    case 'APPROVED':
      if (action === 'requestPayout') return 'PAYOUT_REQUESTED';
      if (action === 'pay') return 'PAID';
      if (action === 'hold') return 'PAYOUT_ON_HOLD';
      if (action === 'cancel') return 'CANCELLED';
      return null;
    case 'PAYOUT_REQUESTED':
      if (action === 'pay') return 'PAID';
      if (action === 'hold') return 'PAYOUT_ON_HOLD';
      if (action === 'cancel') return 'CANCELLED';
      return null;
    case 'PAYOUT_ON_HOLD':
      if (action === 'pay') return 'PAID';
      if (action === 'unhold') return 'APPROVED';
      if (action === 'cancel') return 'CANCELLED';
      return null;
    default:
      return null;
  }
}
