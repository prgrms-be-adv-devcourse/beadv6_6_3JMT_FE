import { http } from 'msw';
import { MOCK_ORDERS, MOCK_PAYMENTS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/payments';

export const paymentHandlers = [
  // POST /api/v1/payments/confirm
  http.post(`${BASE}/confirm`, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { productIds?: (number | string)[] };
    if (!body?.productIds?.length) return ERR.validation('결제할 상품을 선택해주세요.');

    const numericIds = body.productIds.map((id) => Number(id));
    const products = numericIds
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    if (products.length !== numericIds.length) return ERR.notFound('일부 상품');

    const totalAmount = products.reduce((sum, p) => sum + (p?.amount ?? 0), 0);
    const now       = new Date().toISOString();
    const paymentId = `pay-${Date.now()}`;
    const orderId   = `order-${Date.now()}`;

    if (!MOCK_PAYMENTS[userId]) MOCK_PAYMENTS[userId] = [];
    MOCK_PAYMENTS[userId].push({ paymentId, orderId, productIds: numericIds, totalAmount, status: 'paid', paidAt: now });

    if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
    numericIds.forEach((productId) => {
      MOCK_ORDERS[userId].push({ orderId, productId, purchasedAt: now });
    });

    return ok({ paymentId, orderId, totalAmount, status: 'paid' }, 201);
  }),
];
