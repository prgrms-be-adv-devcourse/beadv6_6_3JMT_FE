import { http } from 'msw';
import { MOCK_USERS } from '../data/users';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/users/me';

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

    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) return ERR.notFound('유저');

    const body    = await request.json() as { name?: string; email?: string };
    const updated = { ...user, ...body };
    return ok(updated);
  }),
];
