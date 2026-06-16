import { http } from 'msw';
import { MOCK_USERS, MOCK_ORDERS, MOCK_WISHLISTS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/users/me';

export const userHandlers = [
  // GET /api/v1/users/me
  http.get(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return ERR.notFound('유저');

    return ok(user);
  }),

  // PUT /api/v1/users/me
  http.put(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return ERR.notFound('유저');

    const body    = await request.json() as { name?: string; email?: string };
    const updated = { ...user, ...body };
    return ok(updated);
  }),

  // GET /api/v1/users/me/orders
  http.get(`${BASE}/orders`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const orders  = MOCK_ORDERS[userId] ?? [];
    const result  = orders.map((o) => ({
      orderId:     o.orderId,
      purchasedAt: o.purchasedAt,
      product:     PRODUCTS.find((p) => p.id === o.productId) ?? null,
    }));

    return ok(result);
  }),

  // GET /api/v1/users/me/wishlist
  http.get(`${BASE}/wishlist`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const ids    = MOCK_WISHLISTS[userId] ?? [];
    const result = ids.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
    return ok(result);
  }),
];
