import { setupWorker } from 'msw/browser';
import { handlers }    from './handlers';
import { MOCK_USERS }  from './data/users';

try {
  const raw = localStorage.getItem('auth');
  if (raw) {
    const { state } = JSON.parse(raw);
    if (state?.user) {
      const existing = MOCK_USERS.find((u) => u.id === state.user.id);
      if (existing) {
        // 닉네임·이메일 변경 사항을 새로고침 후에도 유지
        if (state.user.name)  existing.name  = state.user.name;
        if (state.user.email) existing.email = state.user.email;
      } else {
        MOCK_USERS.push(state.user);
      }
    }
  }
} catch {}

export const worker = setupWorker(...handlers);
