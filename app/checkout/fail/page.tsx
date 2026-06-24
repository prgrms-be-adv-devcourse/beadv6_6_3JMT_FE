'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';

function FailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const message = searchParams.get('message') ?? '결제에 실패했습니다.';

  const description = code === 'PAY_PROCESS_CANCELED'
    ? '결제를 취소했어요.'
    : message;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '48px 24px', textAlign: 'center' }}>
        <XCircle style={{ width: 48, height: 48, color: '#dc2626', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ph-text)', marginBottom: 8 }}>결제가 완료되지 않았어요</h2>
        <p style={{ fontSize: 14, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>
          {description}
        </p>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--ph-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--ph-radius-md)', padding: '12px 28px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--ph-font-family)',
          }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
