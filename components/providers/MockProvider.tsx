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
      }).then(async () => {
        // worker.start() resolves after SW activation, but clients.claim()
        // may not have propagated yet — wait until this tab is controlled.
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve) => {
            const handler = () => {
              navigator.serviceWorker.removeEventListener('controllerchange', handler);
              resolve();
            };
            navigator.serviceWorker.addEventListener('controllerchange', handler);
            // Safety fallback: proceed after 1 s even if event never fires
            setTimeout(resolve, 1000);
          });
        }
        setReady(true);
      });
    });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
