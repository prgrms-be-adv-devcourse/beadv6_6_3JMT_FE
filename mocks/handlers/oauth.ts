import { http } from 'msw';
import { ok, ERR } from '../utils';

const BASE = '*/api/v1/auth/oauth';

export const oauthHandlers = [
  http.post('*/api/v1/auth/token/refresh', async ({ request }) => {
    const body = await request.json() as { refreshToken?: string };
    const { refreshToken } = body ?? {};

    if (!refreshToken) return ERR.validation('refreshToken이 없습니다.');

    const parts = refreshToken.split('::');
    if (parts[0] !== 'mock-refresh' || !parts[1]) return ERR.unauthorized();

    const userId = parts[1];
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return ok({ accessToken: `mock-token::${userId}`, expiresAt });
  }),

  http.post(`${BASE}/kakao`, async ({ request }) => {
    const body = await request.json() as {
      kakaoId?: string;
      nickname?: string;
      profileImage?: string | null;
      email?: string | null;
    };
    const { kakaoId, nickname, email } = body ?? {};

    if (!kakaoId) return ERR.validation('kakaoId가 없습니다.');

    const user = {
      id: `user-kakao-${kakaoId}`,
      name: nickname ?? '카카오사용자',
      email: email ?? `kakao_${kakaoId}@oauth.local`,
      role: 'BUYER' as const,
    };

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return ok({
      user,
      accessToken: `mock-token::${user.id}`,
      refreshToken: `mock-refresh::${user.id}`,
      tokenType: 'Bearer',
      expiresAt,
      isNewUser: false,
    });
  }),
];
