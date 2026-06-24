import { http } from 'msw';
import { MOCK_USERS, SELLER_APPLICATIONS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, okList, ERR, extractToken, getUserIdFromToken } from '../utils';
import { SETTLEMENTS, nextSettlementStatus } from '../data/settlements';

const BASE = '*/api/v1/admin';

function isAdmin(request: Request): boolean {
  const token = extractToken(request);
  const userId = getUserIdFromToken(token);
  const user = MOCK_USERS.find((u) => u.id === userId);
  return user?.role === 'admin';
}

// 어드민 주문 목록 (전체)
const ADMIN_ORDERS = [
  { id: 'order-101', userId: 'user-1', userName: '김민서', productId: '11111111-1111-1111-1111-111111111111', productTitle: '사진 같은 제품 목업 생성기', amount: 5900, status: 'PAID', createdAt: '2026-06-01T00:00:00.000Z' },
  { id: 'order-102', userId: 'user-1', userName: '김민서', productId: '22222222-2222-2222-2222-222222222222', productTitle: '전환율 높이는 랜딩 카피 작성', amount: 4900, status: 'PAID', createdAt: '2026-05-20T00:00:00.000Z' },
  { id: 'order-103', userId: 'user-1', userName: '김민서', productId: '44444444-4444-4444-4444-444444444444', productTitle: '30일 SNS 콘텐츠 캘린더', amount: 3900, status: 'PENDING', createdAt: '2026-04-10T00:00:00.000Z' },
  { id: 'order-201', userId: 'user-2', userName: '프롬트랩', productId: '66666666-6666-6666-6666-666666666666', productTitle: '엑셀 데이터 인사이트 요약', amount: 4900, status: 'REFUNDED', createdAt: '2026-06-10T00:00:00.000Z' },
  { id: 'order-301', userId: 'user-3', userName: '판매자', productId: '33333333-3333-3333-3333-333333333333', productTitle: '리액트 컴포넌트 리팩터링 도우미', amount: 7900, status: 'PAID', createdAt: '2026-06-12T00:00:00.000Z' },
  { id: 'order-401', userId: 'user-4', userName: '이준혁', productId: '55555555-5555-5555-5555-555555555555', productTitle: 'ChatGPT 프롬프트 마스터팩', amount: 9900, status: 'FAILED', createdAt: '2026-06-14T00:00:00.000Z' },
  { id: 'order-501', userId: 'user-5', userName: '박지현', productId: '77777777-7777-7777-7777-777777777777', productTitle: '유튜브 썸네일 카피 생성기', amount: 3900, status: 'CANCELED', createdAt: '2026-06-15T00:00:00.000Z' },
];

// 어드민 판매자 신청 목록
const SELLER_APPLIES: Record<string, { userId: string; userName: string; email: string; categories: string[]; introduction: string; portfolioLink: string; appliedAt: string; status: 'pending' | 'approved' | 'rejected' }> = {
  'apply-1': { userId: 'user-1', userName: '김민서', email: 'kms12782@nangman.cloud', categories: ['writing', 'marketing'], introduction: '전문 카피라이터입니다.', portfolioLink: 'https://portfolio.example.com', appliedAt: '2026-06-10T00:00:00.000Z', status: 'pending' },
};

let ordersStore = [...ADMIN_ORDERS];

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
    const id = String(params.id);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return ERR.notFound('상품');
    product.status = 'active';
    return ok(product);
  }),

  // 상품 거절
  http.put(`${BASE}/products/:id/reject`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const id = String(params.id);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return ERR.notFound('상품');
    product.status = 'review';
    return ok(product);
  }),

  // 판매자 신청 목록
  http.get(`${BASE}/sellers/applies`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const applies = Object.entries(SELLER_APPLIES).map(([id, apply]) => ({ id, ...apply }));
    const extra = Object.entries(SELLER_APPLICATIONS)
      .filter(([uid]) => !applies.find((a) => a.userId === uid))
      .map(([uid, app]) => {
        const user = MOCK_USERS.find((u) => u.id === uid);
        return { id: `apply-${uid}`, userId: uid, userName: user?.name ?? uid, email: user?.email ?? '', categories: app.categories, introduction: app.introduction ?? '', portfolioLink: app.portfolioUrl ?? '', appliedAt: app.submittedAt, status: app.status };
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
    order.status = 'REFUNDED';
    return ok(order);
  }),

  // 정산 내역
  http.get(`${BASE}/payments`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    return ok(SETTLEMENTS);
  }),

  // 정산 상태 전이 (승인/보류/보류취소/취소/지급)
  http.put(`${BASE}/payments/:id/transition`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const body = (await request.json()) as { action?: string };
    const settlement = SETTLEMENTS.find((p) => p.id === id);
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
];
