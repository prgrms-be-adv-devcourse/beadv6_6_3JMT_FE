import { http, HttpResponse } from 'msw';
import { MOCK_USERS, SELLER_APPLICATIONS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, okList, ERR, extractToken, getUserIdFromToken } from '../utils';
import {
  SETTLEMENTS,
  nextSettlementStatus,
  type Settlement,
  type SettlementDisplayStatus,
} from '../data/settlements';

const BASE = '*/api/v1/admin';

function isAdmin(request: Request): boolean {
  const token = extractToken(request);
  const userId = getUserIdFromToken(token);
  const user = MOCK_USERS.find((u) => u.id === userId);
  return user?.role === 'admin';
}

/* ── 정산 서비스 응답 헬퍼 ──
   정산 서비스는 공통 { success, data } 봉투 없이 본문을 직접 내려준다.
   금액(BigDecimal)은 문자열로 직렬화된다. */
const SETTLEMENT_ORDER: SettlementDisplayStatus[] = [
  'WAITING', 'APPROVAL_ON_HOLD', 'APPROVED', 'PAYOUT_REQUESTED', 'PAYOUT_ON_HOLD', 'PAID', 'CANCELLED',
];
const dec = (n: number) => n.toFixed(2);
// 정산 서비스 ErrorResponse 형식 { code, message }
const sErr = (code: string, message: string, status: number) =>
  HttpResponse.json({ code, message }, { status });

function toAdminSettlementItem(s: Settlement) {
  return {
    settlementId: s.id,
    sellerId: s.sellerId,
    sellerName: s.sellerName,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    productCount: s.productCount,
    totalAmount: dec(s.totalAmount),
    feeTotalAmount: dec(s.feeTotalAmount),
    settlementTotalAmount: dec(s.settlementTotalAmount),
    displayStatus: s.status,
    calculatedAt: s.calculatedAt,
  };
}

// displayStatus → 내부 SettlementStatus / PayoutStatus (상태 변경 응답 참고용)
function toInternalStatus(d: SettlementDisplayStatus): { settlementStatus: string; payoutStatus: string } {
  switch (d) {
    case 'WAITING': return { settlementStatus: 'PENDING_APPROVAL', payoutStatus: 'NOT_READY' };
    case 'APPROVAL_ON_HOLD': return { settlementStatus: 'SETTLEMENT_ON_HOLD', payoutStatus: 'NOT_READY' };
    case 'APPROVED': return { settlementStatus: 'APPROVED', payoutStatus: 'READY' };
    case 'PAYOUT_REQUESTED': return { settlementStatus: 'APPROVED', payoutStatus: 'PAYOUT_REQUESTED' };
    case 'PAYOUT_ON_HOLD': return { settlementStatus: 'APPROVED', payoutStatus: 'PAYOUT_ON_HOLD' };
    case 'PAID': return { settlementStatus: 'APPROVED', payoutStatus: 'PAID' };
    case 'CANCELLED': return { settlementStatus: 'CANCELLED', payoutStatus: 'NOT_READY' };
  }
}

function statusResponse(s: Settlement) {
  const { settlementStatus, payoutStatus } = toInternalStatus(s.status);
  return {
    settlementId: s.id,
    settlementStatus,
    payoutStatus,
    displayStatus: s.status,
    confirmedAt: s.confirmedAt,
    paidAt: s.paidAt,
    payoutReference: s.status === 'PAID' ? `PR-${s.id}` : null,
    failureReason: null,
    updatedAt: new Date().toISOString(),
  };
}

