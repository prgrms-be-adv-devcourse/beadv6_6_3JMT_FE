import { http } from 'msw';
import { MOCK_WISHLISTS } from '../data/users';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/wishlist';

export const wishlistHandlers = [
  // POST /api/v1/wishlist/:productId
  http.post(`${BASE}/:productId`, ({ params, request }) => {
    const token     = extractToken(request);
    const userId    = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const productId = Number(params.productId);
    const product   = PRODUCTS.find((p) => p.id === productId);
    if (!product) return ERR.notFound('프로덕트');

    if (!MOCK_WISHLISTS[userId]) MOCK_WISHLISTS[userId] = [];
    if (!MOCK_WISHLISTS[userId].includes(productId)) {
      MOCK_WISHLISTS[userId].push(productId);
    }

    return ok({ message: '찜 목록에 추가되었습니다.' });
  }),

  // DELETE /api/v1/wishlist/:productId
  http.delete(`${BASE}/:productId`, ({ params, request }) => {
    const token     = extractToken(request);
    const userId    = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const productId = Number(params.productId);
    if (MOCK_WISHLISTS[userId]) {
      MOCK_WISHLISTS[userId] = MOCK_WISHLISTS[userId].filter((id) => id !== productId);
    }

    return ok({ message: '찜 목록에서 제거되었습니다.' });
  }),
];
