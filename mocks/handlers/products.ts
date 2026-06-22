import { http } from 'msw';
import { PRODUCTS, PRODUCT_VERSIONS } from '../data/products';
import { ok, okList, err, ERR, extractToken, getUserIdFromToken } from '../utils';
import { MOCK_USERS } from '../data/users';

const BASE = '*/api/v1/products';

// userId → productId → rating (MSW 세션 동안 유지)
const RATINGS: Record<string, Record<number, number>> = {};

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
      return matchCat && matchQ && (p.status ?? 'active') === 'active';
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

    const { category, ...productWithoutCategory } = product;

    return ok({
      ...productWithoutCategory,
      cat: category,
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
    const related = PRODUCTS.filter((p) =>
      p.category === product.category &&
      p.id !== product.id &&
      (p.status ?? 'active') === 'active'
    ).slice(0, limit);

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

  // PUT /api/v1/product/:id (versionType: PATCH | MAJOR, changeReason)
  http.put(`${BASE}/:id`, async ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const idx = PRODUCTS.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return ERR.notFound('프로덕트');
    if (PRODUCTS[idx].sellerId !== userId) return ERR.forbidden();

    // 검수 중인 상품은 수정 불가
    if (PRODUCTS[idx].status === 'review') {
      return err('CONFLICT', '검수 중인 상품은 수정할 수 없어요.', 409);
    }

    const body = await request.json() as {
      title?: string; category?: string; model?: string;
      amount?: number; desc?: string; content?: string;
      versionType?: 'MAJOR' | 'PATCH';
      changeReason?: string;
    };
    const { versionType = 'PATCH', changeReason, ...fields } = body;

    // 버전 계산: MAJOR → major+1, patch=0 / PATCH → patch+1
    const rawVer = (PRODUCT_VERSIONS[0]?.ver ?? 'v1.0').replace(/^v/, '');
    const [majStr, patStr = '0'] = rawVer.split('.');
    const maj = parseInt(majStr, 10) || 1;
    const pat = parseInt(patStr, 10) || 0;
    const newVer = versionType === 'MAJOR' ? `v${maj + 1}.0` : `v${maj}.${pat + 1}`;

    // MAJOR만 review 전환, PATCH는 기존 status 유지
    const newStatus: 'active' | 'review' =
      versionType === 'MAJOR' ? 'review' : (PRODUCTS[idx].status ?? 'active');

    PRODUCTS[idx] = {
      ...PRODUCTS[idx],
      ...(fields as Partial<typeof PRODUCTS[number]>),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    // 버전 이력 선두에 추가
    PRODUCT_VERSIONS.unshift({
      ver: newVer,
      date: new Date().toISOString().slice(0, 10),
      note: changeReason || '수정됨',
    });

    return ok({ ...PRODUCTS[idx], versions: PRODUCT_VERSIONS });
  }),

  // GET /api/v1/product/:id/rating — 내 별점 조회
  http.get(`${BASE}/:id/rating`, ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const productId = Number(params.id);
    const rating = RATINGS[userId]?.[productId] ?? 0;
    return ok({ rating });
  }),

  // POST /api/v1/product/:id/rating — 별점 등록/수정
  http.post(`${BASE}/:id/rating`, async ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const productId = Number(params.id);
    const product   = PRODUCTS.find((p) => p.id === productId);
    if (!product) return ERR.notFound('프로덕트');

    const body = await request.json() as { rating?: number };
    const n    = Number(body?.rating);
    if (!n || n < 1 || n > 5) return ERR.validation('별점은 1~5 사이여야 합니다.');

    if (!RATINGS[userId]) RATINGS[userId] = {};
    RATINGS[userId][productId] = n;

    // 상품 평균 rating 업데이트 (소수점 1자리)
    const allRatings = Object.values(RATINGS)
      .map((r) => r[productId])
      .filter((v): v is number => v !== undefined);
    const avg = allRatings.reduce((s, v) => s + v, 0) / allRatings.length;
    product.rating = Math.round(avg * 10) / 10;

    return ok({ rating: n });
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
