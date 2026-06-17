import { http } from 'msw';
import { PRODUCTS, PRODUCT_VERSIONS } from '../data/products';
import { ok, okList, ERR, extractToken, getUserIdFromToken } from '../utils';
import { MOCK_USERS } from '../data/users';

const BASE = '/api/v1/product';

export const productHandlers = [
  // GET /api/v1/products
  http.get(BASE, ({ request }) => {
    const url = new URL(request.url);
    const q        = url.searchParams.get('q')?.toLowerCase() ?? '';
    const category = url.searchParams.get('category') ?? 'all';
    const page     = Number(url.searchParams.get('page') ?? 1);
    const size     = Number(url.searchParams.get('size') ?? 20);
    const sort     = url.searchParams.get('sort') ?? 'popular';

    let filtered = PRODUCTS.filter((p) => {
      const matchCat  = category === 'all' || p.category === category;
      const matchQ    = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    if (sort === 'rating') {
      filtered = [...filtered].sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-asc') {
      filtered = [...filtered].sort((a, b) => a.amount - b.amount);
    } else if (sort === 'price-desc') {
      filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    } else {
      filtered = [...filtered].sort((a, b) => b.salesCount - a.salesCount);
    }

    return okList(filtered, page, size);
  }),

  // GET /api/v1/products/:id
  http.get(`${BASE}/:id`, ({ params }) => {
    const product = PRODUCTS.find((p) => p.id === Number(params.id));
    if (!product) return ERR.notFound('프로덕트');

    return ok({
      ...product,
      versions: PRODUCT_VERSIONS,
      features: [
        '고해상도 출력 지원',
        '상업적 이용 가능',
        '버전 업데이트 무료 제공',
      ],
      content: `[${product.title}]\n\n이 프롬프트의 전체 내용은 구매 후 리더 페이지에서 확인할 수 있습니다.`,
    });
  }),

  // GET /api/v1/products/:id/related
  http.get(`${BASE}/:id/related`, ({ params, request }) => {
    const product = PRODUCTS.find((p) => p.id === Number(params.id));
    if (!product) return ERR.notFound('프로덕트');

    const url    = new URL(request.url);
    const limit  = Number(url.searchParams.get('limit') ?? 4);
    const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);

    return ok(related);
  }),

  // POST /api/v1/products — 판매자 전용
  http.post(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user || user.role !== 'seller') return ERR.forbidden();

    const body = await request.json() as {
      title?: string; category?: string; model?: string; desc?: string; amount?: number;
    };
    if (!body?.title || !body?.category || !body?.amount === undefined) {
      return ERR.validation('필수 항목(title, category, amount)을 입력해주세요.');
    }

    const newProduct = {
      id: PRODUCTS.length + 1,
      ...body,
      icon: 'sparkles',
      rating: 0,
      salesCount: 0,
      seller: user.name,
      sellerId: user.id,
      thumbnail_url: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    PRODUCTS.push(newProduct as typeof PRODUCTS[number]);
    return ok(newProduct, 201);
  }),

  // PUT /api/v1/products/:id
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const idx = PRODUCTS.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return ERR.notFound('프로덕트');
    if (PRODUCTS[idx].sellerId !== userId) return ERR.forbidden();

    const body = await request.json() as Partial<typeof PRODUCTS[number]>;
    PRODUCTS[idx] = {
      ...PRODUCTS[idx],
      ...body,
      status: 'review',
      updatedAt: new Date().toISOString(),
    };
    return ok(PRODUCTS[idx]);
  }),

  // DELETE /api/v1/products/:id
  http.delete(`${BASE}/:id`, ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const product = PRODUCTS.find((p) => p.id === Number(params.id));
    if (!product) return ERR.notFound('프로덕트');
    if (product.sellerId !== userId) return ERR.forbidden();

    return ok({ message: '삭제되었습니다.' });
  }),
];
