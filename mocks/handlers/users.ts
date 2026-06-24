import { http } from 'msw';
import { MOCK_USERS, MOCK_PASSWORDS, SELLER_APPLICATIONS } from '../data/users';
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

    const sellerStatus = SELLER_APPLICATIONS[userId]?.status ?? null;
    return ok({ ...user, sellerStatus });
  }),

  // PATCH /api/v1/users/me
  http.patch(BASE, async ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const idx = MOCK_USERS.findIndex((u) => u.id === userId);
    if (idx === -1) return ERR.notFound('유저');

    const body = await request.json() as { name?: string; email?: string; password?: string };
    const changed: Record<string, string> = { id: MOCK_USERS[idx].id };

    if (body.name     !== undefined) { MOCK_USERS[idx].name  = body.name;     changed.name  = body.name; }
    if (body.email    !== undefined) { MOCK_USERS[idx].email = body.email;     changed.email = body.email; }
    if (body.password !== undefined) { MOCK_PASSWORDS[userId] = body.password; }

    return ok(changed);
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
