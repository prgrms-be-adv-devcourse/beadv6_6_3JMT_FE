'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useWishStore } from '@/store/useWishStore';
import { useToast } from '@/store/useToastStore';
import Logo from '@/components/ui/Logo';
import api from '@/lib/auth';
import { API_BASE } from '@/lib/apiBase';
import { won } from '@/lib/utils';
import { getCartItems, removeCartItem as deleteCartItem } from '@/lib/cart';
import { createOrder } from '@/lib/orders';
import { getProductSuggestions } from '@/lib/products';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '@/lib/recentSearches';
import {
  Search,
  Bell,
  ShoppingCart,
  Heart,
  Menu,
  X,
  Compass,
  User,
  Store,
  Receipt,
  Settings,
  LogOut,
  Trash2,
} from 'lucide-react';

/* ── 타입 ──────────────────────────────────────────────── */

export type UserRole = 'buyer' | 'seller';

export interface PHUser {
  name: string;
  role: UserRole;
}

export interface CartItem {
  id: string;
  title: string;
  amount: number;
}

/* ── 헬퍼: 상대 시간 ─────────────────────────────────── */

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '어제';
  return `${days}일 전`;
}

/* ── 타입: 알림 ───────────────────────────────────────── */

type Notif = { id: string; icon: string; text: string; timestamp: string; read: boolean };

/* ── 라우트 맵 ─────────────────────────────────────────── */

const PAGE_ROUTES: Record<string, string> = {
  home: '/',
  browse: '/browse',
  sell: '/sell',
  shop: '/shop',
};

/* ── SearchBar ─────────────────────────────────────────── */

const SUGGEST_DEBOUNCE_MS = 200;

