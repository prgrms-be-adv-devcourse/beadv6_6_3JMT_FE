'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/auth';
import { createOrder } from '@/lib/payments';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { won } from '@/lib/utils';

type LineItem = { id: string; title: string; amount: number; thumbnailUrl: string | null };

/* ─── 실제 결제 콘텐츠 (useSearchParams 사용 → Suspense 필요) ─── */

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isSingle = !!productId;

  const { items: cartItems, removeItem, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [singleItem, setSingleItem] = useState<LineItem | null>(null);
  const [fetchErr, setFetchErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSingle) {
      api.get(`/api/v1/products/${productId}`)
        .then((res) => {
          const d = res.data.data;
          setSingleItem({
            id: String(d.id),
            title: d.title,
            amount: d.amount,
            thumbnailUrl: d.thumbnail_url ?? null,
          });
        })
        .catch(() => setFetchErr(true));
    } else if (cartItems.length === 0) {
      router.replace('/shop');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const items: LineItem[] = isSingle ? (singleItem ? [singleItem] : []) : cartItems;
  const total = items.reduce((s, i) => s + i.amount, 0);

  const handleOrder = async () => {
    if (loading || items.length === 0 || !user) return;
    setError(null);
    setLoading(true);
    try {
      const orderParams = isSingle
        ? { productId: items[0].id }
        : { productIds: items.map((i) => i.id) };
      const { orderId } = await createOrder(orderParams);

      // SW 재시작으로 MOCK_ORDERS가 초기화될 경우를 대비해 리다이렉트 전에 보존
      sessionStorage.setItem(
        '_mock_pending_order',
        JSON.stringify({ orderId, productIds: items.map((i) => i.id) })
      );

      if (!isSingle) clearCart();

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: user.id });

      const orderName = isSingle
        ? items[0].title
        : `${items[0].title} 외 ${items.length - 1}건`;

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: total },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '주문 처리 중 오류가 발생했습니다.';
      setError(msg);
      setLoading(false);
    }
  };

  /* 상품 조회 실패 */
  if (fetchErr) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>
          상품 정보를 불러올 수 없어요.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            background: 'var(--ph-primary)', color: '#fff', border: 'none',
            borderRadius: 'var(--ph-radius-md)', padding: '12px 24px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--ph-font-family)',
          }}
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  /* 단건 상품 로딩 중 */
  if (isSingle && !singleItem) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 15, color: 'var(--ph-text-muted)' }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ph-text-secondary)', fontSize: 14, padding: 0,
              fontFamily: 'var(--ph-font-family)',
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
            뒤로
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ph-text)', margin: 0 }}>
            주문 확인
          </h1>
        </div>

        {/* 상품 목록 */}
        <div style={{
          background: 'var(--ph-surface)',
          border: '1px solid var(--ph-border)',
          borderRadius: 'var(--ph-radius-lg)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ph-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ph-text)' }}>
              주문 상품 {items.length}개
            </span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                borderBottom: '1px solid var(--ph-border)',
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 'var(--ph-radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--ph-bg)' }}>
                <Image
                  src={item.thumbnailUrl ?? '/images/promy-character.png'}
                  alt={item.title}
                  width={52}
                  height={52}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  unoptimized
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ph-text)', whiteSpace: 'nowrap' }}>
                {item.amount === 0 ? '무료' : won(item.amount)}
              </div>
              {/* 카트 모드에서만 삭제 버튼 표시 */}
              {!isSingle && (
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="삭제"
                  style={{
                    display: 'inline-flex', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--ph-text-muted)',
                    padding: 4, borderRadius: 'var(--ph-radius-sm)',
                  }}
                >
                  <Trash2 style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 결제 요약 */}
        <div style={{
          background: 'var(--ph-surface)',
          border: '1px solid var(--ph-border)',
          borderRadius: 'var(--ph-radius-lg)',
          padding: '20px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--ph-text-secondary)' }}>상품 금액</span>
            <span style={{ fontSize: 14, color: 'var(--ph-text)' }}>
              {total === 0 ? '무료' : won(total)}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--ph-border)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ph-text)' }}>최종 결제 금액</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ph-primary)' }}>
              {total === 0 ? '무료' : won(total)}
            </span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--ph-radius-sm)',
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* 결제 버튼 */}
        <button
          onClick={handleOrder}
          disabled={loading || items.length === 0}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', height: 52, border: 'none',
            borderRadius: 'var(--ph-radius-lg)',
            background: (loading || items.length === 0) ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
            color: '#fff',
            fontFamily: 'var(--ph-font-family)',
            fontSize: 16, fontWeight: 700,
            cursor: (loading || items.length === 0) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <CreditCard style={{ width: 20, height: 20 }} />
          {loading
            ? '처리 중...'
            : total === 0
            ? '무료로 받기'
            : `${won(total)} 결제하기`}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ph-text-muted)', marginTop: 12 }}>
          결제 완료 후 구매 내역은 마이페이지에서 확인할 수 있습니다.
        </p>

      </div>
    </div>
  );
}

/* ─── Page export: Suspense로 래핑 (useSearchParams 요건) ─── */

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
