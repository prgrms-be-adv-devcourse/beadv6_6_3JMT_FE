'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { hasPurchasedProduct } from '@/lib/orderAdapters';
import { getOrders } from '@/lib/orders';
import { addCartItem } from '@/lib/cart';
import { getWishlistIdForProduct, addWishlist, removeWishlist } from '@/lib/wishlists';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import { useToast } from '@/store/useToastStore';
import {
  ArrowLeft, Star,
  CheckCircle2, ShoppingCart, Check, History,
  ChevronDown, Info, Sparkles,
} from 'lucide-react';
import { ICON_MAP } from '@/lib/iconMap';
import ImageCarousel, { type CarouselSlide } from '@/components/ui/ImageCarousel';
import PromptCard from '@/components/ui/PromptCard';
import { won } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/* ── Types ─────────────────────────────────────────────────────────── */

type Prompt = {
  id: string;
  title: string;
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number;
  salesCount: number;
  seller: string;
  sellerId?: string;
  sellerProfileImageUrl?: string | null;
  sellerProductCount?: number;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  imageUrls?: string[];
  versions?: Version[];
  features?: string[];
};

type Version = { ver: string; date: string; note: string };

/* ── Mock data ──────────────────────────────────────────────────────── */


/* ── Icon utility ───────────────────────────────────────────────────── */

function Icon({ name, style }: { name: string; style?: React.CSSProperties }) {
  const C = ICON_MAP[name];
  return C ? <C style={style} /> : <Sparkles style={style} />;
}

/* ── Badge ──────────────────────────────────────────────────────────── */

function Badge({
  tone = 'neutral',
  soft = true,
  children,
  style,
}: {
  tone?: 'neutral' | 'blue';
  soft?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: 'var(--ph-radius-sm)',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };
  const toneStyle: React.CSSProperties =
    tone === 'blue' && !soft
      ? { background: 'var(--ph-primary)', color: '#fff' }
      : tone === 'blue'
      ? { background: 'var(--ph-secondary)', color: 'var(--ph-primary)', border: '1px solid color-mix(in srgb, var(--ph-primary) 20%, transparent)' }
      : { background: 'var(--ph-gray-100)', color: 'var(--ph-text-secondary)', border: '1px solid var(--ph-border)' };
  return <span style={{ ...base, ...toneStyle, ...style }}>{children}</span>;
}

/* ── Avatar ─────────────────────────────────────────────────────────── */

function Avatar({ name, size = 40, imageUrl }: { name: string; size?: number; imageUrl?: string | null }) {
  const initials = name.slice(0, 2);
  return imageUrl ? (
    <Image
      src={imageUrl}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--ph-secondary)',
        color: 'var(--ph-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

/* ── PriceTag ────────────────────────────────────────────────────────── */

function PriceTag({ p, size = 17, purchased = false }: { p: Prompt; size?: number; purchased?: boolean }) {
  const ic = Math.round(size * 0.72);
  if (purchased) {
    return (
      <span style={{ fontSize: size, fontWeight: 700, color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle2 style={{ width: ic, height: ic }} />구매함
      </span>
    );
  }
  if (p.amount === 0) return <span style={{ fontSize: size, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>;
  if (p.originalAmount && p.originalAmount > p.amount) {
    const pct = Math.round((1 - p.amount / p.originalAmount) * 100);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: size - 2, fontWeight: 700, color: 'var(--ph-error)' }}>{pct}%</span>
        <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.amount)}</span>
        <span style={{ fontSize: size - 4, color: 'var(--ph-text-muted)', textDecoration: 'line-through' }}>{won(p.originalAmount)}</span>
      </span>
    );
  }
  return <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.amount)}</span>;
}


/* ── Thumb (카드 썸네일 플레이스홀더) ───────────────────────────────── */

function Thumb({ icon, thumbnailUrl }: { icon: string; thumbnailUrl?: string | null }) {
  if (thumbnailUrl) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', overflow: 'hidden', position: 'relative', border: '1px solid var(--ph-border)' }}>
        <Image src={thumbnailUrl} alt="" fill style={{ objectFit: 'cover' }} />
      </div>
    );
  }
  if (thumbnailUrl === null) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
        <Image src="/images/promy-character.png" alt="" width={60} height={60} style={{ objectFit: 'contain', opacity: 0.85 }} />
      </div>
    );
  }
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
      <Icon name={icon || 'sparkles'} style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
    </div>
  );
}

/* ── CircleBtn ──────────────────────────────────────────────────────── */

function CircleBtn({
  icon,
  active,
  fill,
  onClick,
  label,
  activeColor = 'var(--ph-primary)',
}: {
  icon: 'heart' | 'shopping-cart' | 'check';
  active?: boolean;
  fill?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  label: string;
  activeColor?: string;
}) {
  const isHeart = icon === 'heart';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: 32, height: 32, borderRadius: 'var(--ph-radius-full)', border: '1px solid var(--ph-border)', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: active ? activeColor : 'var(--ph-text-secondary)', padding: 0 }}
    >
      {isHeart ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill={fill ? activeColor : 'none'} stroke={fill ? activeColor : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
        </svg>
      ) : icon === 'check' ? (
        <Check style={{ width: 16, height: 16 }} />
      ) : (
        <ShoppingCart style={{ width: 16, height: 16 }} />
      )}
    </button>
  );
}


