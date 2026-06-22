import { http } from 'msw';
import { ok, ERR } from '../utils';

const BASE = '*/api/v1/auth/oauth';

export const oauthHandlers = [
  http.post(`${BASE}/kakao`, async ({ request }) => {
    const body = await request.json() as { code?: string };
    const { code } = body ?? {};

    if (!code) return ERR.validation('authorization code가 없습니다.');

    const user = {
      id: `user-kakao-${Date.now()}`,
      name: '카카오사용자',
      email: 'kakao@user.com',
      role: 'buyer' as const,
    };

    return ok({ user, token: `mock-token::${user.id}` });
  }),
];
