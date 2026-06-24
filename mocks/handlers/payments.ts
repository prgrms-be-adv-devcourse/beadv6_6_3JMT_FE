import { http } from 'msw';
import { MOCK_PAYMENTS, MOCK_ORDERS } from '../data/users';
import { ok, err, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/payments';

export const paymentHandlers = [
  // POST /api/v1/payments/confirm
  // 에러 시뮬레이션: orderId가 'sim-pay002'로 시작하면 PAY002, 'sim-pay003'으로 시작하면 PAY003 반환
  http.post(`${BASE}/confirm`, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { paymentKey?: string; orderId?: string; amount?: number; _productIds?: string[] };
    const { paymentKey, orderId, amount, _productIds } = body ?? {};

    if (!paymentKey || !orderId || amount == null) {
      return err('V001', 'paymentKey, orderId, amount는 필수입니다.', 422);
    }

    if (orderId.startsWith('sim-pay002')) {
      return err('PAY002', '이미 결제된 주문입니다.', 400);
    }

    if (orderId.startsWith('sim-pay003')) {
      return err('PAY003', 'PG사 처리 중 오류가 발생했습니다.', 400);
    }

    const paymentId = `pay-${Date.now()}`;
    const now = new Date().toISOString();

    if (!MOCK_PAYMENTS[userId]) MOCK_PAYMENTS[userId] = [];
    MOCK_PAYMENTS[userId].push({ paymentId, orderId, productIds: _productIds ?? [], totalAmount: amount, status: 'paid', paidAt: now });

    // SW 재시작으로 MOCK_ORDERS가 초기화된 경우 복원
    if (!MOCK_ORDERS[userId]) MOCK_ORDERS[userId] = [];
    const alreadyExists = MOCK_ORDERS[userId].some((o) => o.orderId === orderId);
    if (!alreadyExists && _productIds?.length) {
      _productIds.forEach((productId) => {
        MOCK_ORDERS[userId].push({ orderId, productId, purchasedAt: now });
      });
    }

    return ok({ paymentId }, 201);
  }),
];
