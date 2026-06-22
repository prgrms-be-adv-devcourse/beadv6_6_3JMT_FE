import { http } from 'msw';
import { MOCK_NOTIFICATIONS } from '../data/users';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '*/api/v1/notifications';

export const notificationHandlers = [
  // GET /api/v1/notifications
  http.get(BASE, ({ request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    return ok(MOCK_NOTIFICATIONS);
  }),

  // POST /api/v1/notifications/:id/read
  http.post(`${BASE}/:id/read`, ({ params, request }) => {
    const token  = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const notif = MOCK_NOTIFICATIONS.find((n) => n.id === params.id);
    if (!notif) return ERR.notFound('알림');

    notif.read = true;
    return ok(notif);
  }),
];
