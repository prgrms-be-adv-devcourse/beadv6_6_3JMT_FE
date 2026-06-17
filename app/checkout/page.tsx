'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import api from '@/lib/api';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from 'lucide-react';

function won(n: number) {
  return '₩' + n.toLocaleString('ko-KR');
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.replace('/shop');
    }
  }, []);

  const total = items.reduce((s, i) => s + i.amount, 0);

  const handleOrder = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/v1/payments/confirm', { productIds: items.map((i) => Number(i.id)) });
      clearCart();
      router.push('/mypage');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '주문 처리 중 오류가 발생했습니다.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ph-bg)', paddingTop: 80 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontSize: 14, padding: 0 }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
            뒤로
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ph-text)', margin: 0 }}>주문 확인</h1>
        </div>

        {/* 상품 목록 */}
        <div style={{ background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--ph-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ph-text)' }}>주문 상품 {items.length}개</span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid var(--ph-border)' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 'var(--ph-radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--ph-bg)' }}>
                <Image
                  src={item.thumbnailUrl ?? '/images/promy-character.png'}
                  alt={item.title}
                  width={52}
                  height={52}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ph-text)', whiteSpace: 'nowrap' }}>
                {item.amount === 0 ? '무료' : won(item.amount)}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                aria-label="삭제"
                style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4, borderRadius: 'var(--ph-radius-sm)' }}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
              </button>
            </div>
          ))}
        </div>

        {/* 결제 요약 */}
        <div style={{ background: 'var(--ph-surface)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius)', padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: 'var(--ph-text-secondary)' }}>상품 금액</span>
            <span style={{ fontSize: 14, color: 'var(--ph-text)' }}>{won(total)}</span>
          </div>
          <div style={{ height: 1, background: 'var(--ph-border)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ph-text)' }}>최종 결제 금액</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ph-primary)' }}>{won(total)}</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--ph-radius-sm)', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* 주문 버튼 */}
        <button
          onClick={handleOrder}
          disabled={loading || items.length === 0}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', height: 52, border: 'none',
            borderRadius: 'var(--ph-radius)', background: loading ? 'var(--ph-text-muted)' : 'var(--ph-primary)',
            color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}
        >
          <CreditCard style={{ width: 20, height: 20 }} />
          {loading ? '처리 중...' : `${won(total)} 주문하기`}
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ph-text-muted)', marginTop: 12 }}>
          주문 완료 후 구매 내역은 마이페이지에서 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