// 관리자 상태 전이 공통 처리 (action → 상태 변경 후 SettlementStatusResponse 반환)
function applyAdminAction(request: Request, id: string, action: string) {
  if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
  const settlement = SETTLEMENTS.find((s) => s.id === id);
  if (!settlement) return sErr('S-010', '정산을 찾을 수 없습니다.', 404);
  const next = nextSettlementStatus(settlement.status, action);
  if (!next) return sErr('S-013', '현재 상태에서 변경할 수 없는 정산입니다.', 409);
  settlement.status = next;
  const now = new Date().toISOString();
  if (next === 'APPROVED' && !settlement.confirmedAt) settlement.confirmedAt = now;
  if (next === 'PAID') settlement.paidAt = now;
  return ok(statusResponse(settlement)); // 실제 백엔드처럼 ApiResult 봉투로 응답
}

// 정산 배치잡(수동 정산) 모의 — jobExecutionId로 상태 추적. 실행 즉시 COMPLETED 처리
let settlementJobSeq = 1000;
const SETTLEMENT_JOBS = new Map<number, { period: string; startTime: string }>();

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

// 어드민 판매자 신청 목록 (기존 핸들러용)
const SELLER_APPLIES: Record<string, { userId: string; userName: string; email: string; categories: string[]; introduction: string; portfolioLink: string; appliedAt: string; status: 'pending' | 'approved' | 'rejected' }> = {
  'apply-1': { userId: 'user-1', userName: '김민서', email: 'kms12782@nangman.cloud', categories: ['writing', 'marketing'], introduction: '전문 카피라이터입니다.', portfolioLink: 'https://portfolio.example.com', appliedAt: '2026-06-10T00:00:00.000Z', status: 'pending' },
};

// GET /admin/sellers/register 용 데이터
type SellerRegister = {
  registerId: string;
  userId: string;
  name: string;
  email: string;
  introduction: string | null;
  categories: string[];
  portfolioUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt: string | null;
  rejectReason: string | null;
};

