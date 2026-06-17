import { http, HttpResponse } from 'msw';
import { MOCK_USERS, MOCK_PASSWORDS, getRoleByEmail } from '../data/users';
import { ok, ERR, extractToken, getUserIdFromToken } from '../utils';

const BASE = '/api/v1/auth';

export const authHandlers = [
  http.post(`${BASE}/login`, async ({ request }) => {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body ?? {};

    if (!email || !password) return ERR.validation('이메일과 비밀번호를 입력해주세요.');

    const role = getRoleByEmail(email);
    const existing = MOCK_USERS.find((u) => u.email === email);
    let user = existing;
    if (!user) {
      user = { id: `user-${Date.now()}`, name: email.split('@')[0], email, role };
      MOCK_USERS.push(user);
    }

    const token = `mock-token::${user.id}`;
    return ok({ user, token });
  }),

  http.post(`${BASE}/signup`, async ({ request }) => {
    const body = await request.json() as { name?: string; email?: string; password?: string; serviceAgree?: boolean };
    const { name, email, password, serviceAgree } = body ?? {};

    if (!email || !password) return ERR.validation('이메일과 비밀번호를 입력해주세요.');
    if (!serviceAgree) return ERR.validation('서비스 이용약관에 동의해주세요.');

    const role = getRoleByEmail(email);
    const existing = MOCK_USERS.find((u) => u.email === email);
    let user = existing;
    if (!user) {
      user = { id: `user-${Date.now()}`, name: name ?? email.split('@')[0], email, role };
      MOCK_USERS.push(user);
    }

    const token = `mock-token::${user.id}`;
    return ok({ user, token });
  }),

  http.post(`${BASE}/logout`, () => {
    return ok(null, 200, '로그아웃 되었습니다.');
  }),

  http.put(`${BASE}/password`, async ({ request }) => {
    const token = extractToken(request);
    const userId = getUserIdFromToken(token);
    if (!userId) return ERR.unauthorized();

    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    const { currentPassword, newPassword } = body ?? {};

    if (!currentPassword || !newPassword) return ERR.validation('현재 비밀번호와 새 비밀번호를 입력해주세요.');
    if (newPassword.length < 8) return ERR.validation('새 비밀번호는 8자 이상이어야 해요.');
    if (currentPassword === newPassword) return ERR.validation('현재 비밀번호와 동일한 비밀번호로 변경할 수 없어요.');

    const stored = MOCK_PASSWORDS[userId] ?? 'password123';
    if (currentPassword !== stored) return ERR.validation('현재 비밀번호가 올바르지 않아요.');

    MOCK_PASSWORDS[userId] = newPassword;
    return ok(null, 200, '비밀번호가 변경되었습니다.');
  }),
];
