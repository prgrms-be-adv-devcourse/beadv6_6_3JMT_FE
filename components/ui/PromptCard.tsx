'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Star, Heart, ShoppingCart, Clock, Sparkles,
} from 'lucide-react';
import { ICON_MAP } from '@/lib/iconMap';
import { useAuthStore } from '@/store/useAuthStore';
import { useWishStore } from '@/store/useWishStore';
import { useCartStore } from '@/store/useCartStore';
import { won } from '@/lib/utils';

/* ── 공유 Prompt 타입 ────────────────────────────────────────────── */

export interface PromptItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  model: string;
  amount: number;
  originalAmount?: number;
  rating: number | string;
  salesCount: number;
  seller: string;
  badge?: string;
  desc: string;
  thumbnail_url?: string | null;
  status?: 'review' | 'active';
}

/* ── Thumb ───────────────────────────────────────────────────────── */

function Thumb({ p }: { p: PromptItem }) {
  if (p.thumbnail_url) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', overflow: 'hidden', position: 'relative', border: '1px solid var(--ph-border)' }}>
        <Image src={p.thumbnail_url} alt="" fill style={{ objectFit: 'cover' }} />
      </div>
    );
  }
  if (p.thumbnail_url === null) {
    return (
      <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
        <Image src="/images/promy-character.png" alt="" width={60} height={60} style={{ objectFit: 'contain', opacity: 0.85 }} />
      </div>
    );
  }
  const Icon = ICON_MAP[p.icon] ?? Sparkles;
  return (
    <div style={{ height: 150, borderRadius: 'var(--ph-radius-lg)', background: 'var(--ph-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--ph-border)' }}>
      <Icon style={{ width: 40, height: 40, color: 'var(--ph-primary)', opacity: 0.85 } as React.CSSProperties} />
    </div>
  );
}

/* ── PriceTag ────────────────────────────────────────────────────── */

function PriceTag({ p }: { p: PromptItem }) {
  if (p.amount === 0) return <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ph-primary)' }}>무료</span>;
  if (p.originalAmount && p.originalAmount > p.amount) {
    const pct = Math.round((1 - p.amount / p.originalAmount) * 100);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ph-error)' }}>{pct}%</span>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.amount)}</span>
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', textDecoration: 'line-through' }}>{won(p.originalAmount)}</span>
      </span>
    );
  }
  return <span style={{ fontSize: 17, fontWeight: 700 }}>{won(p.amount)}</span>;
}

/* ── StatusBadge (shop 판매 상태) ────────────────────────────────── */

export function StatusBadge({ status, stopped }: { status?: string; stopped?: boolean }) {
  if (stopped) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-gray-100)', color: 'var(--ph-gray-600)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        판매 중단
      </span>
    );
  }
  if (status === 'review') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-text)', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
        <Clock style={{ width: 12, height: 12 }} /> 검수중
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 11px', borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-primary)', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      판매중
    </span>
  );
}

/* ── PromptCard ──────────────────────────────────────────────────── */

interface PromptCardProps {
  p: PromptItem;
  onOpen?: (p: PromptItem) => void;
  onClick?: () => void;
  disabled?: boolean;
  showStatus?: boolean;
  stopped?: boolean;
  showActions?: boolean;
  detailBadge?: boolean;
}

export default function PromptCard({
  p,
  onOpen,
  onClick,
  disabled,
  showStatus,
  stopped,
  showActions,
  detailBadge,
}: PromptCardProps) {
  const [hovered, setHovered] = useState(false);
  const { isLoggedIn, openLoginModal } = useAuthStore();
  const { items: wishItems, toggle } = useWishStore();
  const { addItem } = useCartStore();

  const isWished = wishItems.some((i) => i.id === String(p.id));
  const isClickable = !disabled && (!!onOpen || !!onClick);

  const handleClick = () => {
    if (!isClickable) return;
    if (onOpen) { onOpen(p); return; }
    if (onClick) onClick();
  };

  const onWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { openLoginModal(); return; }
    toggle({ id: String(p.id), title: p.title, amount: p.amount, thumbnailUrl: p.thumbnail_url ?? null });
  };

  const onCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { openLoginModal(); return; }
    addItem({ id: String(p.id), title: p.title, amount: p.amount, thumbnailUrl: p.thumbnail_url ?? null });
  };

  /* detail 페이지 관련 카드는 gray-100, 나머지는 gray-50 */
  const modelBg = detailBadge ? 'var(--ph-gray-100)' : 'var(--ph-gray-50)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        background: 'var(--ph-surface)',
        border: `1px solid ${hovered && isClickable ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
        borderRadius: 'var(--ph-radius-lg)',
        padding: 14,
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        transition: 'border-color .15s ease',
      }}
    >
      <div className="ph-card-media" style={{ position: 'relative' }}>
        <Thumb p={p} />

        {(p.amount === 0 || p.badge) && (
          <div style={{ position: 'absolute', top: 10, left: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '4px 8px',
              borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)',
              color: '#fff', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              {p.amount === 0 ? '무료' : p.badge}
            </span>
          </div>
        )}

        {showStatus && (
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
            <StatusBadge status={p.status} stopped={stopped} />
          </div>
        )}

        {showActions && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={onWish}
              title="찜하기"
              style={{
                width: 32, height: 32, borderRadius: 'var(--ph-radius-md)',
                background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <Heart style={{ width: 16, height: 16, color: isWished ? 'var(--ph-error)' : 'var(--ph-text-muted)', fill: isWished ? 'var(--ph-error)' : 'none' } as React.CSSProperties} />
            </button>
            {p.amount !== 0 && (
              <button
                onClick={onCart}
                title="장바구니 담기"
                style={{
                  width: 32, height: 32, borderRadius: 'var(--ph-radius-md)',
                  background: 'rgba(255,255,255,0.92)', border: '1px solid var(--ph-border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0,
                }}
              >
                <ShoppingCart style={{ width: 16, height: 16, color: 'var(--ph-text-muted)' } as React.CSSProperties} />
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 8px',
          borderRadius: 'var(--ph-radius-sm)', background: modelBg,
          border: '1px solid var(--ph-border)', fontSize: 12, fontWeight: 600,
          color: 'var(--ph-text-secondary)', whiteSpace: 'nowrap',
        }}>
          {p.model}
        </span>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: 'var(--ph-text)' }}>{p.title}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ph-text-muted)', fontSize: 13 }}>
        <Star style={{ width: 14, height: 14, color: 'var(--ph-primary)', fill: 'var(--ph-primary)' } as React.CSSProperties} />
        <span style={{ color: 'var(--ph-text)', fontWeight: 600 }}>{p.rating}</span>
        <span>·</span>
        <span>{p.seller}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
        <PriceTag p={p} />
        <span style={{ fontSize: 13, color: 'var(--ph-text-muted)', whiteSpace: 'nowrap' }}>
          {p.salesCount.toLocaleString()}회 판매
        </span>
      </div>
    </div>
  );
}
