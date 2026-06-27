import { http } from 'msw';
import { PRODUCTS } from '../data/products';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/cart';

type MockCartProduct = {
  cartProductId: string;
  productId: string;
};

const MOCK_CARTS: Record<string, MockCartProduct[]> = {};

function createCartProductId(productId: string) {
  return `cart-${productId}`;
}

function toCartItems(userId: string) {
  return (MOCK_CARTS[userId] ?? [])
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (!product) return null;

      return {
        cartProductId: item.cartProductId,
        productId: item.productId,
        product: {
          id: product.id,
          title: product.title,
          amount: product.amount,
          thumbnailUrl: product.thumbnail_url ?? null,
        },
      };
    })
    .filter(Boolean);
}

export const cartHandlers = [
  http.get(BASE, ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    return ok({ cartProducts: toCartItems(userId) });
  }),

  http.get(`${BASE}/products`, ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    return ok({ cartProducts: toCartItems(userId) });
  }),

  http.post(`${BASE}/products`, async ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { productId?: string };
    const { productId } = body ?? {};
    if (!productId) return ERR.validation('상품을 선택해주세요.');

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return ERR.notFound('상품');

    if (!MOCK_CARTS[userId]) MOCK_CARTS[userId] = [];
    let cartProduct = MOCK_CARTS[userId].find((item) => item.productId === productId);
    if (!cartProduct) {
      cartProduct = { cartProductId: createCartProductId(productId), productId };
      MOCK_CARTS[userId].push(cartProduct);
    }

    return ok({
      cartProductId: cartProduct.cartProductId,
      productId,
      product: {
        id: product.id,
        title: product.title,
        amount: product.amount,
        thumbnailUrl: product.thumbnail_url ?? null,
      },
    }, 201);
  }),

  http.delete(`${BASE}/products/:cartProductId`, ({ request, params }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const { cartProductId } = params as { cartProductId: string };
    MOCK_CARTS[userId] = (MOCK_CARTS[userId] ?? []).filter((item) => item.cartProductId !== cartProductId);

    return new Response(null, { status: 204 });
  }),

  http.delete(BASE, ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    MOCK_CARTS[userId] = [];

    return new Response(null, { status: 204 });
  }),
];
