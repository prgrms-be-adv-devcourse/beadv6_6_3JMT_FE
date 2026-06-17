import { http } from 'msw';
import { MOCK_WISHLISTS, WishlistItem } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/wishlists';

export const wishlistHandlers = [
  // POST /api/v1/wishlists
  http.post(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body      = await request.json() as { productId?: string | number };
    const productId = Number(body?.productId);
    if (!productId) return ERR.validation('productId가 필요합니다.');

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return ERR.notFound('상품');

    if (!MOCK_WISHLISTS[userId]) MOCK_WISHLISTS[userId] = [];

    const alreadyWished = MOCK_WISHLISTS[userId].some((w) => w.productId === productId);
    if (alreadyWished) {
      return ERR.validation('이미 찜한 상품입니다.');
    }

    const newItem: WishlistItem = {
      wishlistId: `wl-${Date.now()}`,
      productId,
      createdAt: new Date().toISOString(),
    };
    MOCK_WISHLISTS[userId].push(newItem);

    return ok(newItem, 201);
  }),

  // DELETE /api/v1/wishlists/:wishlistId
  http.delete(`${BASE}/:wishlistId`, ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const { wishlistId } = params as { wishlistId: string };
    const items = MOCK_WISHLISTS[userId] ?? [];
    const item  = items.find((w) => w.wishlistId === wishlistId);

    if (!item) return ERR.notFound('찜 항목');

    MOCK_WISHLISTS[userId] = items.filter((w) => w.wishlistId !== wishlistId);
    return new Response(null, { status: 204 });
  }),

  // GET /api/v1/wishlists?page=0&size=20
  http.get(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const url           = new URL(request.url);
    const page          = Number(url.searchParams.get('page') ?? 0);
    const size          = Number(url.searchParams.get('size') ?? 20);
    const allItems      = MOCK_WISHLISTS[userId] ?? [];
    const totalElements = allItems.length;
    const content       = allItems.slice(page * size, page * size + size).map((item) => ({
      ...item,
      product: PRODUCTS.find((p) => p.id === item.productId) ?? null,
    }));

    return ok({ content, page, size, totalElements });
  }),

  // GET /api/v1/wishlists/exists?productId=
  http.get(`${BASE}/exists`, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const url       = new URL(request.url);
    const productId = Number(url.searchParams.get('productId'));
    const items     = MOCK_WISHLISTS[userId] ?? [];
    const wished    = items.some((w) => w.productId === productId);

    return ok({ wished });
  }),
];
