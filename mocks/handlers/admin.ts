import { http } from 'msw';
import { MOCK_USERS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, okList, ERR, extractToken, getUserIdFromToken } from '../utils';
import { SELLER_APPLY_STATUS } from '../data/users';

const BASE = '/api/v1/admin';

function isAdmin(request: Request): boolean {
  const token = extractToken(request);
  const userId = getUserIdFromToken(token);
  const user = MOCK_USERS.find((u) => u.id === userId);
  return user?.role === 'admin';
}

// 어드민 주문 목록 (전체)
const ADMIN_ORDERS = [
  { id: 'order-101', userId: 'user-1', userName: '김민서', productId: 1, productTitle: '사진 같은 제품 목업 생성기', amount: 5900, status: 'paid', createdAt: '2026-06-01T00:00:00.000Z' },
  { id: 'order-102', userId: 'user-1', userName: '김민서', productId: 2, productTitle: '전환율 높이는 랜딩 카피 작성', amount: 4900, status: 'paid', createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'order-103', userId: 'user-1', userName: '김민서', productId: 4, productTitle: '30일 SNS 콘텐츠 캘린더', amount: 3900, status: 'paid', createdAt: '2026-04-10T00:00:00.000Z' },
  { id: 'order-201', userId: 'user-2', userName: '프롬트랩', productId: 6, productTitle: '엑셀 데이터 인사이트 요약', amount: 0, status: 'refunded', createdAt: '2026-06-10T00:00:00.000Z' },
  { id: 'order-301', userId: 'user-3', userName: '판매자', productId: 3, productTitle: '리액트 컴포넌트 리팩터링 도우미', amount: 7900, status: 'paid', createdAt: '2026-06-12T00:00:00.000Z' },
];

// 어드민 정산 내역 (Settlement 상태머신)
type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'SETTLEMENT_ON_HOLD'
  | 'APPROVED'
  | 'PAYOUT_ON_HOLD'
  | 'PAID'
  | 'CANCELLED';