let sellerRegisters: SellerRegister[] = [
  { registerId: 'reg-1', userId: 'user-1', name: '김민서', email: 'kms12782@nangman.cloud', introduction: '전문 카피라이터입니다. 마케팅 문구와 SNS 콘텐츠를 전문으로 합니다.', categories: ['writing', 'marketing'], portfolioUrl: 'https://portfolio.example.com', status: 'pending', submittedAt: '2026-06-10T00:00:00.000Z', reviewedAt: null, rejectReason: null },
  { registerId: 'reg-2', userId: 'user-4', name: '이서아', email: 'seoah@example.com', introduction: '미드저니·DALL·E 기반 제품 목업과 광고 컷 프롬프트를 전문으로 제작합니다.', categories: ['이미지 생성'], portfolioUrl: 'https://blog.example.com', status: 'pending', submittedAt: '2026-06-14T00:00:00.000Z', reviewedAt: null, rejectReason: null },
  { registerId: 'reg-3', userId: 'user-5', name: '박지현', email: 'jihyun@example.com', introduction: 'ChatGPT를 활용한 업무 자동화 및 데이터 분석 프롬프트를 만듭니다.', categories: ['data', 'chatbot'], portfolioUrl: null, status: 'pending', submittedAt: '2026-06-16T00:00:00.000Z', reviewedAt: null, rejectReason: null },
  { registerId: 'reg-4', userId: 'user-6', name: '최준혁', email: 'junhyuk@example.com', introduction: '리액트·Next.js 컴포넌트 리팩터링 및 코드 리뷰 프롬프트 전문입니다.', categories: ['coding'], portfolioUrl: 'https://github.com/junhyuk', status: 'approved', submittedAt: '2026-06-01T00:00:00.000Z', reviewedAt: '2026-06-02T10:00:00.000Z', rejectReason: null },
  { registerId: 'reg-5', userId: 'user-7', name: '오하늘', email: 'haneul@example.com', introduction: '유튜브·인스타그램 숏폼 스크립트 작성 전문 크리에이터입니다.', categories: ['writing'], portfolioUrl: 'https://youtube.com/@haneul', status: 'approved', submittedAt: '2026-06-03T00:00:00.000Z', reviewedAt: '2026-06-04T09:30:00.000Z', rejectReason: null },
  { registerId: 'reg-6', userId: 'user-8', name: '임수빈', email: 'subin@example.com', introduction: null, categories: ['image'], portfolioUrl: null, status: 'rejected', submittedAt: '2026-05-28T00:00:00.000Z', reviewedAt: '2026-05-30T14:00:00.000Z', rejectReason: '포트폴리오가 확인되지 않습니다. 샘플을 보완 후 재신청해 주세요.' },
];

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

  // 이번 달 실제 거래액 (order-service 연동 모의)
  http.get(`${BASE}/orders/month`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    return ok({
      monthlyTransactionAmount: 184320000,
    });
  }),

  // 최근 7일 거래량 (order-service 연동 모의)
  http.get(`${BASE}/orders/weekend`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    return ok({
      totalTransactionCount: 2554,
      totalTransactionAmount: 47170000,
      period: {
        startDate: '2026-06-08',
        endDate: '2026-06-14',
      },
      dailyTransactions: [
        { date: '2026-06-08', transactionCount: 284, transactionAmount: 5120000 },
        { date: '2026-06-09', transactionCount: 312, transactionAmount: 5740000 },
        { date: '2026-06-10', transactionCount: 268, transactionAmount: 4860000 },
        { date: '2026-06-11', transactionCount: 401, transactionAmount: 7220000 },
        { date: '2026-06-12', transactionCount: 488, transactionAmount: 9140000 },
        { date: '2026-06-13', transactionCount: 372, transactionAmount: 6680000 },
        { date: '2026-06-14', transactionCount: 429, transactionAmount: 7910000 },
      ],
    });
  }),

  // 회원 통계
  http.get(`${BASE}/stats/users`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const nonAdminUsers = MOCK_USERS.filter((u) => u.role !== 'admin');
    const today = new Date().toISOString().slice(0, 10);
    const todayNewUsers = nonAdminUsers.filter((u) => u.createdAt?.startsWith(today)).length;
    return ok({
      totalUsers: nonAdminUsers.length,
      todayNewUsers,
    });
  }),

  // 유저 목록
  http.get(`${BASE}/users`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 20);
    const statusFilter = url.searchParams.get('status') ?? 'ALL';
    const roleFilter = url.searchParams.get('role') ?? 'ALL';
    const keyword = url.searchParams.get('keyword')?.toLowerCase() ?? '';

    let users = MOCK_USERS.filter((u) => u.role !== 'admin').map((u) => ({
      ...u,
      status: u.status ?? 'active',
    }));

    if (statusFilter !== 'ALL') {
      users = users.filter((u) => u.status === statusFilter);
    }
    if (roleFilter !== 'ALL') {
      users = users.filter((u) => u.role === roleFilter);
    }
    if (keyword) {
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(keyword) ||
          u.email.toLowerCase().includes(keyword) ||
          u.id.toLowerCase().includes(keyword),
      );
    }

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

  // 유저 상태 변경
  http.patch(`${BASE}/users/:userId/status`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { userId } = params;
    const body = await request.json() as { status?: string };
    const idx = MOCK_USERS.findIndex((u) => u.id === userId);
    if (idx === -1) return ERR.notFound('유저');
    if (body.status !== 'active' && body.status !== 'suspended' && body.status !== 'withdrawn') {
      return ERR.validation('status는 active, suspended, withdrawn 중 하나여야 합니다.');
    }
    MOCK_USERS[idx].status = body.status;
    return ok({ id: userId, status: body.status, updatedAt: new Date().toISOString() });
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

  // 판매자 신청 목록 (GET /admin/sellers/register)
  http.get(`${BASE}/sellers/register`, ({ request }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 1);
    const size = Number(url.searchParams.get('size') ?? 20);
    const statusFilter = (url.searchParams.get('status') ?? 'ALL').toUpperCase();

    let list = [...sellerRegisters];
    if (statusFilter !== 'ALL') {
      list = list.filter((r) => r.status.toUpperCase() === statusFilter);
    }
    return okList(list, page, size);
  }),

  // 판매자 승인 (PATCH /admin/sellers/register/:registerId/approve)
  http.patch(`${BASE}/sellers/register/:registerId/approve`, ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { registerId } = params as { registerId: string };
    const idx = sellerRegisters.findIndex((r) => r.registerId === registerId);
    if (idx === -1) return ERR.notFound('판매자 신청');
    const reviewedAt = new Date().toISOString();
    sellerRegisters[idx].status = 'approved';
    sellerRegisters[idx].reviewedAt = reviewedAt;
    const userIdx = MOCK_USERS.findIndex((u) => u.id === sellerRegisters[idx].userId);
    if (userIdx !== -1) MOCK_USERS[userIdx].role = 'seller';
    return ok({ registerId, userId: sellerRegisters[idx].userId, status: 'APPROVED', reviewedAt });
  }),

  // 판매자 거절 (PATCH /admin/sellers/register/:registerId/reject)
  http.patch(`${BASE}/sellers/register/:registerId/reject`, async ({ request, params }) => {
    if (!isAdmin(request)) return ERR.forbidden();
    const { registerId } = params as { registerId: string };
    const body = await request.json() as { rejectReason?: string };
    if (!body.rejectReason) return ERR.validation('rejectReason은 필수입니다.');
    const idx = sellerRegisters.findIndex((r) => r.registerId === registerId);
    if (idx === -1) return ERR.notFound('판매자 신청');
    const reviewedAt = new Date().toISOString();
    sellerRegisters[idx].status = 'rejected';
    sellerRegisters[idx].reviewedAt = reviewedAt;
    sellerRegisters[idx].rejectReason = body.rejectReason;
    return ok({ registerId, userId: sellerRegisters[idx].userId, status: 'REJECTED', rejectReason: body.rejectReason, reviewedAt });
  }),

  // 판매자 신청 목록 (기존 경로 — 하위 호환)
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

  // // 주문 목록 (전체)
  // http.get(`${BASE}/orders`, ({ request }) => {
  //   if (!isAdmin(request)) return ERR.forbidden();
  //   const url = new URL(request.url);
  //   const page = Number(url.searchParams.get('page') ?? 1);
  //   const size = Number(url.searchParams.get('size') ?? 20);
  //   return okList(ordersStore, page, size);
  // }),

  // // 주문 환불
  // http.put(`${BASE}/orders/:id/refund`, ({ request, params }) => {
  //   if (!isAdmin(request)) return ERR.forbidden();
  //   const { id } = params;
  //   const order = ordersStore.find((o) => o.id === id);
  //   if (!order) return ERR.notFound('주문');
  //   order.status = 'REFUNDED';
  //   return ok(order);
  // }),

  // ── 정산 관리 (settlement-service) ──

  // GET /admin/settlements/summary — 상태별 합계·건수
  http.get(`${BASE}/settlements/summary`, ({ request }) => {
    if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
    const cards = SETTLEMENT_ORDER.map((st) => {
      const group = SETTLEMENTS.filter((s) => s.status === st);
      return {
        status: st,
        totalAmount: dec(group.reduce((acc, s) => acc + s.settlementTotalAmount, 0)),
        count: group.length,
      };
    });
    return ok({ cards });
  }),

  // GET /admin/settlements — 정산 목록 (상태 필터·0-base 페이징)
  http.get(`${BASE}/settlements`, ({ request }) => {
    if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as SettlementDisplayStatus | null;
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);
    const list = status ? SETTLEMENTS.filter((s) => s.status === status) : SETTLEMENTS;
    const start = page * size;
    return ok({
      items: list.slice(start, start + size).map(toAdminSettlementItem),
      totalElements: list.length,
      page,
      size,
    });
  }),

  // PATCH /admin/settlements/{id}/{action} — 상태 전이 (바디 없음)
  http.patch(`${BASE}/settlements/:id/approve`, ({ request, params }) => applyAdminAction(request, String(params.id), 'approve')),
  http.patch(`${BASE}/settlements/:id/hold`, ({ request, params }) => applyAdminAction(request, String(params.id), 'hold')),
  http.patch(`${BASE}/settlements/:id/release-hold`, ({ request, params }) => applyAdminAction(request, String(params.id), 'release-hold')),
  http.patch(`${BASE}/settlements/:id/payout`, ({ request, params }) => applyAdminAction(request, String(params.id), 'payout')),
  http.patch(`${BASE}/settlements/:id/payout-hold`, ({ request, params }) => applyAdminAction(request, String(params.id), 'payout-hold')),
  http.patch(`${BASE}/settlements/:id/payout-hold/release`, ({ request, params }) => applyAdminAction(request, String(params.id), 'payout-hold-release')),

  // PATCH /admin/settlements/{id}/cancel — 정산 취소 (SettlementResponse 반환)
  http.patch(`${BASE}/settlements/:id/cancel`, ({ request, params }) => {
    if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
    const settlement = SETTLEMENTS.find((s) => s.id === String(params.id));
    if (!settlement) return sErr('S-010', '정산을 찾을 수 없습니다.', 404);
    if (settlement.status === 'PAID') return sErr('S-011', '이미 지급 완료된 정산은 취소할 수 없습니다.', 409);
    if (settlement.status === 'CANCELLED') return sErr('S-012', '이미 취소된 정산입니다.', 409);
    settlement.status = 'CANCELLED';
    return ok({
      settlementId: settlement.id,
      sellerId: settlement.sellerId,
      displayStatus: 'CANCELLED',
      canceledAt: new Date().toISOString(),
    });
  }),

  // POST /admin/settlements/batch — 정산 배치잡(수동 정산) 비동기 실행 접수 (202)
  http.post(`${BASE}/settlements/batch`, async ({ request }) => {
    if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
    const body = (await request.json().catch(() => ({}))) as { period?: string };
    const period = body.period ?? '';
    if (!/^\d{4}-\d{2}$/.test(period)) return sErr('S-003', '요청 값이 올바르지 않습니다.', 400);
    const jobExecutionId = ++settlementJobSeq;
    const startTime = new Date().toISOString();
    SETTLEMENT_JOBS.set(jobExecutionId, { period, startTime });
    // 데모: 해당 월 대기(WAITING) 정산 1건을 새로 생성해 버튼 효과가 보이도록 함
    SETTLEMENTS.unshift({
      id: `stl-batch-${jobExecutionId}`,
      sellerId: 'user-2', sellerName: '프롬트랩', shop: '프롬트랩 스튜디오',
      periodStart: `${period}-01`, periodEnd: `${period}-28`,
      productCount: 12, totalAmount: 180000, feeTotalAmount: 27000, refundAmount: 0,
      settlementTotalAmount: 153000, status: 'WAITING',
      calculatedAt: startTime, confirmedAt: null, paidAt: null,
    });
    return ok({ jobExecutionId, jobName: 'settlementJob', status: 'STARTING', startTime }, 202);
  }),

  // GET /admin/settlements/batch/{jobExecutionId} — 배치잡 상태 조회 (폴링용). 모의는 즉시 COMPLETED
  http.get(`${BASE}/settlements/batch/:jobExecutionId`, ({ request, params }) => {
    if (!isAdmin(request)) return sErr('S-006', '접근 권한이 없습니다.', 403);
    const id = Number(params.jobExecutionId);
    const job = SETTLEMENT_JOBS.get(id);
    if (!job) return sErr('S-008', '정산 배치 잡 실행 이력을 찾을 수 없습니다.', 404);
    return ok({
      jobExecutionId: id,
      jobName: 'settlementJob',
      status: 'COMPLETED',
      exitCode: 'COMPLETED',
      startTime: job.startTime,
      endTime: new Date().toISOString(),
      failureMessage: null,
    });
  }),
];
