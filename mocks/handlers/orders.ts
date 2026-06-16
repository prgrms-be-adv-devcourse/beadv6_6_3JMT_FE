import { http } from 'msw';
import { MOCK_ORDERS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/orders';

export const orderHandlers = [
  // POST /api/v1/orders
  http.post(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { productIds?: number[] };
    if (!body?.productIds?.length) return ERR.validation('주문할 상품을 선택해주세요.');

    const products = body.productIds
      .map((id) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    if (products.length !== body.productIds.length) return ERR.notFound('일부 상품');

    const totalPrice = products.reduce((sum, p) => sum + (p?.price ?? 0), 0);
    const orderId    = `order-${Date.now()}`;

    if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
    body.productIds.forEach((productId) => {
      MOCK_ORDERS[userId].push({ orderId, productId, purchasedAt: new Date().toISOString() });
    });

    return ok({ orderId, totalPrice, products }, 201);
  }),
];
