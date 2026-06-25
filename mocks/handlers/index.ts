import { http, passthrough }    from 'msw';
import { authHandlers }         from './auth';
import { oauthHandlers }        from './oauth';
import { productHandlers }      from './products';
import { userHandlers }         from './users';
import { wishlistHandlers }     from './wishlist';
import { sellerHandlers }       from './sellers';
import { orderHandlers }        from './orders';
import { paymentHandlers }      from './payments';
import { notificationHandlers } from './notifications';
import { adminHandlers }        from './admin';

// 정산 서비스 직접 통신 모드: /settlement-proxy/* 요청은 MSW가 가로채지 않고
// 실제 네트워크(Next rewrite → settlement-service)로 통과시킨다.
// (mock 핸들러의 */api/v1/... 패턴이 프록시 경로까지 매칭하므로 맨 앞에서 passthrough 처리)
const settlementProxyPassthrough =
  process.env.NEXT_PUBLIC_SETTLEMENT_DIRECT === 'true'
    ? [http.all('*/settlement-proxy/*', () => passthrough())]
    : [];

export const handlers = [
  ...settlementProxyPassthrough,
  ...authHandlers,
  ...oauthHandlers,
  ...productHandlers,
  ...userHandlers,
  ...wishlistHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...notificationHandlers,
  ...adminHandlers,
];