/** 제안어에서 입력한 문자열이 나타나는 부분을 강조한다. BE가 중간 단어도 매칭하므로 앞부분에 한정하지 않는다. */
function highlightMatch(suggestion: string, keyword: string) {
  const at = suggestion.toLowerCase().indexOf(keyword.toLowerCase());
  if (!keyword || at < 0) return suggestion;

  return (
    <>
      {suggestion.slice(0, at)}
      <mark style={{ background: 'none', color: 'var(--ph-primary)', fontWeight: 600 }}>
        {suggestion.slice(at, at + keyword.length)}
      </mark>
      {suggestion.slice(at + keyword.length)}
    </>
  );
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  size = 'header',
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: (v: string) => void;
  size?: 'hero' | 'header' | 'lg';
}) {
  const pathname = usePathname();
  const [focus, setFocus] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  // 사용자가 제안을 고르거나 Esc로 닫은 뒤, 같은 입력값으로 드롭다운이 다시 열리지 않게 한다.
  const suppressed = React.useRef('');
  const boxRef = React.useRef<HTMLDivElement>(null);

  const hero = size === 'hero';
  const pad = hero ? '0 8px 0 22px' : '0 6px 0 16px';
  const h = hero ? 64 : 44;

  const keyword = value.trim();
  // 입력이 비어 있으면 최근 검색어, 입력 중이면 상품명 제안 — 드롭다운 하나를 나눠 쓴다.
  const showRecent = keyword === '' && recent.length > 0;
  const items = showRecent ? recent : suggestions;

  // localStorage는 서버 렌더링 시 없으므로 마운트 후에 읽는다.
  React.useEffect(() => setRecent(getRecentSearches()), []);

  React.useEffect(() => {
    if (!keyword || keyword === suppressed.current) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const result = await getProductSuggestions(keyword, controller.signal);
      if (controller.signal.aborted) return;
      setSuggestions(result);
      setActive(-1);
      setOpen(result.length > 0);
    }, SUGGEST_DEBOUNCE_MS);

    // 입력이 바뀌면 대기 중인 타이머와 진행 중인 요청을 모두 버린다.
    // 이렇게 하지 않으면 느린 이전 요청이 나중에 도착해 최신 제안을 덮어쓴다.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [keyword]);

  React.useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocPointerDown);
    return () => document.removeEventListener('mousedown', onDocPointerDown);
  }, [open]);

  // Header는 레이아웃 컴포넌트라 페이지를 옮겨도 언마운트되지 않는다. 닫아주지 않으면
  // 검색 후 이동한 화면에도 드롭다운이 그대로 떠 있는다.
  React.useEffect(() => {
    setOpen(false);
    setActive(-1);
    setSuggestions([]);
    suppressed.current = value.trim();
    // value는 의도적으로 의존성에서 뺀다 — 경로가 바뀔 때만 닫는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const choose = (picked: string) => {
    suppressed.current = picked;
    setRecent(addRecentSearch(picked));
    setOpen(false);
    setActive(-1);
    onChange(picked);
    onSubmit && onSubmit(picked);
  };

  const dropRecent = (target: string) => setRecent(removeRecentSearch(target));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      suppressed.current = keyword;
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === 'ArrowDown' && !open && (showRecent || suggestions.length > 0)) {
      // 닫혀 있을 때 아래 화살표로 다시 연다 — 빈 입력에서 최근 검색어를 꺼내는 주 경로다.
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      // 항목을 고른 상태면 form submit 대신 그 항목으로 검색한다.
      e.preventDefault();
      choose(items[active]);
    }
  };

  const listboxId = React.useId();

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%' }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          suppressed.current = keyword;
          setRecent(addRecentSearch(keyword));
          setOpen(false);
          onSubmit && onSubmit(value);
        }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          height: h, background: 'var(--ph-white)', padding: pad,
          borderRadius: hero ? 'var(--ph-radius-xl)' : 'var(--ph-radius-md)',
          border: `1px solid ${focus ? 'var(--ph-primary)' : 'var(--ph-border)'}`,
          transition: 'border-color .15s ease',
        }}
      >
        <Search style={{ width: hero ? 22 : 18, height: hero ? 22 : 18, color: 'var(--ph-text-muted)', flexShrink: 0 }} />
        <input
          value={value}
          onChange={(e) => { suppressed.current = ''; onChange(e.target.value); }}
          onFocus={() => { setFocus(true); if (showRecent || suggestions.length > 0) setOpen(true); }}
          onBlur={() => setFocus(false)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listboxId}-${active}` : undefined}
          placeholder={hero ? '어떤 작업에 필요한 프롬프트를 찾으세요?' : '상품, 크리에이터 검색'}
          style={{
            flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'var(--ph-font-family)', fontSize: hero ? 18 : 15, color: 'var(--ph-text)',
          }}
        />
        <button
          type="submit"
          style={{
            flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)',
            fontWeight: 600, color: '#fff', background: 'var(--ph-primary)',
            borderRadius: hero ? 'calc(var(--ph-radius-xl) - 6px)' : 'var(--ph-radius-sm)',
            height: hero ? 50 : 34, padding: hero ? '0 24px' : '0 14px', fontSize: hero ? 16 : 14,
          }}
        >검색</button>
      </form>

      {open && items.length > 0 && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 60,
            padding: 6,
            background: 'var(--ph-white)', border: '1px solid var(--ph-border)',
            borderRadius: 'var(--ph-radius-lg)',
          }}
        >
          {showRecent && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '4px 12px 8px', fontFamily: 'var(--ph-font-family)', fontSize: 13,
              color: 'var(--ph-text-muted)',
            }}>
              <span>최근 검색어</span>
              <button
                type="button"
                onClick={() => setRecent(clearRecentSearches())}
                style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontFamily: 'var(--ph-font-family)', fontSize: 13, color: 'var(--ph-text-muted)',
                  padding: 0,
                }}
              >전체 삭제</button>
            </div>
          )}

          <ul id={listboxId} role="listbox" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((item, i) => (
              <li
                key={item}
                id={`${listboxId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: 'flex', alignItems: 'center',
                  borderRadius: 'var(--ph-radius-sm)',
                  background: i === active ? 'var(--ph-bg-soft, #f5f5f5)' : 'transparent',
                }}
              >
                <button
                  type="button"
                  onClick={() => choose(item)}
                  style={{
                    flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer',
                    border: 'none', background: 'none',
                    fontFamily: 'var(--ph-font-family)', fontSize: 15, color: 'var(--ph-text)',
                    padding: '10px 12px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {showRecent ? item : highlightMatch(item, keyword)}
                </button>

                {showRecent && (
                  <button
                    type="button"
                    aria-label={`${item} 삭제`}
                    onClick={() => dropRecent(item)}
                    style={{
                      flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', padding: '10px 12px',
                      color: 'var(--ph-text-muted)',
                    }}
                  >
                    <X style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── NavLink ───────────────────────────────────────────── */

function NavLink({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)',
        fontSize: 15, fontWeight: active ? 700 : 500, color: active ? 'var(--ph-text)' : 'var(--ph-text-secondary)',
        padding: '8px 10px',
      }}
    >{label}</button>
  );
}

/* ── MenuItem ──────────────────────────────────────────── */

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', borderRadius: 'var(--ph-radius-sm)',
        fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 500, color: danger ? 'var(--ph-error)' : 'var(--ph-text)' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--ph-gray-50)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
    >
      <Icon style={{ width: 17, height: 17 }} />{label}
    </button>
  );
}

