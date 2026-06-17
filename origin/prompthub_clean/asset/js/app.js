/* PromptHub — landing prototype root: routing + tweaks + screen composition. */
(() => {
  const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakText, TweakSelect } = window;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "direction": "토스 정통",
    "pointColor": "#1B64DA",
    "gridCols": "4",
    "density": "regular",
    "radiusStyle": "soft",
    "mascotOn": true,
    "heroHeadline": "더 좋은 결과를 만드는 AI 프롬프트, 여기 다 있어요",
    "heroSub": "크리에이터가 검증한 프롬프트를 구매하고, 내 프롬프트로 수익도 만들어 보세요."
  }/*EDITMODE-END*/;

  const DIRECTION_MAP = { "토스 정통": "toss", "스플릿": "split", "검색 중심": "search" };
  const DENSITY_GAP = { compact: 14, regular: 20, comfy: 28 };
  const RADIUS_MAP = {
    soft: { sm: "4px", md: "7px", lg: "8px", xl: "16px" },
    sharp: { sm: "2px", md: "4px", lg: "4px", xl: "8px" },
    round: { sm: "8px", md: "12px", lg: "16px", xl: "24px" },
  };

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const [route, setRoute] = React.useState("home");
    const [selected, setSelected] = React.useState(null);
    const [query, setQuery] = React.useState("");
    const [authOpen, setAuthOpen] = React.useState(false);
    const [user, setUser] = React.useState(null); // null | { role: 'buyer'|'seller', name, email }
    const [cart, setCart] = React.useState([]);
    const [wishlist, setWishlist] = React.useState([]);
    const [purchased, setPurchased] = React.useState([]);
    const [refunds, setRefunds] = React.useState({}); // { [promptId]: 'requested' | 'refunded' }
    const [ratings, setRatings] = React.useState({}); // { [promptId]: 1..5 } — buyer's own star review
    const [versionsMap, setVersionsMap] = React.useState({}); // { [promptId]: [{ver,date,note}, ...] } — seller-added versions (newest first)
    const [myListings, setMyListings] = React.useState([]); // seller-created prompts awaiting admin review
    const [editing, setEditing] = React.useState(null); // prompt being edited
    const [myTab, setMyTab] = React.useState("profile");
    const [toast, setToast] = React.useState(null);

    const showToast = (msg) => { setToast(msg); clearTimeout(showToast._t); showToast._t = setTimeout(() => setToast(null), 1800); };

    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const go = (r) => { setRoute(r); window.scrollTo({ top: 0 }); };
    const openPrompt = (p) => { setSelected(p); setRoute("detail"); window.scrollTo({ top: 0 }); };
    const onSearch = (q) => { setQuery(q); setRoute("browse"); window.scrollTo({ top: 0 }); };
    const openMyPage = (tab) => { setMyTab(tab || "profile"); setRoute("mypage"); window.scrollTo({ top: 0 }); };
    const openPurchased = (p) => { setSelected(p); setRoute("reader"); window.scrollTo({ top: 0 }); };
    // ── Version history ──
    const getVersions = (p) => window.PH_VERSIONS.combine(p ? versionsMap[p.id] : null);
    const latestVer = (p) => getVersions(p)[0].ver;
    const editPrompt = (p) => { setEditing(p); setRoute("edit"); window.scrollTo({ top: 0 }); };
    // New listings start in admin review (검수중) and aren't shown to buyers until approved.
    const submitListing = (data) => {
      const id = "new-" + Date.now();
      setMyListings((l) => [{ ...data, id, status: "review", submittedAt: Date.now(), sales: 0, rating: "신규" }, ...l]);
      return id;
    };
    const savePromptVersion = (id, note) => {
      setVersionsMap((m) => {
        const extra = m[id] || [];
        const cur = extra[0] ? extra[0].ver : window.PH_VERSIONS.SEED[0].ver;
        const entry = { ver: window.PH_VERSIONS.nextVer(cur), date: window.PH_VERSIONS.todayStr(), note: note.trim() };
        return { ...m, [id]: [entry, ...extra] };
      });
    };
    const login = (role) => {
      setUser({ role, name: role === "seller" ? "프롬프트랩" : "김토스", email: role === "seller" ? "seller@prompthub.kr" : "toss.kim@gmail.com" });
      setAuthOpen(false);
      // Backend resolves the account role; sellers land on their seller dashboard.
      if (role === "seller") { setRoute("shop"); window.scrollTo({ top: 0 }); }
    };
    const logout = () => { setUser(null); setCart([]); setWishlist([]); setPurchased([]); setRefunds({}); go("home"); };
    const openLogin = () => setAuthOpen(true);
    const isSeller = user && user.role === "seller";

    // ── Cart / wishlist / purchase store ──
    const requireLogin = () => { if (!user) { openLogin(); return false; } return true; };
    const inCart = (id) => cart.some((x) => x.id === id);
    const inWish = (id) => wishlist.some((x) => x.id === id);
    const isPurchased = (id) => purchased.some((x) => x.id === id) && !refunds[id];
    const addToCart = (p) => { if (!requireLogin()) return; if (!inCart(p.id)) { setCart((c) => [...c, p]); showToast("장바구니에 담았어요"); } };
    const removeFromCart = (id) => setCart((c) => c.filter((x) => x.id !== id));
    const toggleWish = (p) => { if (!requireLogin()) return; setWishlist((w) => w.some((x) => x.id === p.id) ? w.filter((x) => x.id !== p.id) : [...w, p]); };
    const purchase = (p) => {
      if (!requireLogin()) return;
      if (!isPurchased(p.id)) setPurchased((q) => [...q, { ...p, purchasedAt: Date.now(), boughtVer: latestVer(p) }]);
      setCart((c) => c.filter((x) => x.id !== p.id));
      showToast(p.price === 0 ? "프롬프트를 받았어요" : "구매가 완료됐어요");
    };
    const updateNickname = (name) => setUser((u) => ({ ...u, name }));
    const updateEmail = (email) => { setUser((u) => ({ ...u, email })); showToast("이메일이 변경됐어요"); };
    const myRating = (id) => ratings[id] || 0;
    const ratePrompt = (id, n) => { setRatings((r) => ({ ...r, [id]: n })); showToast(`${n}점 별점을 남겼어요`); };
    const requestRefund = (id) => { setRefunds((r) => ({ ...r, [id]: "requested" })); showToast("환불 신청이 접수됐어요"); };
    const store = {
      user, cart, wishlist, purchased, refunds, myTab, myListings,
      go, openPrompt, openMyPage, openPurchased, logout,
      inCart, inWish, isPurchased, addToCart, removeFromCart, toggleWish, purchase, updateNickname, updateEmail,
      myRating, ratePrompt, requestRefund,
      getVersions, latestVer, editPrompt, savePromptVersion, submitListing,
    };

    const cols = parseInt(t.gridCols, 10) || 4;
    const gap = DENSITY_GAP[t.density] || 20;
    const r = RADIUS_MAP[t.radiusStyle] || RADIUS_MAP.soft;
    const c = t.pointColor;

    const styleVars = {
      "--ph-primary": c,
      "--ph-blue": c,
      "--ph-accent": c,
      "--ph-blue-hover": `color-mix(in srgb, ${c} 86%, black)`,
      "--ph-secondary": `color-mix(in srgb, ${c} 12%, white)`,
      "--ph-radius-sm": r.sm,
      "--ph-radius-md": r.md,
      "--ph-radius-lg": r.lg,
      "--ph-radius-xl": r.xl,
      minHeight: "100vh",
      background: "var(--ph-background)",
    };

    let content;
    if (route === "detail") content = <window.DetailScreen p={selected} go={go} openPrompt={openPrompt} />;
    else if (route === "mypage") content = user
      ? <window.PHMyPage />
      : <window.PHAccessGate openLogin={openLogin} title="로그인이 필요해요" desc="로그인하면 마이페이지에서 구매·찜 목록과 설정을 관리할 수 있어요." />;
    else if (route === "browse") content = <window.PHBrowseScreen go={go} openPrompt={openPrompt} query={query} setQuery={setQuery} gridCols={cols} gap={gap} />;
    else if (route === "sell") content = isSeller
      ? <window.SellScreen go={go} user={user} showToast={showToast} />
      : <window.PHAccessGate openLogin={openLogin} title="판매자 전용 페이지예요" desc="판매자 계정으로 로그인하면 프롬프트를 등록하고 수익을 만들 수 있어요." />;
    else if (route === "edit") content = (isSeller && editing)
      ? <window.PHEditScreen p={editing} go={go} showToast={showToast} />
      : <window.PHAccessGate openLogin={openLogin} title="판매자 전용 페이지예요" desc="판매자 계정으로 로그인하면 등록한 프롬프트를 수정할 수 있어요." />;
    else if (route === "apply") content = <window.PHSellerApply go={go} user={user} showToast={showToast} openLogin={openLogin} />;
    else if (route === "reader") content = (user && selected && isPurchased(selected.id))
      ? <window.PHReaderScreen p={selected} go={go} openMyPage={openMyPage} showToast={showToast} />
      : <window.PHAccessGate openLogin={openLogin} title="구매한 사용자만 볼 수 있어요" desc="이 프롬프트를 구매하면 전문을 열람하고 다운로드할 수 있어요." />;
    else if (route === "shop") content = isSeller
      ? <window.PHShopScreen go={go} openPrompt={openPrompt} user={user} />
      : <window.PHAccessGate openLogin={openLogin} title="판매자 전용 페이지예요" desc="판매자 계정으로 로그인하면 내 상점을 관리할 수 있어요." />;
    else content = (
      <window.PHHomeScreen
        go={go} openPrompt={openPrompt} onSearch={onSearch}
        query={query} setQuery={setQuery}
        direction={DIRECTION_MAP[t.direction] || "toss"}
        mascotOn={t.mascotOn} heroHeadline={t.heroHeadline} heroSub={t.heroSub}
        headline={t.heroHeadline} sub={t.heroSub}
        gridCols={cols} gap={gap}
      />
    );

    return (
      <window.PHCtx.Provider value={store}>
      <div style={styleVars}>
        <window.Header go={go} current={route} query={query} setQuery={setQuery} onSearch={onSearch} user={user} openLogin={openLogin} onLogout={logout} />
        {content}
        <window.Footer go={go} />
        <window.LoginModal open={authOpen} onClose={() => setAuthOpen(false)} onLogin={login} />

        {toast && (
          <div style={{ position: "fixed", left: "50%", bottom: 32, transform: "translateX(-50%)", zIndex: 90, background: "var(--ph-text)", color: "#fff", padding: "13px 22px", borderRadius: "var(--ph-radius-full)", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <i data-lucide="check-circle-2" style={{ width: 17, height: 17 }}></i>{toast}
          </div>
        )}

        <TweaksPanel>
          <TweakSection label="레이아웃" />
          <TweakRadio label="히어로 방향" value={t.direction} options={["토스 정통", "스플릿", "검색 중심"]} onChange={(v) => setTweak("direction", v)} />
          <TweakRadio label="카드 열 개수" value={t.gridCols} options={["3", "4", "5"]} onChange={(v) => setTweak("gridCols", v)} />
          <TweakRadio label="카드 밀도" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />

          <TweakSection label="스타일" />
          <TweakColor label="포인트 컬러" value={t.pointColor} options={["#1B64DA", "#2D8CFF", "#4F46E5", "#0EA5E9"]} onChange={(v) => setTweak("pointColor", v)} />
          <TweakRadio label="코너 / 여백" value={t.radiusStyle} options={["sharp", "soft", "round"]} onChange={(v) => setTweak("radiusStyle", v)} />
          <TweakToggle label="마스코트 표시" value={t.mascotOn} onChange={(v) => setTweak("mascotOn", v)} />

          <TweakSection label="히어로 카피" />
          <TweakText label="헤드라인" value={t.heroHeadline} onChange={(v) => setTweak("heroHeadline", v)} />
          <TweakText label="서브 카피" value={t.heroSub} onChange={(v) => setTweak("heroSub", v)} />
        </TweaksPanel>
      </div>
      </window.PHCtx.Provider>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
