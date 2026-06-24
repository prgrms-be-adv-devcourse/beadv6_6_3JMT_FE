'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPayment } from '@/lib/payments';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type ConfirmState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'pay002'; message: string }
  | { status: 'error'; message: string };

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey') ?? '';
  const orderId = searchParams.get('orderId') ?? '';
  const amount = Number(searchParams.get('amount') ?? '0');

  const [state, setState] = useState<ConfirmState>({ status: 'loading' });

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setState({ status: 'error', message: '잘못된 결제 정보입니다.' });
      return;
    }

    const saved = localStorage.getItem('_mock_pending_order');
    const _productIds: string[] | undefined = saved ? JSON.parse(saved).productIds : undefined;
    localStorage.removeItem('_mock_pending_order');

    confirmPayment({ paymentKey, orderId, amount, _productIds })
      .then(() => setState({ status: 'success' }))
      .catch((e: unknown) => {
        const data = (e as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
        if (data?.code === 'PAY002') {
          setState({ status: 'pay002', message: data.message ?? '이미 결제된 주문입니다.' });
        } else {
          setState({ status: 'error', message: data?.message ?? '결제 확인 중 오류가 발생했습니다.' });
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.status === 'success') {
      router.replace('/mypage?tab=purchased');
    }
  }, [state, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 480, width: '100%', padding: '48px 24px', textAlign: 'center' }}>

        {state.status === 'loading' && (
          <>
            <Loader2
              style={{ width: 48, height: 48, color: 'var(--ph-primary)', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}
            />
            <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)' }}>결제를 확인하고 있어요…</p>
          </>
        )}

        {state.status === 'success' && (
          <>
            <CheckCircle2 style={{ width: 48, height: 48, color: 'var(--ph-primary)', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 16, color: 'var(--ph-text)' }}>결제가 완료됐어요. 마이페이지로 이동합니다…</p>
          </>
        )}

        {state.status === 'pay002' && (
          <>
            <CheckCircle2 style={{ width: 48, height: 48, color: 'var(--ph-primary)', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ph-text)', marginBottom: 8 }}>결제가 확인됐어요</h2>
            <p style={{ fontSize: 14, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>
              마이페이지에서 확인해보세요.
            </p>
            <button
              onClick={() => router.replace('/mypage?tab=purchased')}
              style={{
                background: 'var(--ph-primary)', color: '#fff', border: 'none',
                borderRadius: 'var(--ph-radius-md)', padding: '12px 28px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--ph-font-family)',
              }}
            >
              마이페이지로
            </button>
          </>
        )}

        {state.status === 'error' && (
          <>
            <XCircle style={{ width: 48, height: 48, color: '#dc2626', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ph-text)', marginBottom: 8 }}>결제 확인 실패</h2>
            <p style={{ fontSize: 14, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>
              {state.message}
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
              이전 페이지로
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
