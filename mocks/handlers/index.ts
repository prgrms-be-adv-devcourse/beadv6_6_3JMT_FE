import { http, passthrough }    from 'msw';
import { MOCK_ORDERS }          from '../data/users';
import { extractToken, getUserIdFromToken } from '../utils';
import { authHandlers }         from './auth';
import { oauthHandlers }        from './oauth';
import { productHandlers }      from './products';
import { userHandlers }         from './users';
import { wishlistHandlers }     from './wishlist';
import { cartHandlers }         from './cart';
import { sellerHandlers }       from './sellers';
import { orderHandlers }        from './orders';
import { paymentHandlers }      from './payments';
import { notificationHandlers } from './notifications';
import { adminHandlers }        from './admin';

// 정산 서비스 로컬 직접 라우팅 모드(NEXT_PUBLIC_SETTLEMENT_DIRECT=true): settlement 경로 요청은
// MSW가 가로채지 않고 실제 네트워크(Next rewrite → settlement-service)로 통과시킨다.
// (adminHandlers 등 mock 핸들러가 같은 /api/v1/... 경로를 먼저 가로챌 수 있어 맨 앞에서 처리)
const settlementDirectPassthrough =
  process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT === 'true'
    ? [
        http.all('*/api/v1/sellers/me/settlements*', () => passthrough()),
        http.all('*/api/v1/admin/settlements*', () => passthrough()),
      ]
    : [];

// 결제 서비스 로컬 직접 라우팅 모드(NEXT_PUBLIC_PAYMENT_DIRECT=true) 핸들러.
// - confirm 요청: Toss 리다이렉트 후 SW가 재시작되면 MOCK_ORDERS가 초기화되므로,
//   실제 서비스로 패스스루하기 전에 _productIds로 MOCK_ORDERS를 복원한다.
// - 그 외 /api/v1/payments/* 요청은 모두 패스스루.
const paymentDirectPassthrough =
  process.env.NEXT_PUBLIC_PAYMENT_DIRECT === 'true'
    ? [
        http.post('*/api/v1/payments/confirm', async ({ request }) => {
          const token  = extractToken(request);
          const userId = getUserIdFromToken(token);
          if (userId) {
            const body = await request.clone().json() as { orderId?: string; _productIds?: string[] };
            const { orderId, _productIds } = body ?? {};
            if (orderId && _productIds?.length) {
              if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
              const alreadyExists = MOCK_ORDERS[userId].some((o) => o.orderId === orderId);
              if (!alreadyExists) {
                const now = new Date().toISOString();
                _productIds.forEach((productId) => {
                  MOCK_ORDERS[userId!].push({ orderId, productId, purchasedAt: now });
                });
              }
            }
          }
          return passthrough();
        }),
        http.all('*/api/v1/payments*', () => passthrough()),
      ]
    : [];

// hybrid 모드일 경우 order, cart 등 백엔드가 연동된 API는 MSW를 통과시킵니다.
const hybridPassthrough =
  process.env.NEXT_PUBLIC_API_MOCKING === 'hybrid'
    ? [
        http.all('*/api/v1/orders/*', () => passthrough()),
        http.all('*/api/v1/orders', () => passthrough()),
        http.all('*/api/v1/admin/orders/*', () => passthrough()),
        http.all('*/api/v1/admin/orders', () => passthrough()),
        http.all('*/api/v1/cart/*', () => passthrough()),
        http.all('*/api/v1/cart', () => passthrough()),
      ]
    : [];

export const handlers = [
  ...settlementDirectPassthrough,
  ...paymentDirectPassthrough,
  ...hybridPassthrough,
  ...authHandlers,
  ...oauthHandlers,
  ...productHandlers,
  ...userHandlers,
  ...wishlistHandlers,
  ...cartHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...notificationHandlers,
  ...adminHandlers,
];
