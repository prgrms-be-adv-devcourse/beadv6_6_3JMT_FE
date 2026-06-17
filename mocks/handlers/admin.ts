import { http, HttpResponse } from 'msw';
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

// 어드민 정산 내역
const ADMIN_PAYMENTS = [
  { id: 'pay-1', sellerId: 'user-2', sellerName: '프롬트랩', amount: 14700, commission: 1470, netAmount: 13230, month: '2026-06', status: 'settled', settledAt: '2026-07-01T00:00:00.000Z' },
  { id: 'pay-2', sellerId: 'user-3', sellerName: '판매자', amount: 7900, commission: 790, netAmount: 7110, month: '2026-06', status: 'pending', settledAt: null },
  { id: 'pay-3', sellerId: 'user-2', sellerName: '프롬트랩', amount: 9800, commission: 980, netAmount: 8820, month: '2026-05', status: 'settled', settledAt: '2026-06-01T00:00:00.000Z' },
];

// 어드민 판매자 신청 목록
const SELLER_APPLIES: Record<string, { userId: string; userName: string; email: string; categories: string[]; introduction: string; portfolioLink: string; appliedAt: string; status: 'pending' | 'approved' | 'rejected' }> = {
  'apply-1': { userId: 'user-1', userName: '김민서', email: 'kms12782@nangman.cloud', categories: ['writing', 'marketing'], introduction: '전문 카피라이터입니다.', portfolioLink: 'https://portfolio.example.com', appliedAt: '2026-06-10T00:00:00.000Z', status: 'pending' },
};

let ordersStore = [...ADMIN_ORDERS];

export const adminHandlers = [
  // 통계
  http.get(`${BASE}/stats`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const totalUsers = MOCK_USERS.filter((u) => u.role !== 'admin').length;
    const totalProducts = PRODUCTS.length;
    const totalOrders = ordersStore.length;
    const totalRevenue = ordersStore.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.amount, 0);
    return ok({ totalUsers, totalProducts, totalOrders, totalRevenue });
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

  // 유저 역할 변경
  http.put(`${BASE}/users/:id`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { id } = params;
    const body = await request.json() as { role?: string };
    const idx = MOCK_USERS.findIndex((u) => u.id === id);
    if (idx === -1) return ERR.notFound('유저');
    if (body.role === 'buyer' || body.role === 'seller') {
      MOCK_USERS[idx].role = body.role;
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
    let list = [...PRODUCTS];
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
];