/* ── IconBtn ───────────────────────────────────────────── */

function IconBtn({
  icon: Icon,
  label,
  dot,
  count,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label?: string | null;
  dot?: boolean;
  count?: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label ?? undefined}
      aria-label={label ?? undefined}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        height: 40, padding: label ? '0 12px' : '0', width: label ? 'auto' : 40,
        background: active ? 'var(--ph-secondary)' : 'none', border: 'none', borderRadius: 'var(--ph-radius-md)',
        cursor: 'pointer', color: active ? 'var(--ph-primary)' : 'var(--ph-text-secondary)',
        fontFamily: 'var(--ph-font-family)', fontSize: 15, fontWeight: 600 }}
    >
      <Icon style={{ width: 20, height: 20 }} />
      {label && <span>{label}</span>}
      {dot && <span style={{ position: 'absolute', top: 8, right: label ? 8 : 9, width: 7, height: 7, borderRadius: '50%', background: 'var(--ph-primary)', border: '1.5px solid #fff' }}></span>}
      {(count ?? 0) > 0 && <span style={{ position: 'absolute', top: 3, right: 3, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 9999, background: 'var(--ph-primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>}
    </button>
  );
}

/* ── Pop (드롭다운) ──────────────────────────────────────── */

function Pop({ children, onClose, width = 280 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50 }}></div>
      <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 51, width, background: '#fff', border: '1px solid var(--ph-border)', borderRadius: 'var(--ph-radius-lg)', padding: 8 }}>
        {children}
      </div>
    </React.Fragment>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */

