import { http } from 'msw';
import { MOCK_ORDERS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/orders';

export const orderHandlers = [
  // GET /api/v1/orders — 내 주문 목록
  http.get(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const orders = MOCK_ORDERS[userId] ?? [];
    const result = orders.map((o) => ({
      orderId:     o.orderId,
      purchasedAt: o.purchasedAt,
      product:     PRODUCTS.find((p) => p.id === o.productId) ?? null,
    }));

    return ok(result);
  }),

  // POST /api/v1/orders — 단건({ productId }) 또는 장바구니({ productIds })
  http.post(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { productId?: string; productIds?: string[] };

    const ids: string[] = body.productId
      ? [body.productId]
      : (body.productIds ?? []);

    if (!ids.length) return ERR.validation('주문할 상품을 선택해주세요.');

    const products = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
    if (products.length !== ids.length) return ERR.notFound('일부 상품');

    const orderId = `order-${Date.now()}`;

    if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
    ids.forEach((productId) => {
      MOCK_ORDERS[userId].push({ orderId, productId, purchasedAt: new Date().toISOString() });
    });

    return ok({ orderId }, 201);
  }),
];
