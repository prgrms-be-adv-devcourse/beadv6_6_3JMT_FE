'use client';

import { useEffect, useState } from 'react';

export default function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== 'enabled') return;

    import('../../mocks/browser').then(({ worker }) => {
      worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: { url: '/mockServiceWorker.js' },
      }).then(() => setReady(true));
    });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
