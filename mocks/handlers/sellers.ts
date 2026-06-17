import { http } from 'msw';
import { MOCK_USERS, SELLER_APPLY_STATUS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/sellers';

export const sellerHandlers = [
  // POST /api/v1/seller
  http.post('/api/v1/seller', async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as {
      selectedCategories?: string[];
      introduction?: string;
      portfolioLink?: string;
      agreedToTerms?: boolean;
    };
    if (!body?.agreedToTerms) return ERR.validation('이용약관에 동의해야 합니다.');
    if (!body?.selectedCategories?.length) return ERR.validation('카테고리를 1개 이상 선택해주세요.');

    SELLER_APPLY_STATUS[userId] = 'pending';
    return ok({ status: 'pending', message: '신청이 접수되었습니다. 검토 후 승인됩니다.' }, 201);
  }),

  // GET /api/v1/sellers/apply-status
  http.get(`${BASE}/apply-status`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const status = SELLER_APPLY_STATUS[userId] ?? 'not_applied';
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
    return ok(myProducts);
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
      { id: 'pay-1', productId: 1, amount: 5900, status: 'paid',      paidAt: '2026-06-10T00:00:00.000Z' },
      { id: 'pay-2', productId: 1, amount: 5900, status: 'paid',      paidAt: '2026-06-08T00:00:00.000Z' },
      { id: 'pay-3', productId: 7, amount: 4500, status: 'requested', paidAt: '2026-06-05T00:00:00.000Z' },
      { id: 'pay-4', productId: 7, amount: 4500, status: 'refunded',  paidAt: '2026-06-01T00:00:00.000Z' },
    ];

    const filtered = status ? payments.filter((p) => p.status === status) : payments;
    return ok(filtered);
  }),
];
