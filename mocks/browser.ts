import { setupWorker } from 'msw/browser';
import { handlers }    from './handlers';
import { MOCK_USERS }  from './data/users';

try {
  const raw = localStorage.getItem('auth');
  if (raw) {
    const { state } = JSON.parse(raw);
    if (state?.user && !MOCK_USERS.find((u) => u.id === state.user.id)) {
      MOCK_USERS.push(state.user);
    }
  }
} catch {}

export const worker = setupWorker(...handlers);
