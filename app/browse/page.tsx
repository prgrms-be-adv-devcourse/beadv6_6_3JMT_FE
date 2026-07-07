'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/auth';
import { X, Check, SearchX } from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import Tag from '@/components/ui/Tag';
import { PRODUCT_TYPES } from '@/lib/productTypes';

/* ── Types ────────────────────────────────────────────────────────── */

type Prompt = {
  id: string; title: string; icon: string; model: string;
  amount: number; originalAmount?: number; rating: number; salesCount: number;
  seller: string; badge?: string; desc: string;
};

const PRODUCT_TYPE_FILTERS = [{ id: 'all', label: '전체' }, ...PRODUCT_TYPES];

/* ── CardGridSkeleton ─────────────────────────────────────────────── */

function CardGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 280, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-gray-100)' }} />
      ))}
    </div>
  );
}

/* ── BrowseScreen (원본 BrowseScreen 그대로 이식) ─────────────────── */

function BrowseScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') ?? '';
  const productType = searchParams.get('productType') ?? 'all';
  const [sort, setSort] = useState('인기순');
  const [list, setList] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setList([]);
    const sortParam = sort === '평점순' ? 'rating' : sort === '가격순' ? 'price-asc' : 'popular';
    api.get('/api/v1/products', {
      params: { q: query || undefined, productType: productType !== 'all' ? productType : undefined, sort: sortParam },
    })
      .then((res) => setList(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, productType, sort]);

  const setProductType = (id: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (id !== 'all') params.set('productType', id);
    router.push('/browse' + (params.toString() ? `?${params.toString()}` : ''));
  };

  const clearQuery = () => {
    const params = new URLSearchParams();
    if (productType !== 'all') params.set('productType', productType);
    router.push('/browse' + (params.toString() ? `?${params.toString()}` : ''));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>프롬프트 탐색</h1>
      <p style={{ color: 'var(--ph-text-secondary)', fontSize: 16, margin: '0 0 28px' }}>
        {query ? <span>'{query}' 검색 결과 · </span> : null}{list.length}개의 프롬프트
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {PRODUCT_TYPE_FILTERS.map((c) => (
          <Tag key={c.id} selected={productType === c.id} onClick={() => setProductType(c.id)}>{c.label}</Tag>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        {query && (
          <button
            onClick={clearQuery}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ph-secondary)', color: 'var(--ph-primary)', border: 'none', borderRadius: 'var(--ph-radius-full)', padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
          >
            <X style={{ width: 13, height: 13 }} /> 검색 초기화
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {(['인기순', '평점순', '가격순'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: sort === s ? 700 : 500, color: sort === s ? 'var(--ph-text)' : 'var(--ph-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {sort === s && <Check style={{ width: 15, height: 15 }} />}{s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : list.length === 0 ? (
        <div style={{ padding: '90px 0', textAlign: 'center', color: 'var(--ph-text-muted)' }}>
          <SearchX style={{ width: 40, height: 40, margin: '0 auto' }} />
          <p style={{ marginTop: 12 }}>검색 결과가 없어요. 다른 키워드로 찾아보세요.</p>
        </div>
      ) : (
        <div
          className="ph-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
        >
          {list.map((p) => (
            <PromptCard key={p.id} p={p} showActions onOpen={(item) => router.push(`/detail/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page export ─────────────────────────────────────────────────── */

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseScreen />
    </Suspense>
  );
}
