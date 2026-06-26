'use client';

import { useEffect, useState } from 'react';
import { isApiMockingEnabled } from '@/lib/hybridApi';

export default function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!isApiMockingEnabled(process.env.NEXT_PUBLIC_API_MOCKING));

  useEffect(() => {
    if (!isApiMockingEnabled(process.env.NEXT_PUBLIC_API_MOCKING)) return;

    import('../../mocks/browser')
      .then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: '/mockServiceWorker.js' },
        }).then(async () => {
          if (!navigator.serviceWorker.controller) {
            await new Promise<void>((resolve) => {
              const handler = () => {
                navigator.serviceWorker.removeEventListener('controllerchange', handler);
                resolve();
              };
              navigator.serviceWorker.addEventListener('controllerchange', handler);
              setTimeout(resolve, 1000);
            });
          }
          setReady(true);
        });
      })
      .catch(() => {
        // Turbopack 재시작으로 청크 해시가 바뀐 경우 자동 리로드
        window.location.reload();
      });
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