interface Settlement {
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

const ADMIN_PAYMENTS: Settlement[] = [
  // ── 대기 (PENDING_APPROVAL) ──
  { id: 'stl-1', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 37, totalAmount: 540000, feeTotalAmount: 81000, refundAmount: 0, settlementTotalAmount: 459000, status: 'PENDING_APPROVAL', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-2', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 22, totalAmount: 320000, feeTotalAmount: 48000, refundAmount: 12000, settlementTotalAmount: 260000, status: 'PENDING_APPROVAL', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  // ── 승인 보류 (SETTLEMENT_ON_HOLD) ──
  { id: 'stl-3', sellerId: 'seller-6', sellerName: '데이터핀', shop: '데이터핀', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 15, totalAmount: 210000, feeTotalAmount: 31500, refundAmount: 0, settlementTotalAmount: 178500, status: 'SETTLEMENT_ON_HOLD', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-4', sellerId: 'seller-12', sellerName: '애널리틱스랩', shop: '애널리틱스랩', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 19, totalAmount: 280000, feeTotalAmount: 42000, refundAmount: 0, settlementTotalAmount: 238000, status: 'SETTLEMENT_ON_HOLD', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  // ── 승인 (APPROVED) ──
  { id: 'stl-5', sellerId: 'seller-5', sellerName: '토크봇', shop: '토크봇 랩', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 41, totalAmount: 610000, feeTotalAmount: 91500, refundAmount: 0, settlementTotalAmount: 518500, status: 'APPROVED', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: null },
  { id: 'stl-6', sellerId: 'seller-11', sellerName: '챗플로우', shop: '챗플로우', periodStart: '2026-06-01', periodEnd: '2026-06-30', productCount: 26, totalAmount: 390000, feeTotalAmount: 58500, refundAmount: 5000, settlementTotalAmount: 326500, status: 'APPROVED', calculatedAt: '2026-07-01T02:00:00.000Z', confirmedAt: '2026-07-02T09:00:00.000Z', paidAt: null },
  // ── 지급 보류 (PAYOUT_ON_HOLD) ──
  { id: 'stl-7', sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 28, totalAmount: 430000, feeTotalAmount: 64500, refundAmount: 8000, settlementTotalAmount: 357500, status: 'PAYOUT_ON_HOLD', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: null },
  { id: 'stl-8', sellerId: 'seller-5', sellerName: '토크봇', shop: '토크봇 랩', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 33, totalAmount: 470000, feeTotalAmount: 70500, refundAmount: 0, settlementTotalAmount: 399500, status: 'PAYOUT_ON_HOLD', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: '2026-05-02T09:00:00.000Z', paidAt: null },
  // ── 지급 완료 (PAID) ──
  { id: 'stl-9', sellerId: 'seller-11', sellerName: '챗플로우', shop: '챗플로우', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 33, totalAmount: 500000, feeTotalAmount: 75000, refundAmount: 0, settlementTotalAmount: 425000, status: 'PAID', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: '2026-06-02T09:00:00.000Z', paidAt: '2026-06-03T09:00:00.000Z' },
  { id: 'stl-10', sellerId: 'seller-6', sellerName: '데이터핀', shop: '데이터핀', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 24, totalAmount: 360000, feeTotalAmount: 54000, refundAmount: 0, settlementTotalAmount: 306000, status: 'PAID', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: '2026-05-02T09:00:00.000Z', paidAt: '2026-05-03T09:00:00.000Z' },
  // ── 취소 (CANCELLED) ──
  { id: 'stl-11', sellerId: 'user-3', sellerName: '판매자', shop: '판매자샵', periodStart: '2026-04-01', periodEnd: '2026-04-30', productCount: 9, totalAmount: 120000, feeTotalAmount: 18000, refundAmount: 60000, settlementTotalAmount: 42000, status: 'CANCELLED', calculatedAt: '2026-05-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
  { id: 'stl-12', sellerId: 'seller-12', sellerName: '애널리틱스랩', shop: '애널리틱스랩', periodStart: '2026-05-01', periodEnd: '2026-05-31', productCount: 12, totalAmount: 160000, feeTotalAmount: 24000, refundAmount: 0, settlementTotalAmount: 136000, status: 'CANCELLED', calculatedAt: '2026-06-01T02:00:00.000Z', confirmedAt: null, paidAt: null },
];

// 정산 상태 전이 규칙 (action → 다음 상태). 허용되지 않으면 null
function nextSettlementStatus(current: SettlementStatus, action: string): SettlementStatus | null {
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

// 어드민 판매자 신청 목록
const SELLER_APPLIES: Record<string, { userId: string; userName: string; email: string; categories: string[]; introduction: string; portfolioLink: string; appliedAt: string; status: 'pending' | 'approved' | 'rejected' }> = {
  'apply-1': { userId: 'user-1', userName: '김민서', email: 'kms12782@nangman.cloud', categories: ['writing', 'marketing'], introduction: '전문 카피라이터입니다.', portfolioLink: 'https://portfolio.example.com', appliedAt: '2026-06-10T00:00:00.000Z', status: 'pending' },
};

let ordersStore = [...ADMIN_ORDERS];
let settlementSeq = ADMIN_PAYMENTS.length;

export const adminHandlers = [
  // 대시보드 통계 (KPI + 최근 7일 거래량)
  http.get(`${BASE}/stats`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    return ok({
      // KPI 카드 (원본 대시보드 데모 값)
      totalUsers: 48210,
      totalUsersDelta: 3.2,
      newToday: 312,
      newTodayDelta: 12.4,
      monthRevenue: 184320000,
      monthRevenueDelta: 8.7,
      pendingPayout: 23940000,
      pendingPayoutCount: 18,
      // 최근 7일 거래량 (요일 · 날짜 · 거래 건수 · 거래액)
      sales7d: [
        { day: '월', date: '6/8', count: 284, revenue: 5120000 },
        { day: '화', date: '6/9', count: 312, revenue: 5740000 },
        { day: '수', date: '6/10', count: 268, revenue: 4860000 },
        { day: '목', date: '6/11', count: 401, revenue: 7220000 },
        { day: '금', date: '6/12', count: 488, revenue: 9140000 },
        { day: '토', date: '6/13', count: 372, revenue: 6680000 },
        { day: '일', date: '6/14', count: 429, revenue: 7910000 },
      ],
    });
  }),

  // 유저 목록
  http.get(`${BASE}/users`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 20);
    const users = MOCK_USERS.filter((u) => u.role !== 'admin');
    return okList(users, page, size);
  }),

  // 유저 역할/상태 변경
  http.put(`${BASE}/users/:id`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const body = await request.json() as { role?: string; status?: string };
    const idx = MOCK_USERS.findIndex((u) => u.id === id);
    if (idx === -1) return ERR.notFound('유저');
    if (body.role === 'buyer' || body.role === 'seller') {
      MOCK_USERS[idx].role = body.role;
    }
    if (body.status === 'active' || body.status === 'suspended' || body.status === 'withdrawn') {
      MOCK_USERS[idx].status = body.status;
    }
    return ok(MOCK_USERS[idx]);
  }),

  // 상품 목록 (전체)
  http.get(`${BASE}/products`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 20);
    const status = url.searchParams.get('status');
    // status 미지정 상품은 게시중(active)으로 정규화
    let list = PRODUCTS.map((p) => ({ ...p, status: p.status ?? 'active' }));
    if (status) list = list.filter((p) => p.status === status);
    return okList(list, page, size);
  }),

  // 상품 승인
  http.put(`${BASE}/products/:id/approve`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const id = Number(params.id);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return ERR.notFound('상품');
    product.status = 'active';
    return ok(product);
  }),

  // 상품 거절
  http.put(`${BASE}/products/:id/reject`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const id = Number(params.id);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return ERR.notFound('상품');
    product.status = 'review';
    return ok(product);
  }),

  // 판매자 신청 목록
  http.get(`${BASE}/sellers/applies`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const applies = Object.entries(SELLER_APPLIES).map(([id, apply]) => ({ id, ...apply }));
    // SELLER_APPLY_STATUS에 있는 pending 신청자도 포함
    const extra = Object.entries(SELLER_APPLY_STATUS)
      .filter(([uid]) => !applies.find((a) => a.userId === uid))
      .map(([uid, status]) => {
        const user = MOCK_USERS.find((u) => u.id === uid);
        return { id: `apply-${uid}`, userId: uid, userName: user?.name ?? uid, email: user?.email ?? '', categories: [], introduction: '', portfolioLink: '', appliedAt: new Date().toISOString(), status };
      });
    return ok([...applies, ...extra]);
  }),

  // 판매자 승인
  http.put(`${BASE}/sellers/:id/approve`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params as { id: string };
    if (SELLER_APPLIES[id]) {
      SELLER_APPLIES[id].status = 'approved';
      const userIdx = MOCK_USERS.findIndex((u) => u.id === SELLER_APPLIES[id].userId);
      if (userIdx !== -1) MOCK_USERS[userIdx].role = 'seller';
    }
    return ok({ id, status: 'approved' });
  }),

  // 판매자 거절
  http.put(`${BASE}/sellers/:id/reject`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params as { id: string };
    if (SELLER_APPLIES[id]) SELLER_APPLIES[id].status = 'rejected';
    return ok({ id, status: 'rejected' });
  }),

  // 주문 목록 (전체)
  http.get(`${BASE}/orders`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 20);
    return okList(ordersStore, page, size);
  }),

  // 주문 환불
  http.put(`${BASE}/orders/:id/refund`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const order = ordersStore.find((o) => o.id === id);
    if (!order) return ERR.notFound('주문');
    order.status = 'refunded';
    return ok(order);
  }),

  // 정산 내역
  http.get(`${BASE}/payments`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    return ok(ADMIN_PAYMENTS);
  }),

  // 정산 상태 전이 (승인/보류/보류취소/취소/지급)
  http.put(`${BASE}/payments/:id/transition`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const body = (await request.json()) as { action?: string };
    const settlement = ADMIN_PAYMENTS.find((p) => p.id === id);
    if (!settlement) return ERR.notFound('정산');
    const action = body.action ?? '';
    const next = nextSettlementStatus(settlement.status, action);
    if (!next) return ERR.validation(`'${settlement.status}' 상태에서 '${action}' 동작은 허용되지 않습니다.`);
    settlement.status = next;
    const now = new Date().toISOString();
    if (next === 'APPROVED' && !settlement.confirmedAt) settlement.confirmedAt = now;
    if (next === 'PAID') settlement.paidAt = now;
    return ok(settlement);
  }),

  // 정산 재산정 (취소된 건 → 같은 판매자/기간으로 새 대기 건 생성, 취소 건은 이력 보존)
  http.post(`${BASE}/payments/:id/recalculate`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const src = ADMIN_PAYMENTS.find((p) => p.id === id);
    if (!src) return ERR.notFound('정산');
    if (src.status !== 'CANCELLED') return ERR.validation('취소된 정산 건만 재산정할 수 있습니다.');
    const next: Settlement = {
      ...src,
      id: `stl-${++settlementSeq}`,
      status: 'PENDING_APPROVAL',
      calculatedAt: new Date().toISOString(),
      confirmedAt: null,
      paidAt: null,
    };
    ADMIN_PAYMENTS.push(next);
    return ok(next);
  }),
];
