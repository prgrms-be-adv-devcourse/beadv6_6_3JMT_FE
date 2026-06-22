import { http } from 'msw';
import { MOCK_USERS } from '../data/users';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/users/me';

export const userHandlers = [
  // GET /api/v1/users/me
  http.get(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return ERR.notFound('유저');

    return ok(user);
  }),

  // PUT /api/v1/users/me
  http.put(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const idx = MOCK_USERS.findIndex((u) => u.id === userId);
    if (idx === -1) return ERR.notFound('유저');

    const body = await request.json() as { name?: string; email?: string };
    if (body.name  !== undefined) MOCK_USERS[idx].name  = body.name;
    if (body.email !== undefined) MOCK_USERS[idx].email = body.email;

    return ok(MOCK_USERS[idx]);
  }),

  // DELETE /api/v1/users/me
  http.delete(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const idx = MOCK_USERS.findIndex((u) => u.id === userId);
    if (idx === -1) return ERR.notFound('유저');

    MOCK_USERS.splice(idx, 1);
    return ok({ message: '회원 탈퇴가 완료됐어요.' });
  }),
];
