/* PromptHub 관리자 — shared admin chrome & primitives.
 * Sidebar, Topbar, StatusBadge, SectionCard, DataTable bits, BarChart,
 * Menu popover, Toast. Exported to window for the page scripts. */
(() => {
  const ns = window.PromptHubDesignSystem_19db23 || {};
  const { Avatar, Badge } = ns;

  /* ── Brand logo lockup with an 관리자 (admin) marker ─────────────── */
  function AdminLogo() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--ph-primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i data-lucide="sparkles" style={{ width: 18, height: 18 }}></i>
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ph-text)" }}>
            Prompt<span style={{ color: "var(--ph-primary)" }}>Hub</span>
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ph-text-muted)", letterSpacing: "0.04em" }}>ADMIN CONSOLE</span>
        </span>
      </div>
    );
  }

  /* ── Sidebar navigation ─────────────────────────────────────────── */
  const NAV = [
    { id: "dashboard", label: "대시보드 홈", icon: "layout-dashboard" },
    { group: "운영 관리" },
    { id: "users", label: "사용자 관리", icon: "users" },
    { id: "sellers", label: "판매자 신청 관리", icon: "store", key: "sellersBadge" },
    { id: "products", label: "상품 검수", icon: "clipboard-check", key: "productsBadge" },
    { id: "settlements", label: "정산 관리", icon: "wallet", key: "settlementsBadge" },
  ];

  function Sidebar({ current, go, badges, onLogout, email }) {
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <aside style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 248, background: "var(--ph-white)", borderRight: "1px solid var(--ph-border)", display: "flex", flexDirection: "column", zIndex: 30 }}>
        <div style={{ padding: "22px 22px 18px" }}>
          <AdminLogo />
        </div>
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 14px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item, i) => {
            if (item.group) {
              return (
                <div key={"g" + i} style={{ padding: "16px 10px 7px", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "var(--ph-text-muted)", textTransform: "uppercase" }}>
                  {item.group}
                </div>
              );
            }
            const active = current === item.id;
            const count = item.key && badges ? badges[item.key] : 0;
            return (
              <button key={item.id} onClick={() => go(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left",
                  padding: "10px 12px", borderRadius: "var(--ph-radius-md)", cursor: "pointer",
                  border: "none", fontFamily: "var(--ph-font-family)", fontSize: 14.5,
                  fontWeight: active ? 700 : 500,
                  background: active ? "var(--ph-secondary)" : "transparent",
                  color: active ? "var(--ph-primary)" : "var(--ph-text-secondary)",
                  transition: "background-color .15s ease, color .15s ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--ph-gray-50)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <i data-lucide={item.icon} style={{ width: 19, height: 19, flexShrink: 0 }}></i>
                <span style={{ flex: 1 }}>{item.label}</span>
                {count > 0 && (
                  <span style={{ minWidth: 20, height: 20, padding: "0 6px", borderRadius: 9999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: active ? "var(--ph-primary)" : "var(--ph-secondary)", color: active ? "#fff" : "var(--ph-primary)" }}>{count}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: "1px solid var(--ph-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <Avatar name="관리자" size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text)" }}>운영 관리자</div>
              <div style={{ fontSize: 12, color: "var(--ph-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "admin@prompthub.kr"}</div>
            </div>
            <button onClick={onLogout} title="로그아웃"
              style={{ width: 34, height: 34, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-sm)", cursor: "pointer", color: "var(--ph-text-secondary)", transition: "background-color .15s ease, border-color .15s ease, color .15s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#fdeceb"; e.currentTarget.style.borderColor = "var(--ph-error)"; e.currentTarget.style.color = "var(--ph-error)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "var(--ph-border)"; e.currentTarget.style.color = "var(--ph-text-secondary)"; }}>
              <i data-lucide="log-out" style={{ width: 17, height: 17 }}></i>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  /* ── Topbar ─────────────────────────────────────────────────────── */
  function Topbar({ title, subtitle }) {
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid var(--ph-border)" }}>
        <div style={{ height: 70, padding: "0 36px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ph-text)" }}>{title}</h1>
            {subtitle && <p style={{ margin: "3px 0 0", fontSize: 13.5, color: "var(--ph-text-muted)" }}>{subtitle}</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button title="알림" style={iconBtnStyle()}>
              <i data-lucide="bell" style={{ width: 19, height: 19 }}></i>
              <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--ph-primary)", border: "1.5px solid #fff" }}></span>
            </button>
            <button title="도움말" style={iconBtnStyle()}>
              <i data-lucide="life-buoy" style={{ width: 19, height: 19 }}></i>
            </button>
            <div style={{ width: 1, height: 24, background: "var(--ph-border)", margin: "0 4px" }}></div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--ph-text-secondary)", padding: "6px 10px", borderRadius: "var(--ph-radius-full)", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)" }}>
              <i data-lucide="shield-check" style={{ width: 15, height: 15, color: "var(--ph-primary)" }}></i>
              운영팀
            </span>
          </div>
        </div>
      </header>
    );
  }
  function iconBtnStyle() {
    return { position: "relative", width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: "var(--ph-radius-md)", cursor: "pointer", color: "var(--ph-text-secondary)" };
  }

  /* ── Status badge (maps domain status → DS Badge tone) ───────────── */
  const STATUS = {
    active:    { label: "활성",    tone: "blue",    soft: true,  dot: "#1b64da" },
    suspended: { label: "정지",    tone: "error",   soft: true,  dot: "#d92d20" },
    withdrawn: { label: "탈퇴",    tone: "neutral", soft: true,  dot: "#8b95a1" },
    pending:   { label: "대기",    tone: "neutral", soft: true,  dot: "#8b95a1" },
    approved:  { label: "승인",    tone: "blue",    soft: true,  dot: "#1b64da" },
    rejected:  { label: "반려",    tone: "error",   soft: true,  dot: "#d92d20" },
    paid:      { label: "지급 완료", tone: "blue",  soft: false, dot: "#fff" },
    held:      { label: "보류",    tone: "error",   soft: true,  dot: "#d92d20" },
  };
  function StatusBadge({ status, label }) {
    const s = STATUS[status] || STATUS.pending;
    return (
      <Badge tone={s.tone} soft={s.soft} style={{ gap: 6, padding: "5px 10px", whiteSpace: "nowrap" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }}></span>
        {label || s.label}
      </Badge>
    );
  }

  /* ── Section card: titled white panel ───────────────────────────── */
  function SectionCard({ title, sub, action, children, bodyStyle, style }) {
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <section style={{ background: "var(--ph-white)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-lg)", display: "flex", flexDirection: "column", ...style }}>
        {(title || action) && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", borderBottom: "1px solid var(--ph-border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h2 style={{ margin: 0, fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>}
              {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ph-text-muted)" }}>{sub}</p>}
            </div>
            {action}
          </div>
        )}
        <div style={{ ...bodyStyle }}>{children}</div>
      </section>
    );
  }

  /* "전체 보기 →" text link used in card headers */
  function LinkAction({ children, onClick }) {
    return (
      <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: "var(--ph-font-family)", fontSize: 13.5, fontWeight: 600, color: "var(--ph-primary)", padding: 4 }}>
        {children} <i data-lucide="arrow-right" style={{ width: 15, height: 15 }}></i>
      </button>
    );
  }

  /* ── Table primitives ───────────────────────────────────────────── */
  function Table({ children }) {
    return <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--ph-font-family)" }}>{children}</table>;
  }
  function Th({ children, align = "left", width }) {
    return <th style={{ textAlign: align, padding: "12px 16px", fontSize: 12.5, fontWeight: 600, color: "var(--ph-text-muted)", borderBottom: "1px solid var(--ph-border)", whiteSpace: "nowrap", width }}>{children}</th>;
  }
  function Td({ children, align = "left", style }) {
    return <td style={{ textAlign: align, padding: "14px 16px", fontSize: 14, color: "var(--ph-text)", borderBottom: "1px solid var(--ph-border)", verticalAlign: "middle", ...style }}>{children}</td>;
  }
  function Tr({ children, onClick, active }) {
    const [h, setH] = React.useState(false);
    return (
      <tr onClick={onClick}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{ cursor: onClick ? "pointer" : "default", background: active ? "var(--ph-secondary)" : h && onClick ? "var(--ph-gray-50)" : "transparent", transition: "background-color .12s ease" }}>
        {children}
      </tr>
    );
  }

  /* User/seller identity cell: avatar + name + sub */
  function Identity({ name, sub, size = 36 }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar name={name} size={size} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ph-text)" }}>{name}</div>
          {sub && <div style={{ fontSize: 12.5, color: "var(--ph-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
        </div>
      </div>
    );
  }

  /* ── Small ghost action button for table rows ───────────────────── */
  function RowBtn({ icon, children, tone = "neutral", onClick, disabled }) {
    const tones = {
      neutral: { c: "var(--ph-text-secondary)", b: "var(--ph-border)", bg: "#fff", hbg: "var(--ph-gray-50)", hb: "var(--ph-gray-400)" },
      blue:    { c: "var(--ph-primary)", b: "var(--ph-border)", bg: "#fff", hbg: "var(--ph-secondary)", hb: "var(--ph-primary)" },
      solid:   { c: "#fff", b: "transparent", bg: "var(--ph-primary)", hbg: "var(--ph-blue-hover)", hb: "transparent" },
      danger:  { c: "var(--ph-error)", b: "var(--ph-border)", bg: "#fff", hbg: "#fdeceb", hb: "var(--ph-error)" },
    };
    const t = tones[tone] || tones.neutral;
    return (
      <button onClick={onClick} disabled={disabled}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, padding: icon && !children ? 0 : "0 12px", width: icon && !children ? 34 : undefined, justifyContent: "center",
          borderRadius: "var(--ph-radius-sm)", border: `1px solid ${t.b}`, background: t.bg, color: t.c,
          fontFamily: "var(--ph-font-family)", fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1, transition: "background-color .15s ease, border-color .15s ease", whiteSpace: "nowrap" }}
        onMouseEnter={(e) => { if (disabled) return; e.currentTarget.style.background = t.hbg; e.currentTarget.style.borderColor = t.hb; }}
        onMouseLeave={(e) => { if (disabled) return; e.currentTarget.style.background = t.bg; e.currentTarget.style.borderColor = t.b; }}>
        {icon && <i data-lucide={icon} style={{ width: 15, height: 15 }}></i>}
        {children}
      </button>
    );
  }

  /* ── Popover menu (used for user status change) ─────────────────── */
  function Menu({ trigger, children, width = 180 }) {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <div style={{ position: "relative", display: "inline-flex" }}>
        <span onClick={() => setOpen((x) => !x)}>{trigger}</span>
        {open && (
          <React.Fragment>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }}></div>
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 61, width, background: "#fff", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-lg)", padding: 6 }}>
              {typeof children === "function" ? children(() => setOpen(false)) : children}
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
  function MenuOption({ icon, label, onClick, danger, active }) {
    return (
      <button onClick={onClick}
        style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", textAlign: "left", background: active ? "var(--ph-secondary)" : "none", border: "none", cursor: "pointer", padding: "9px 10px", borderRadius: "var(--ph-radius-sm)", fontFamily: "var(--ph-font-family)", fontSize: 13.5, fontWeight: 500, color: danger ? "var(--ph-error)" : active ? "var(--ph-primary)" : "var(--ph-text)" }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--ph-gray-50)"; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "none"; }}>
        {icon && <i data-lucide={icon} style={{ width: 16, height: 16 }}></i>}
        <span style={{ flex: 1 }}>{label}</span>
        {active && <i data-lucide="check" style={{ width: 15, height: 15 }}></i>}
      </button>
    );
  }

  /* ── Filter tab row (segmented count tabs) ──────────────────────── */
  function FilterTabs({ tabs, value, onChange }) {
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map((t) => {
          const on = value === t.id;
          return (
            <button key={t.id} onClick={() => onChange(t.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 36, padding: "0 14px", borderRadius: "var(--ph-radius-full)", cursor: "pointer",
                fontFamily: "var(--ph-font-family)", fontSize: 13.5, fontWeight: 600,
                background: on ? "var(--ph-secondary)" : "#fff", color: on ? "var(--ph-primary)" : "var(--ph-text-secondary)",
                border: `1px solid ${on ? "transparent" : "var(--ph-border)"}`, transition: "all .15s ease", whiteSpace: "nowrap" }}>
              {t.label}
              {typeof t.count === "number" && (
                <span style={{ fontSize: 12, fontWeight: 700, color: on ? "var(--ph-primary)" : "var(--ph-text-muted)" }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  /* ── 7-day bar chart (counts) with a thin revenue line ──────────── */
  function BarChart({ data }) {
    const max = Math.max(...data.map((d) => d.count));
    const [hover, setHover] = React.useState(null);
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 230, padding: "8px 4px 0" }}>
        {data.map((d, i) => {
          const h = Math.round((d.count / max) * 100);
          const on = hover === i;
          return (
            <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 10, cursor: "default" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: on ? "var(--ph-primary)" : "var(--ph-text-secondary)", transition: "color .15s ease" }}>{d.count}</div>
              <div style={{ width: "100%", maxWidth: 46, height: `${h}%`, minHeight: 8, borderRadius: "8px 8px 4px 4px", background: on ? "var(--ph-primary)" : "var(--ph-secondary)", transition: "background-color .15s ease, height .3s ease" }}></div>
              <div style={{ textAlign: "center", lineHeight: 1.3 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: on ? "var(--ph-text)" : "var(--ph-text-secondary)" }}>{d.day}</div>
                <div style={{ fontSize: 11.5, color: "var(--ph-text-muted)" }}>{d.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Empty state ────────────────────────────────────────────────── */
  function Empty({ icon = "inbox", title, sub }) {
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--ph-text-muted)" }}>
        <div style={{ width: 56, height: 56, margin: "0 auto 16px", borderRadius: "var(--ph-radius-full)", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i data-lucide={icon} style={{ width: 26, height: 26, color: "var(--ph-text-muted)" }}></i>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ph-text-secondary)" }}>{title}</div>
        {sub && <div style={{ fontSize: 13.5, marginTop: 5 }}>{sub}</div>}
      </div>
    );
  }

  /* ── Toast (transient confirmation) ─────────────────────────────── */
  const ToastCtx = React.createContext(() => {});
  function ToastProvider({ children }) {
    const [toasts, setToasts] = React.useState([]);
    const push = React.useCallback((msg, tone = "default") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, msg, tone }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    }, []);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <ToastCtx.Provider value={push}>
        {children}
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 200, display: "flex", flexDirection: "column", gap: 10, alignItems: "center", pointerEvents: "none" }}>
          {toasts.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderRadius: "var(--ph-radius-md)", background: "var(--ph-black)", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "var(--ph-font-family)" }}>
              <i data-lucide={t.tone === "danger" ? "x-circle" : "check-circle-2"} style={{ width: 18, height: 18, color: t.tone === "danger" ? "#ff9b94" : "#7fb2ff" }}></i>
              {t.msg}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    );
  }
  function useToast() { return React.useContext(ToastCtx); }

  Object.assign(window, {
    AdminSidebar: Sidebar, AdminTopbar: Topbar, StatusBadge, SectionCard, LinkAction,
    AdminTable: Table, Th, Td, Tr, Identity, RowBtn, Menu, MenuOption, FilterTabs,
    BarChart, AdminEmpty: Empty, ToastProvider, useToast,
  });
})();
