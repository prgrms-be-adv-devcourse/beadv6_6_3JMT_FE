'use client';

import { useEffect } from 'react';

export default function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return;

    import('../../mocks/browser').then(({ worker }) => {
      worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      });
    });
  }, []);

  return <>{children}</>;
}
