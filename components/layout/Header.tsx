'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sparkles,
  Search,
  Bell,
  ShoppingCart,
  Tag,
  Download,
  Star,
  Menu,
  X,
  Compass,
  LayoutGrid,
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
  price: number;
}

/* ── 헬퍼: 금액 포맷 ───────────────────────────────────── */

function won(n: number) {
  return '₩' + n.toLocaleString();
}

/* ── 라우트 맵 ─────────────────────────────────────────── */

const PAGE_ROUTES: Record<string, string> = {
  home: '/',
  browse: '/browse',
  sell: '/sell',
  shop: '/shop',
};

/* ── Logo ──────────────────────────────────────────────── */

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--ph-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Sparkles style={{ width: 17, height: 17 }} />
      </span>
      <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ph-text)' }}>
        Prompt<span style={{ color: 'var(--ph-primary)' }}>Hub</span>
      </span>
    </button>
  );
}

/* ── SearchBar ─────────────────────────────────────────── */

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
  const [focus, setFocus] = React.useState(false);
  const hero = size === 'hero';
  const pad = hero ? '0 8px 0 22px' : '0 6px 0 16px';
  const h = hero ? 64 : 44;
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit && onSubmit(value); }}
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
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={hero ? '어떤 작업에 필요한 프롬프트를 찾으세요?' : '프롬프트, 크리에이터 검색'}
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

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
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

  const [query, setQuery] = React.useState('');
  const [user, setUser] = React.useState<PHUser | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [menu, setMenu] = React.useState<string | null>(null);

  const go = (page: string) => router.push(PAGE_ROUTES[page] ?? '/');
  const onSearch = (q: string) => { setQuery(q); router.push('/browse'); };
  const openLogin = () => {};
  const onLogout = () => setUser(null);
  const onRemoveFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  const current = pathname === '/' ? 'home' : pathname.replace('/', '');

  const toggle = (m: string) => setMenu((x) => (x === m ? null : m));
  const close = () => setMenu(null);
  const role = user && user.role;
  const openMy = (tab: string) => { close(); router.push(`/mypage?tab=${tab}`); };

  const notifs = [
    { icon: Tag, text: "찜한 '랜딩 카피 작성'의 가격이 인하됐어요.", time: '방금' },
    { icon: Download, text: '구매한 프롬프트가 업데이트됐어요.', time: '2시간 전' },
    { icon: Star, text: role === 'seller' ? '내 프롬프트에 새 후기(★5)가 달렸어요.' : '이번 주 인기 프롬프트를 확인해 보세요.', time: '어제' },
  ];

  const BellDropdown = (
    <div style={{ position: 'relative' }}>
      <IconBtn icon={Bell} label={null} dot active={menu === 'notif'} onClick={() => toggle('notif')} />
      {menu === 'notif' && (
        <Pop onClose={close} width={300}>
          <div style={{ padding: '8px 12px 10px', fontWeight: 700, fontSize: 14 }}>알림</div>
          {notifs.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px' }}>
              <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 'var(--ph-radius-full)', background: 'var(--ph-secondary)', color: 'var(--ph-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <n.icon style={{ width: 16, height: 16 }} />
              </span>
              <div>
                <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ph-text)' }}>{n.text}</div>
                <div style={{ fontSize: 12, color: 'var(--ph-text-muted)', marginTop: 2 }}>{n.time}</div>
              </div>
            </div>
          ))}
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
                <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 13 }}>
                  <span style={{ flex: 1, color: 'var(--ph-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                  <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{it.price === 0 ? '무료' : won(it.price)}</span>
                  <button
                    onClick={() => onRemoveFromCart(it.id)}
                    aria-label="삭제"
                    style={{ display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ph-text-muted)', padding: 4, borderRadius: 'var(--ph-radius-sm)' }}
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderTop: '1px solid var(--ph-border)', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--ph-text-secondary)' }}>합계</span>
                <span style={{ fontWeight: 700 }}>{won(cart.reduce((s, x) => s + x.price, 0))}</span>
              </div>
              <div style={{ padding: 8 }}>
                <button
                  onClick={close}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 36, border: 'none', borderRadius: 'var(--ph-radius-sm)', background: 'var(--ph-primary)', color: '#fff', fontFamily: 'var(--ph-font-family)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >결제하기</button>
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
        <Avatar name={user ? user.name : ''} size={34} />
      </button>
      {menu === 'user' && user && (
        <Pop onClose={close} width={240}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
            <Avatar name={user.name} size={40} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ph-text-muted)' }}>{role === 'seller' ? '판매자 계정' : '구매자 계정'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--ph-border)', margin: '4px 0' }}></div>
          <MenuItem icon={User} label="마이페이지" onClick={() => openMy('profile')} />
          {role === 'seller'
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
          <MenuItem icon={LayoutGrid} label="카테고리" onClick={() => { close(); onSearch(''); }} />
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
          <NavLink label="카테고리" onClick={() => onSearch('')} />
        </nav>
        <div className="ph-header-search" style={{ flex: 1, maxWidth: 340, marginLeft: 8 }}>
          <SearchBar value={query} onChange={setQuery} onSubmit={onSearch} size="header" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {Hamburger}
          {!user && (
            <button
              onClick={openLogin}
              style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontWeight: 600, color: '#fff', background: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-md)', height: 36, padding: '0 14px', fontSize: 14 }}
            >로그인</button>
          )}
          {role === 'seller' && (
            <React.Fragment>
              <button
                onClick={() => go('sell')}
                style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'var(--ph-font-family)', fontWeight: 600, color: '#fff', background: 'var(--ph-primary)', borderRadius: 'var(--ph-radius-md)', height: 36, padding: '0 14px', fontSize: 14 }}
              >판매하기</button>
              <IconBtn icon={Store} label="내 상점" active={current === 'shop'} onClick={() => go('shop')} />
              {CartDropdown}
              {BellDropdown}
              {UserMenuDropdown}
            </React.Fragment>
          )}
          {role === 'buyer' && (
            <React.Fragment>
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