/* ── DetailScreen ───────────────────────────────────────────────────── */

function DetailScreen({ p, related }: { p: Prompt; related: Prompt[] }) {
  const router = useRouter();
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const { items: wishItems, toggle } = useWishStore();
  const { items: cartItems, addItem, upsertItem, removeItem } = useCartStore();
  const showToast = useToast();
  const [showVersions, setShowVersions] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [wishlistId, setWishlistId] = useState<string | null>(null);

  const inWish = wishItems.some((i) => i.id === String(p.id));
  const inCart = cartItems.some((i) => i.productId === String(p.id));

  useEffect(() => {
    if (!isLoggedIn) return;
    getOrders()
      .then((orders) => {
        if (hasPurchasedProduct(orders, p.id)) setPurchased(true);
      })
      .catch(() => {});
    getWishlistIdForProduct(p.id)
      .then((id) => { if (id) setWishlistId(id); })
      .catch(() => {});
  }, [isLoggedIn, p.id]);

  const onBuy = () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    if (purchased) return;
    router.push(`/checkout?id=${p.id}`);
  };

  const onCart = () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    const productId = String(p.id);
    const item = { id: productId, productId, cartProductId: productId, title: p.title, amount: p.amount, thumbnailUrl: p.thumbnail_url ?? null };
    addItem(item);
    void addCartItem(productId)
      .then((saved) => {
        if (saved) upsertItem(saved);
      })
      .catch(() => {
        removeItem(productId);
        showToast('장바구니 담기에 실패했습니다.');
      });
  };

  const onWish = async () => {
    if (!isLoggedIn) { openLoginModal(); return; }
    const item = { id: String(p.id), title: p.title, amount: p.amount, thumbnailUrl: p.thumbnail_url ?? null };
    const wasInWish = inWish;
    toggle(item); // 낙관적 업데이트
    try {
      if (wasInWish && wishlistId) {
        await removeWishlist(wishlistId);
        setWishlistId(null);
      } else if (!wasInWish) {
        const data = await addWishlist(p.id);
        setWishlistId(data.wishlistId ?? null);
      }
    } catch (err: unknown) {
      toggle(item); // 실패 시 롤백
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(message ?? '찜 처리에 실패했어요. 다시 시도해주세요.');
    }
  };

  const features = p.features ?? ['결제 즉시 다운로드', '상업적 이용 가능', '무료 업데이트 제공'];
  const versions = p.versions ?? [];
  const latest = versions[0];

  const gallery: CarouselSlide[] = [
    { caption: '대표 이미지', icon: p.icon, tint: 'var(--ph-secondary)' },
    ...(p.imageUrls ?? []).map((url, i) => ({
      caption: `소개 이미지 ${i + 1}`,
      icon: 'image',
      tint: i % 2 === 0 ? 'var(--ph-gray-50)' : 'var(--ph-secondary)',
      imageUrl: url,
    })),
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 0' }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/browse')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-secondary)', fontFamily: 'var(--ph-font-family)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, padding: 0 }}
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> 탐색으로 돌아가기
      </button>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          <ImageCarousel slides={gallery} thumbnailUrl={p.thumbnail_url} />

          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>{p.model}</Badge>
            {p.badge && <Badge tone="blue" soft={false} style={{ whiteSpace: 'nowrap' }}>{p.badge}</Badge>}
          </div>

          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: '-0.01em', margin: '16px 0 0' }}>{p.title}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0 32px', color: 'var(--ph-text-secondary)', fontSize: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star style={{ width: 16, height: 16, fill: 'var(--ph-primary)', color: 'var(--ph-primary)' } as React.CSSProperties} />
              <b style={{ color: 'var(--ph-text)' }}>{p.rating}</b>
            </span>
            <span>·</span>
            <span>{p.salesCount.toLocaleString()}회 판매</span>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px' }}>프롬프트 소개</h3>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ph-text-secondary)', margin: 0, maxWidth: 620 }}>{p.desc}</p>

          <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 16px' }}>판매자</h3>
          <Card padding="20px" style={{ maxWidth: 420, display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={p.seller} size={48} imageUrl={p.sellerProfileImageUrl} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.seller}</div>
              <div style={{ color: 'var(--ph-text-muted)', fontSize: 14 }}>검증된 크리에이터</div>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 버전 상태 배너 (구매한 경우에만 표시) */}
          {purchased && latest && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', background: 'var(--ph-gray-50)', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-md)', fontSize: 13, fontWeight: 600, color: 'var(--ph-text-secondary)' }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--ph-primary)' }} /> 최신 버전({latest.ver})을 보유하고 있어요
            </div>
          )}

          {/* 구매 카드 */}
          <Card padding="24px">
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              <PriceTag p={p} size={32} purchased={purchased} />
            </div>
            <div style={{ color: 'var(--ph-text-muted)', fontSize: 14, marginTop: 4 }}>
              {purchased
                ? '이미 보유한 프롬프트예요'
                : p.amount === 0
                ? '무료 제공 · 구매 없이 바로 사용'
                : '1회 결제 · 영구 이용'}
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button
                variant="solid"
                size="lg"
                fullWidth
                onClick={onBuy}
                disabled={purchased}
              >
                {purchased
                  ? p.amount === 0 ? '받기 완료 ✓' : '구매 완료 ✓'
                  : p.amount === 0 ? '무료로 받기' : '프롬프트 구매하기'}
              </Button>

              <div style={{ display: 'flex', gap: 10 }}>
                {p.amount !== 0 && (
                  <div style={{ flex: 1 }}>
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      onClick={onCart}
                    >
                      {inCart
                        ? <><Check style={{ width: 17, height: 17 }} /> 담긴</>
                        : <><ShoppingCart style={{ width: 17, height: 17 }} /> 장바구니</>}
                    </Button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={onWish}
                  >
                    <svg viewBox="0 0 24 24" width="17" height="17" fill={inWish ? '#FF3040' : 'none'} stroke={inWish ? '#FF3040' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
                    </svg>
                    {' '}찜
                  </Button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {features.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ph-text-secondary)' }}>
                  <CheckCircle2 style={{ width: 17, height: 17, color: 'var(--ph-primary)', flexShrink: 0 }} />{f}
                </div>
              ))}
            </div>
          </Card>

          {/* 버전 기록 */}
          <Card padding="0" style={{ overflow: 'hidden' }}>
            <button
              onClick={() => setShowVersions((v) => !v)}
              aria-expanded={showVersions}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', textAlign: 'left' }}
            >
              <History style={{ width: 18, height: 18, color: 'var(--ph-primary)', flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ph-text)' }}>버전 기록</span>
              {latest && <Badge tone="neutral" style={{ whiteSpace: 'nowrap' }}>{latest.ver}</Badge>}
              <ChevronDown style={{ width: 18, height: 18, color: 'var(--ph-text-muted)', marginLeft: 'auto', transform: showVersions ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' } as React.CSSProperties} />
            </button>

            {showVersions && (
              <div style={{ borderTop: '1px solid var(--ph-border)', padding: '6px 18px 14px' }}>
                {versions.map((v, idx) => {
                  const isCurrent = idx === 0;
                  return (
                    <div
                      key={v.ver}
                      style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: idx === versions.length - 1 ? 'none' : '1px solid var(--ph-border)', opacity: isCurrent ? 1 : 0.5 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 3 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: isCurrent ? 'var(--ph-primary)' : 'var(--ph-gray-line)', flexShrink: 0 }} />
                        {idx !== versions.length - 1 && <span style={{ width: 2, flex: 1, background: 'var(--ph-border)', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ph-text)' }}>{v.ver}</span>
                          <span style={{ fontSize: 13, color: 'var(--ph-text-muted)' }}>{v.date}</span>
                          {isCurrent
                            ? <Badge tone="blue" soft={false} style={{ whiteSpace: 'nowrap' }}>현재</Badge>
                            : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ph-text-muted)' }}>구매 불가</span>}
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--ph-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{v.note}</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12.5, color: 'var(--ph-text-muted)' }}>
                  <Info style={{ width: 14, height: 14, flexShrink: 0 }} /> 구매는 최신 버전에만 가능하며, 이전 버전은 구매할 수 없어요.
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Related prompts */}
      {related.length > 0 && (
        <section style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 27, fontWeight: 700, margin: '0 0 24px' }}>비슷한 프롬프트</h2>
          <div className="ph-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {related.map((r) => (
              <PromptCard key={r.id} p={r} detailBadge onOpen={(rp) => router.push(`/detail/${rp.id}`)} />
            ))}
          </div>
        </section>
      )}


      <div style={{ height: 80 }} />
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [product, setProduct] = useState<Prompt | null>(null);
  const [related, setRelated] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`${API_BASE}/products/${id}`),
      api.get(`${API_BASE}/products/${id}/related`),
    ])
      .then(([pRes, rRes]) => {
        setProduct(pRes.data.data);
        setRelated(rRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', textAlign: 'center', color: 'var(--ph-text-muted)' }}>불러오는 중...</div>;

  if (!product) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 17, color: 'var(--ph-text-secondary)', marginBottom: 24 }}>프롬프트를 찾을 수 없어요.</p>
        <button
          onClick={() => router.push('/browse')}
          style={{ background: 'var(--ph-primary)', color: '#fff', border: 'none', borderRadius: 'var(--ph-radius-md)', padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--ph-font-family)' }}
        >
          탐색으로 돌아가기
        </button>
      </div>
    );
  }

  return <DetailScreen p={product} related={related} />;
}
