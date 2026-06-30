import { http, HttpResponse } from 'msw';
import { MOCK_USERS, SELLER_APPLICATIONS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';
import {
  SETTLEMENTS,
  nextSettlementStatus,
  SETTLEMENT_STATUS_LABEL,
  type Settlement,
  type SettlementDisplayStatus,
} from '../data/settlements';

const BASE = '*/api/v1/sellers';

const sErr = (code: string, message: string, status: number) =>
  HttpResponse.json({ code, message }, { status });
const dec = (n: number) => n.toFixed(2);

// 판매자 정산 목록 항목 (status=코드, displayStatus=한글 라벨)
function toSellerSettlementItem(s: Settlement) {
  return {
    settlementId: s.id,
    period: s.periodStart.slice(0, 7),
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    salesCount: s.productCount,
    grossAmount: dec(s.totalAmount),
    feeAmount: dec(s.feeTotalAmount),
    refundAmount: dec(s.refundAmount),
    adjustmentAmount: '0',
    payoutAmount: dec(s.settlementTotalAmount),
    status: s.status,
    displayStatus: SETTLEMENT_STATUS_LABEL[s.status],
    availableActions:
      s.status === 'APPROVED' ? [{ type: 'REQUEST_PAYOUT', label: '지급 신청하기' }] : [],
  };
}

export const sellerHandlers = [
  // POST /api/v1/seller
  http.post('*/api/v1/seller', async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as {
      categories?: string[];
      introduction?: string;
      portfolioUrl?: string;
      agreedToTerms?: boolean;
    };
    if (!body?.agreedToTerms) return ERR.validation('이용약관에 동의해야 합니다.');
    if (!body?.categories?.length) return ERR.validation('카테고리를 1개 이상 선택해주세요.');

    const application = {
      sellerRequestId: crypto.randomUUID(),
      status: 'PENDING' as const,
      categories: body.categories ?? [],
      introduction: body.introduction ?? null,
      portfolioUrl: body.portfolioUrl ?? null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      rejectReason: null,
    };
    SELLER_APPLICATIONS[userId] = application;
    return ok({
      sellerRequestId: application.sellerRequestId,
      status: application.status,
      submittedAt: application.submittedAt,
    }, 201);
  }),

  // GET /api/v1/sellers/apply-status (레거시 — apply/page.tsx 호환용)
  http.get(`${BASE}/apply-status`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const application = SELLER_APPLICATIONS[userId];
    const status = application?.status ?? 'NOT_APPLIED';
    return ok({ status });
  }),

  // GET /api/v1/sellers/me/products
  http.get(`${BASE}/me/products`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return ERR.forbidden();

    const myProducts = PRODUCTS.filter((p) => p.sellerId === userId);
    const toApiStatus = (s?: string) => {
      if (s === 'active')   return 'ON_SALE';
      if (s === 'review')   return 'PENDING_REVIEW';
      if (s === 'rejected') return 'REJECTED';
      if (s === 'stopped')  return 'STOPPED';
      return 'ON_SALE';
    };
    return ok(myProducts.map((p) => ({
      productId: p.id,
      title: p.title,
      category: p.category,
      model: p.model,
      amount: p.amount,
      status: toApiStatus(p.status),
      salesCount: p.salesCount,
      thumbnailUrl: p.thumbnail_url ?? null,
      rejectionReason: null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })));
  }),

  // GET /api/v1/sellers/me/products/:id
  http.get(`${BASE}/me/products/:id`, ({ request, params }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return ERR.forbidden();

    const product = PRODUCTS.find((p) => p.id === params.id && p.sellerId === userId);
    if (!product) return ERR.notFound('상품을 찾을 수 없습니다.');

    return ok({
      productId: product.id,
      title: product.title,
      category: product.category,
      productType: product.productType ?? 'PROMPT',
      model: product.model,
      amount: product.amount,
      desc: product.desc,
      content: product.desc,
      status: product.status === 'active' ? 'ON_SALE'
             : product.status === 'review' ? 'PENDING_REVIEW'
             : product.status === 'rejected' ? 'REJECTED'
             : product.status === 'stopped' ? 'STOPPED'
             : 'ON_SALE',
      version: '1.0',
      thumbnailUrl: product.thumbnail_url ?? null,
      imageUrls: [],
      tags: [],
    });
  }),

  // GET /api/v1/sellers/me/stats
  http.get(`${BASE}/me/stats`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return ERR.forbidden();

    const myProducts   = PRODUCTS.filter((p) => p.sellerId === userId);
    const totalSalesCount   = myProducts.reduce((sum, p) => sum + p.salesCount, 0);
    const totalRevenue = myProducts.reduce((sum, p) => sum + p.amount * p.salesCount, 0);
    const avgRating    = myProducts.length
      ? myProducts.reduce((sum, p) => sum + p.rating, 0) / myProducts.length
      : 0;

    return ok({ totalSalesCount, totalRevenue, rating: Math.round(avgRating * 10) / 10 });
  }),

  // GET /api/v1/sellers/me/payments
  http.get(`${BASE}/me/payments`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return ERR.forbidden();

    const url    = new URL(request.url);
    const status = url.searchParams.get('status');

    const payments = [
      { id: 'pay-1', productId: '11111111-1111-1111-1111-111111111111', amount: 5900, status: 'paid',      paidAt: '2026-06-10T00:00:00.000Z' },
      { id: 'pay-2', productId: '11111111-1111-1111-1111-111111111111', amount: 5900, status: 'paid',      paidAt: '2026-06-08T00:00:00.000Z' },
      { id: 'pay-3', productId: '77777777-7777-7777-7777-777777777777', amount: 4500, status: 'requested', paidAt: '2026-06-05T00:00:00.000Z' },
      { id: 'pay-4', productId: '77777777-7777-7777-7777-777777777777', amount: 4500, status: 'refunded',  paidAt: '2026-06-01T00:00:00.000Z' },
    ];

    const filtered = status ? payments.filter((p) => p.status === status) : payments;
    return ok(filtered);
  }),

  // GET /api/v1/sellers/me/settlements/summary — 내 상점 요약 지표
  http.get(`${BASE}/me/settlements/summary`, ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return sErr('S-005', '인증 정보가 없습니다.', 401);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return sErr('S-006', '접근 권한이 없습니다.', 403);

    const myProducts = PRODUCTS.filter((p) => p.sellerId === userId);
    const mine = SETTLEMENTS.filter((s) => s.sellerId === userId);
    const totalSalesCount = myProducts.reduce((sum, p) => sum + p.salesCount, 0);
    const totalRevenueAmount = myProducts.reduce((sum, p) => sum + p.amount * p.salesCount, 0);
    const totalSettlementAmount = mine
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.settlementTotalAmount, 0);

    return ok({
      registeredPromptCount: myProducts.length,
      totalSalesCount,
      totalRevenueAmount: dec(totalRevenueAmount),
      totalSettlementAmount: dec(totalSettlementAmount),
    });
  }),

  // GET /api/v1/sellers/me/settlements — 본인 정산 내역 (상태·월 필터·0-base 페이징)
  http.get(`${BASE}/me/settlements`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return sErr('S-005', '인증 정보가 없습니다.', 401);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return sErr('S-006', '접근 권한이 없습니다.', 403);

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as SettlementDisplayStatus | null;
    const period = url.searchParams.get('period'); // "yyyy-MM"
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 10);

    let list = SETTLEMENTS.filter((s) => s.sellerId === userId);
    if (status) list = list.filter((s) => s.status === status);
    if (period) list = list.filter((s) => s.periodStart.slice(0, 7) === period);
    const start = page * size;

    return ok({
      items: list.slice(start, start + size).map(toSellerSettlementItem),
      totalElements: list.length,
      page,
      size,
    });
  }),

  // PATCH /api/v1/sellers/me/settlements/:id/payout-request — 지급 신청 (APPROVED → PAYOUT_REQUESTED)
  http.patch(`${BASE}/me/settlements/:id/payout-request`, ({ request, params }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return sErr('S-005', '인증 정보가 없습니다.', 401);
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return sErr('S-006', '접근 권한이 없습니다.', 403);

    const settlement = SETTLEMENTS.find((s) => s.id === String(params.id));
    if (!settlement) return sErr('S-010', '정산을 찾을 수 없습니다.', 404);
    if (settlement.sellerId !== userId) return sErr('S-014', '본인 정산이 아닙니다.', 403);

    const next = nextSettlementStatus(settlement.status, 'requestPayout');
    if (!next) return sErr('S-013', '현재 상태에서 변경할 수 없는 정산입니다.', 409);
    settlement.status = next;
    return ok({
      settlementId: settlement.id,
      settlementStatus: 'APPROVED',
      payoutStatus: 'PAYOUT_REQUESTED',
      displayStatus: settlement.status,
      confirmedAt: settlement.confirmedAt,
      paidAt: settlement.paidAt,
      payoutReference: null,
      failureReason: null,
      updatedAt: new Date().toISOString(),
    });
  }),
];
