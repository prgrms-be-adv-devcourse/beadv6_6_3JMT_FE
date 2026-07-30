'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { X, Check, SearchX } from 'lucide-react';
import PromptCard from '@/components/ui/PromptCard';
import Tag from '@/components/ui/Tag';
import { PRODUCT_TYPES, PRODUCT_TYPE_LABEL, PRODUCT_TYPE_BROWSE_DESC } from '@/lib/productTypes';
import { getSellerNames } from '@/lib/sellers';

/* ── Types ────────────────────────────────────────────────────────── */

type Prompt = {
  id: string; title: string; icon: string; model: string;
  amount: number; originalAmount?: number; rating: number; salesCount: number;
  seller: string; sellerId?: string; badge?: string; desc: string;
};

const PRODUCT_TYPE_FILTERS = [{ id: 'all', label: '전체' }, ...PRODUCT_TYPES];
const PAGE_SIZE = 20;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  // 화면에 실제로 그려진 개수(list.length)가 아니라 조건에 맞는 전체 개수다.
  // 더보기를 눌러도 이 숫자는 그대로여야 한다.
  const [total, setTotal] = useState(0);
  // query/productType/sort가 바뀌면 true가 되어, 그 이전에 나간 요청(느린 검색·더보기 포함)의
  // 응답이 나중에 와도 최신 결과를 덮어쓰지 못하게 막는다.
  const cancelledRef = useRef(false);

  const sortParam = sort === '평점순' ? 'rating' : sort === '가격순' ? 'price-asc' : 'popular';

  const enrichWithSellerNames = async (products: Prompt[]): Promise<Prompt[]> => {
    const sellerIds = products.map((p) => p.sellerId).filter((id): id is string => !!id);
    if (sellerIds.length === 0) return products;

    try {
      const sellerNames = await getSellerNames(sellerIds);
      return products.map((p) => (
        p.sellerId ? { ...p, seller: sellerNames[p.sellerId] ?? p.seller ?? '탈퇴한 판매자' } : p
      ));
    } catch (e) {
      // If the batch seller API fails (e.g. 404), fallback to the original products list
      // which might already contain the 'seller' field.
      return products;
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setList([]);
    setPage(0);
    setHasNext(false);
    setTotal(0);
    api.get(`${API_BASE}/products`, {
      params: {
        q: query || undefined,
        productType: productType !== 'all' ? productType : undefined,
        sort: sortParam,
        page: 0,
        size: PAGE_SIZE,
      },
    })
      .then(async (res) => {
        if (cancelledRef.current) return;
        const products: Prompt[] = res.data.data ?? [];
        const enriched = await enrichWithSellerNames(products);
        if (cancelledRef.current) return;
        setList(enriched);
        setHasNext(Boolean(res.data.meta?.hasNext));
        setTotal(res.data.meta?.total ?? products.length);
      })
      .catch(() => {})
      .finally(() => { if (!cancelledRef.current) setLoading(false); });
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, productType, sort]);

  const loadMore = () => {
    if (loadingMore || !hasNext) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    api.get(`${API_BASE}/products`, {
      params: {
        q: query || undefined,
        productType: productType !== 'all' ? productType : undefined,
        sort: sortParam,
        page: nextPage,
        size: PAGE_SIZE,
      },
    })
      .then(async (res) => {
        if (cancelledRef.current) return;
        const products: Prompt[] = res.data.data ?? [];
        const enriched = await enrichWithSellerNames(products);
        if (cancelledRef.current) return;
        setList((prev) => [...prev, ...enriched]);
        setPage(nextPage);
        setHasNext(Boolean(res.data.meta?.hasNext));
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

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

  const currentTypeLabel = productType === 'all' ? '전체 상품' : (PRODUCT_TYPE_LABEL[productType] ?? '전체 상품');
  const currentTypeDesc = PRODUCT_TYPE_BROWSE_DESC[productType] ?? PRODUCT_TYPE_BROWSE_DESC.all;
  const countLabel = productType === 'all' ? '상품' : (PRODUCT_TYPE_LABEL[productType] ?? '상품');

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '44px 32px 0' }}>
      <h1 style={{ fontSize: 33, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{currentTypeLabel}</h1>
      <p style={{ color: 'var(--ph-text-secondary)', fontSize: 16, margin: '0 0 28px' }}>
        {query ? <span>'{query}' 검색 결과 · </span> : <span>{currentTypeDesc} · </span>}{total}개의 {countLabel}
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
        <>
          <div
            className="ph-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
          >
            {list.map((p) => (
              <PromptCard key={p.id} p={p} showActions onOpen={(item) => router.push(`/detail/${item.id}`)} />
            ))}
          </div>

          {hasNext && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '36px 0' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  padding: '12px 36px',
                  borderRadius: 'var(--ph-radius-full)',
                  border: '1px solid var(--ph-border)',
                  background: 'var(--ph-surface)',
                  color: 'var(--ph-text)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loadingMore ? 'default' : 'pointer',
                  opacity: loadingMore ? 0.6 : 1,
                  fontFamily: 'var(--ph-font-family)',
                }}
              >
                {loadingMore ? '불러오는 중...' : '더보기'}
              </button>
            </div>
          )}
        </>
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
