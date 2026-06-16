import { http, HttpResponse } from 'msw';
import { MOCK_USERS, getRoleByEmail } from '../data/users';
import { ok, ERR } from '../utils';

const BASE = '/api/v1/auth';

export const authHandlers = [
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body ?? {};

    if (!email || !password) return ERR.validation('이메일과 비밀번호를 입력해주세요.');

    const role = getRoleByEmail(email);
    const existing = MOCK_USERS.find((u) => u.email === email);
    const user = existing ?? {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role,
    };

    const token = `mock-token::${user.id}`;
    return ok({ user, token });
  }),

  http.post(`${BASE}/signup`, async ({ request }) => {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const { name, email, password } = body ?? {};

    if (!email || !password) return ERR.validation('이메일과 비밀번호를 입력해주세요.');

    const role = getRoleByEmail(email);
    const user = {
      id: `user-${Date.now()}`,
      name: name ?? email.split('@')[0],
      email,
      role,
    };

    const token = `mock-token::${user.id}`;
    return ok({ user, token });
  }),

  http.post(`${BASE}/logout`, () => {
    return ok({ message: '로그아웃 되었습니다.' });
  }),
];