function Avatar({ name, size = 34, imageUrl }: { name: string; size?: number; imageUrl?: string | null }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  if (imageUrl) {
    return (
      <span style={{
        display: 'inline-flex', width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
      }}>
        <Image src={imageUrl} alt={name} width={size} height={size} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: 'var(--ph-secondary)', color: 'var(--ph-primary)',
      fontSize: size * 0.38, fontWeight: 700, fontFamily: 'var(--ph-font-family)',
      flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

/* ── Header ─────────────────────────────────────────────── */

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const { user, logout, openLoginModal } = useAuthStore();
  const { items: cart, setItems: setCartItems, removeItem: removeCartItem, clearCart } = useCartStore();
  const { items: wishItems } = useWishStore();
  const showToast = useToast();
  const [query, setQuery] = React.useState('');
  const [menu, setMenu] = React.useState<string | null>(null);
  const [notifList, setNotifList] = React.useState<Notif[]>([]);
  const [ordering, setOrdering] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setNotifList([]));
      return;
    }
    api.get(`${API_BASE}/notifications`)
      .then((res) => setNotifList(res.data.data ?? []))
      .catch(() => {});
  }, [user]);

  React.useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setCartItems([]));
      return;
    }
    getCartItems()
      .then(setCartItems)
      .catch(() => {});
  }, [setCartItems, user]);

  const unreadCount = notifList.filter((n) => !n.read).length;

  const onNotifRead = async (id: string) => {
    setNotifList((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      await api.post(`${API_BASE}/notifications/${id}/read`);
    } catch {
      // 로컬 상태는 이미 업데이트됨, 실패해도 무시
    }
  };

  const go = (page: string) => router.push(PAGE_ROUTES[page] ?? '/');
  const onSearch = (q: string) => { setQuery(q); router.push(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse'); };
  const openLogin = () => openLoginModal();
  const onLogout = async () => {
    try {
      await api.post(`${API_BASE}/auth/logout`);
    } catch {
      // 로그아웃 API 실패해도 로컬 로그아웃은 반드시 실행
    } finally {
      logout();
    }
  };
  const onRemoveFromCart = async (cartProductId: string) => {
    try {
      await deleteCartItem(cartProductId);
      removeCartItem(cartProductId);
    } catch {
      // API 실패 시 서버와 로컬 장바구니가 어긋나지 않도록 로컬 반영을 보류합니다.
    }
  };
  const onOrder = async () => {
    if (ordering || cart.length === 0) return;
    setOrdering(true);
    try {
      await createOrder(cart.map((it) => ({ productId: it.productId, productTitle: it.title })));
      clearCart();
      router.push('/mypage?tab=payments');
    } catch {
      showToast('주문 생성에 실패했어요. 다시 시도해주세요.');
    } finally {
      setOrdering(false);
    }
  };

  const current = pathname === '/' ? 'home' : pathname.split('/')[1];

  const toggle = (m: string) => setMenu((x) => (x === m ? null : m));
  const close = () => setMenu(null);
  const hasRole = (r: string) => user?.roles?.includes(r) ?? false;
  const openMy = (tab: string) => { close(); router.push(`/mypage?tab=${tab}`); };

  const BellDropdown = (
    <div style={{ position: 'relative' }}>
      <IconBtn
        icon={Bell}
        label={null}
        count={unreadCount || undefined}
        active={menu === 'notif'}
        onClick={() => toggle('notif')}
      />
      {menu === 'notif' && (
        <Pop onClose={close} width={300}>
          <div style={{ padding: '8px 12px 10px', fontWeight: 700, fontSize: 14 }}>알림</div>
          {notifList.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 13, color: 'var(--ph-text-muted)' }}>
              새 알림이 없어요
            </div>
          ) : (
            notifList.map((n) => (
              <button
                key={n.id}
                onClick={() => onNotifRead(n.id)}
                style={{
                  display: 'flex', gap: 10, padding: '10px 12px', width: '100%',
                  background: n.read ? 'none' : 'var(--ph-secondary)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderRadius: 'var(--ph-radius-sm)',
                }}
              >
                <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                  {n.icon}
                </span>
                <div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ph-text)', fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--ph-text-muted)', marginTop: 2 }}>{relativeTime(n.timestamp)}</div>
                </div>
              </button>
            ))
          )}
        </Pop>
      )}
    </div>
  );

  const CartDropdown = (
    <div style={{ position: 'relative' }}>
      <IconBtn icon={ShoppingCart} label={null} count={cart.length} active={menu === 'cart'} onClick={() => toggle('cart')} />
      {menu === 'cart' && (
        <Pop onClose={close} width={320}>
          <div style={{ padding: '8px 12px 10px', fontWeight: 700, fontSize: 14 }}>
            장바구니 {cart.length > 0 && <span style={{ color: 'var(--ph-primary)' }}>{cart.length}</span>}
          </div>
          {cart.length === 0 ? (
            <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--ph-text-muted)', fontSize: 13 }}>
              <ShoppingCart style={{ width: 28, height: 28 }} />
              <div style={{ marginTop: 8 }}>장바구니가 비어 있어요</div>
            </div>
          ) : (
            <React.Fragment>
              {cart.map((it) => (
                <div key={it.cartProductId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13 }}>
                  <span style={{ flex: 1, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{it.amount === 0 ? '무료' : won(it.amount)}</span>
                  <button
                    onClick={() => onRemoveFromCart(it.cartProductId)}
                    aria-label="삭제"
                    style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4, borderRadius: 'var(--ph-radius-sm)' }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid var(--ph-border)', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--ph-text-secondary)' }}>합계</span>
                <span style={{ fontWeight: 700 }}>{won(cart.reduce((s, x) => s + x.amount, 0))}</span>
              </div>
              <div style={{ padding: 8 }}>
                <button
                  onClick={() => { close(); onOrder(); }}
                  disabled={ordering}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 36, border: 'none', borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)', color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600, cursor: ordering ? 'not-allowed' : 'pointer', opacity: ordering ? 0.6 : 1 }}
                >{ordering ? '처리 중...' : '주문하기'}</button>
              </div>
            </React.Fragment>
          )}
        </Pop>
      )}
    </div>
  );

  const UserMenuDropdown = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => toggle('user')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', borderRadius: 'var(--ph-radius-full)' }}
      >
        <Avatar name={user ? user.name : ''} size={34} imageUrl={user?.profileImageUrl} />
      </button>
      {menu === 'user' && user && (
        <Pop onClose={close} width={240}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
            <Avatar name={user.name} size={40} imageUrl={user.profileImageUrl} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{hasRole('admin') ? '관리자 계정' : hasRole('seller') ? '판매자 계정' : '구매자 계정'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '4px 0' }}></div>
          <MenuItem icon={User} label="마이페이지" onClick={() => openMy('profile')} />
          {hasRole('seller')
            ? <MenuItem icon={Store} label="내 상점" onClick={() => { close(); go('shop'); }} />
            : <MenuItem icon={Receipt} label="구매한 프롬프트" onClick={() => openMy('purchased')} />}
          <MenuItem icon={Settings} label="설정" onClick={() => openMy('settings')} />
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '4px 0' }}></div>
          <MenuItem icon={LogOut} label="로그아웃" danger onClick={() => { close(); onLogout(); }} />
        </Pop>
      )}
    </div>
  );

  const Hamburger = (
    <div className="ph-hamburger" style={{ position: 'relative' }}>
      <IconBtn icon={menu === 'mobile' ? X : Menu} label={null} active={menu === 'mobile'} onClick={() => toggle('mobile')} />
      {menu === 'mobile' && (
        <Pop onClose={close} width={290}>
          <div style={{ padding: 8 }}>
            <SearchBar value={query} onChange={setQuery} onSubmit={(q) => { close(); onSearch(q); }} size="header" />
          </div>
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '4px 0' }}></div>
          <MenuItem icon={Compass} label="탐색" onClick={() => { close(); onSearch(''); }} />
        </Pop>
      )}
    </div>
  );

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--ph-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 66, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Logo onClick={() => go('home')} />
        <nav className="ph-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NavLink label="탐색" active={current === 'browse'} onClick={() => onSearch('')} />
        </nav>
        <div className="ph-header-search" style={{ flex: 1, maxWidth: 340, marginLeft: 8 }}>
          <SearchBar value={query} onChange={setQuery} onSubmit={onSearch} size="header" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
          {Hamburger}
          {!user && (
            <button
              onClick={openLogin}
              style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontWeight: 600, color: '#fff', background: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-md)', height: 36, padding: '0 14px', fontSize: 14 }}
            >로그인</button>
          )}
          {hasRole('seller') && (
            <React.Fragment>
              <button
                onClick={() => go('sell')}
                style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontWeight: 600, color: '#fff', background: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-md)', height: 36, padding: '0 14px', fontSize: 14 }}
              >판매하기</button>
              <IconBtn icon={Store} label="내 상점" active={current === 'shop'} onClick={() => go('shop')} />
              <IconBtn icon={Heart} label={null} count={wishItems.length || undefined} onClick={() => router.push('/mypage?tab=wish')} />
              {CartDropdown}
              {BellDropdown}
              {UserMenuDropdown}
            </React.Fragment>
          )}
          {!hasRole('seller') && (hasRole('buyer') || hasRole('admin')) && (
            <React.Fragment>
              <IconBtn icon={Heart} label={null} count={wishItems.length || undefined} onClick={() => router.push('/mypage?tab=wish')} />
              {CartDropdown}
              {BellDropdown}
              {UserMenuDropdown}
            </React.Fragment>
          )}
        </div>
      </div>
    </header>
  );
}
