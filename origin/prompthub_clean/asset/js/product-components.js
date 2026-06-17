/* PromptHub — PromptCard, currency, Detail & Sell screens.
 * Built on the design-system CORE components (Card/Badge/Button/Input/Avatar/Tag),
 * which we read at render time. (The bundle's own UI-kit screens destructure the
 * namespace at load time, before it's populated, so we don't reuse those.) */
(() => {
  function won(n) { return "₩" + n.toLocaleString("ko-KR"); }
  window.won = won;

  /* Price display: 무료 (free), discounted (% + struck original + price), or plain. */
  function PriceTag({ p, size = 17 }) {
    const store = React.useContext(window.PHCtx) || {};
    // Already purchased → hide the price, show an owned marker instead.
    if (store.isPurchased && store.isPurchased(p.id)) {
      const ic = Math.round(size * 0.72);
      return (
        <span style={{ fontSize: size, fontWeight: 700, color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i data-lucide="check-circle-2" style={{ width: ic, height: ic }}></i>구매함
        </span>
      );
    }
    if (p.price === 0) return <span style={{ fontSize: size, fontWeight: 700, color: "var(--ph-primary)" }}>무료</span>;
    if (p.originalPrice && p.originalPrice > p.price) {
      const pct = Math.round((1 - p.price / p.originalPrice) * 100);
      return (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: size - 2, fontWeight: 700, color: "var(--ph-error)" }}>{pct}%</span>
          <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.price)}</span>
          <span style={{ fontSize: size - 4, color: "var(--ph-text-muted)", textDecoration: "line-through" }}>{won(p.originalPrice)}</span>
        </span>
      );
    }
    return <span style={{ fontSize: size, fontWeight: 700 }}>{won(p.price)}</span>;
  }
  window.PHPriceTag = PriceTag;

  function CircleBtn({ icon, active, fill, onClick, label, activeColor = "var(--ph-primary)" }) {
    const isHeart = icon === "heart";
    return (
      <button onClick={onClick} aria-label={label} title={label}
        style={{ width: 32, height: 32, borderRadius: "var(--ph-radius-full)", border: "1px solid var(--ph-border)", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: active ? activeColor : "var(--ph-text-secondary)", padding: 0 }}>
        {isHeart
          ? <svg viewBox="0 0 24 24" width="16" height="16" fill={fill ? activeColor : "none"} stroke={fill ? activeColor : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"></path></svg>
          : <i data-lucide={icon} style={{ width: 16, height: 16, fill: fill ? activeColor : "none" }}></i>}
      </button>
    );
  }

  function Thumb({ icon, h = 150 }) {
    return (
      <div style={{ height: h, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--ph-border)" }}>
        <i data-lucide={icon || "sparkles"} style={{ width: h > 200 ? 88 : 40, height: h > 200 ? 88 : 40, color: "var(--ph-primary)", opacity: 0.85 }}></i>
      </div>
    );
  }

  /* Swipeable image gallery for the detail page (arrows + dots + thumbnail strip). */
  function ImageCarousel({ slides }) {
    const [i, setI] = React.useState(0);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); }, [i]);
    React.useEffect(() => {
      const onKey = (e) => { if (e.key === "ArrowLeft") setI((x) => (x - 1 + slides.length) % slides.length); if (e.key === "ArrowRight") setI((x) => (x + 1) % slides.length); };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [slides.length]);
    const n = slides.length;
    const s = slides[i];
    const arrow = (dir) => (
      <button onClick={() => setI((x) => (x + (dir === "left" ? -1 : 1) + n) % n)} aria-label={dir === "left" ? "이전 이미지" : "다음 이미지"}
        style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: dir === "left" ? 14 : "auto", right: dir === "right" ? 14 : "auto", width: 42, height: 42, borderRadius: "var(--ph-radius-full)", border: "1px solid var(--ph-border)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ph-text)" }}>
        <i data-lucide={dir === "left" ? "chevron-left" : "chevron-right"} style={{ width: 20, height: 20 }}></i>
      </button>
    );
    return (
      <div>
        <div style={{ position: "relative", height: 360, borderRadius: "var(--ph-radius-xl)", overflow: "hidden", border: "1px solid var(--ph-border)" }}>
          <div style={{ height: "100%", background: s.tint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, transition: "background .2s ease" }}>
            <i data-lucide={s.icon} style={{ width: 84, height: 84, color: "var(--ph-primary)", opacity: 0.85 }}></i>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text-secondary)" }}>{s.caption}</span>
          </div>
          {n > 1 && arrow("left")}
          {n > 1 && arrow("right")}
          <div style={{ position: "absolute", top: 14, right: 16, fontSize: 12, fontWeight: 600, color: "var(--ph-text-secondary)", background: "rgba(255,255,255,0.85)", borderRadius: "var(--ph-radius-full)", padding: "4px 10px" }}>{i + 1} / {n}</div>
          {n > 1 && (
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
              {slides.map((_, k) => <span key={k} onClick={() => setI(k)} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 9999, background: k === i ? "var(--ph-primary)" : "rgba(0,0,0,0.22)", cursor: "pointer", transition: "all .15s" }}></span>)}
            </div>
          )}
        </div>
        {n > 1 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {slides.map((sl, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`${k + 1}번 이미지`} style={{ flex: 1, height: 66, borderRadius: "var(--ph-radius-md)", border: `1px solid ${k === i ? "var(--ph-primary)" : "var(--ph-border)"}`, background: sl.tint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <i data-lucide={sl.icon} style={{ width: 22, height: 22, color: "var(--ph-primary)", opacity: 0.8 }}></i>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  window.PHImageCarousel = ImageCarousel;

  function PromptCard({ p, onOpen, hideActions }) {
    const { Card, Badge } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    const inCart = store.inCart ? store.inCart(p.id) : false;
    const inWish = store.inWish ? store.inWish(p.id) : false;
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <Card interactive padding="14px" onClick={() => onOpen && onOpen(p)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="ph-card-media" style={{ position: "relative" }}>
          <Thumb icon={p.icon} />
          {(p.price === 0 || p.badge) && <div style={{ position: "absolute", top: 10, left: 10 }}><Badge tone="blue" soft={false} style={{ whiteSpace: "nowrap" }}>{p.price === 0 ? "무료" : p.badge}</Badge></div>}
          {!hideActions && store.addToCart && (
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <CircleBtn icon="heart" active={inWish} fill={inWish} activeColor="#FF3040" label="찜" onClick={(e) => { e.stopPropagation(); store.toggleWish(p); }} />
              {p.price !== 0 && (
                <CircleBtn icon={inCart ? "check" : "shopping-cart"} active={inCart} label={inCart ? "담김" : "장바구니"} onClick={(e) => { e.stopPropagation(); inCart ? store.removeFromCart(p.id) : store.addToCart(p); }} />
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Badge tone="neutral" style={{ whiteSpace: "nowrap" }}>{p.model}</Badge></div>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: "var(--ph-text)", textWrap: "pretty" }}>{p.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ph-text-muted)", fontSize: 13 }}>
          <i data-lucide="star" style={{ width: 14, height: 14, fill: "var(--ph-primary)", color: "var(--ph-primary)" }}></i>
          <span style={{ color: "var(--ph-text)", fontWeight: 600 }}>{p.rating}</span>
          <span>·</span>
          <span>{p.seller}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
          <PriceTag p={p} />
          <span style={{ fontSize: 13, color: "var(--ph-text-muted)", whiteSpace: "nowrap" }}>{p.sales.toLocaleString()}회 판매</span>
        </div>
      </Card>
    );
  }
  window.PromptCard = PromptCard;

  function DetailScreen({ p, go, openPrompt }) {
    const { Button, Badge, Card, Avatar } = window.PromptHubDesignSystem_19db23;
    const [showVersions, setShowVersions] = React.useState(false);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    if (!p) return null;
    const related = window.PH_DATA.prompts.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 4);
    const store = React.useContext(window.PHCtx) || {};
    const purchased = store.isPurchased ? store.isPurchased(p.id) : false;
    const inCart = store.inCart ? store.inCart(p.id) : false;
    const inWish = store.inWish ? store.inWish(p.id) : false;
    const features = ["결제 즉시 다운로드", "상업적 이용 가능", "무료 업데이트 제공"];
    // ── Version history ──
    const versions = store.getVersions ? store.getVersions(p) : [];
    const latest = versions[0];
    const ownedRec = (store.purchased || []).find((x) => x.id === p.id);
    const boughtVer = ownedRec ? ownedRec.boughtVer : null;
    const outdated = purchased && latest && boughtVer && boughtVer !== latest.ver;
    const gallery = [
      { caption: "대표 이미지", icon: p.icon, tint: "var(--ph-secondary)" },
      { caption: "예시 결과 1", icon: "image", tint: "var(--ph-gray-50)" },
      { caption: "예시 결과 2", icon: p.icon, tint: "var(--ph-secondary)" },
      { caption: "사용 가이드", icon: "book-open", tint: "var(--ph-gray-50)" },
    ];
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 0" }}>
        <button onClick={() => go("browse")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 24, padding: 0 }}>
          <i data-lucide="arrow-left" style={{ width: 16, height: 16 }}></i> 탐색으로 돌아가기
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 48, alignItems: "start" }}>
          <div>
            <ImageCarousel slides={gallery} />
            <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
              <Badge tone="neutral" style={{ whiteSpace: "nowrap" }}>{p.model}</Badge>
              {p.badge && <Badge tone="blue" soft={false} style={{ whiteSpace: "nowrap" }}>{p.badge}</Badge>}
            </div>
            <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.01em", margin: "16px 0 0", textWrap: "pretty" }}>{p.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0 32px", color: "var(--ph-text-secondary)", fontSize: 15 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i data-lucide="star" style={{ width: 16, height: 16, fill: "var(--ph-primary)", color: "var(--ph-primary)" }}></i>
                <b style={{ color: "var(--ph-text)" }}>{p.rating}</b>
              </span>
              <span>·</span>
              <span>{p.sales.toLocaleString()}회 판매</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px" }}>프롬프트 소개</h3>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--ph-text-secondary)", margin: 0, maxWidth: 620 }}>{p.desc}</p>
            <h3 style={{ fontSize: 20, fontWeight: 700, margin: "40px 0 16px" }}>판매자</h3>
            <Card padding="20px" style={{ maxWidth: 420, display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={p.seller} size={48} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.seller}</div>
                <div style={{ color: "var(--ph-text-muted)", fontSize: 14 }}>검증된 크리에이터 · 프롬프트 24개</div>
              </div>
            </Card>
          </div>
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
            {purchased && latest && (
              outdated ? (
                <Card padding="16px 18px" style={{ background: "var(--ph-secondary)", border: "1px solid color-mix(in srgb, var(--ph-primary) 25%, transparent)" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: "var(--ph-radius-full)", background: "#fff", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <i data-lucide="bell-ring" style={{ width: 17, height: 17 }}></i>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text)" }}>새 버전이 업데이트됐어요</div>
                      <div style={{ fontSize: 13, color: "var(--ph-text-secondary)", marginTop: 3, lineHeight: 1.55 }}>
                        보유 중 v{boughtVer} → 최신 <b style={{ color: "var(--ph-primary)" }}>v{latest.ver}</b><br />{latest.note}
                      </div>
                      <button onClick={() => store.openPurchased ? store.openPurchased(p) : null} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: "var(--ph-primary)", fontFamily: "var(--ph-font-family)", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, padding: 0 }}>
                        최신 버전 다시 받기 <i data-lucide="arrow-right" style={{ width: 14, height: 14 }}></i>
                      </button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", fontSize: 13, fontWeight: 600, color: "var(--ph-text-secondary)" }}>
                  <i data-lucide="check-circle-2" style={{ width: 16, height: 16, color: "var(--ph-primary)" }}></i> 최신 버전(v{latest.ver})을 보유하고 있어요
                </div>
              )
            )}
            <Card padding="24px">
              <div style={{ fontSize: 32, fontWeight: 700 }}><PriceTag p={p} size={32} /></div>
              <div style={{ color: "var(--ph-text-muted)", fontSize: 14, marginTop: 4 }}>{purchased ? "이미 보유한 프롬프트예요" : (p.price === 0 ? "무료 제공 · 구매 없이 바로 사용" : "1회 결제 · 영구 이용")}</div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <Button variant="solid" size="lg" fullWidth onClick={() => store.purchase && store.purchase(p)}>{purchased ? (p.price === 0 ? "받기 완료 ✓" : "구매 완료 ✓") : (p.price === 0 ? "무료로 받기" : "프롬프트 구매하기")}</Button>
                <div style={{ display: "flex", gap: 10 }}>
                  {p.price !== 0 && (
                    <div style={{ flex: 1 }}>
                      <Button variant="secondary" size="lg" fullWidth onClick={() => (inCart ? store.removeFromCart(p.id) : store.addToCart(p))}>
                        <i data-lucide={inCart ? "check" : "shopping-cart"} style={{ width: 17, height: 17 }}></i> {inCart ? "담긴" : "장바구니"}
                      </Button>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <Button variant="secondary" size="lg" fullWidth onClick={() => store.toggleWish && store.toggleWish(p)}>
                      <svg viewBox="0 0 24 24" width="17" height="17" fill={inWish ? "#FF3040" : "none"} stroke={inWish ? "#FF3040" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z"></path></svg> 찜
                    </Button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                {features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ph-text-secondary)" }}>
                    <i data-lucide="check-circle-2" style={{ width: 17, height: 17, color: "var(--ph-primary)" }}></i>{f}
                  </div>
                ))}
              </div>
            </Card>

            {/* ── 버전 기록 ── */}
            <Card padding="0" style={{ overflow: "hidden" }}>
              <button onClick={() => setShowVersions((v) => !v)} aria-expanded={showVersions}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--ph-font-family)", textAlign: "left" }}>
                <i data-lucide="history" style={{ width: 18, height: 18, color: "var(--ph-primary)", flexShrink: 0 }}></i>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ph-text)" }}>버전 기록</span>
                {latest && <Badge tone="neutral" style={{ whiteSpace: "nowrap" }}>v{latest.ver}</Badge>}
                <i data-lucide="chevron-down" style={{ width: 18, height: 18, color: "var(--ph-text-muted)", marginLeft: "auto", transform: showVersions ? "rotate(180deg)" : "none", transition: "transform .15s ease" }}></i>
              </button>
              {showVersions && (
                <div style={{ borderTop: "1px solid var(--ph-border)", padding: "6px 18px 14px" }}>
                  {versions.map((v, i) => {
                    const isCurrent = i === 0;
                    return (
                      <div key={v.ver} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: i === versions.length - 1 ? "none" : "1px solid var(--ph-border)", opacity: isCurrent ? 1 : 0.5 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: isCurrent ? "var(--ph-primary)" : "var(--ph-gray-line)", flexShrink: 0 }}></span>
                          {i !== versions.length - 1 && <span style={{ width: 2, flex: 1, background: "var(--ph-border)", marginTop: 4 }}></span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text)" }}>v{v.ver}</span>
                            <span style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>{v.date}</span>
                            {isCurrent
                              ? <Badge tone="blue" soft={false} style={{ whiteSpace: "nowrap" }}>현재</Badge>
                              : <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ph-text-muted)" }}>구매 불가</span>}
                          </div>
                          <div style={{ fontSize: 13.5, color: "var(--ph-text-secondary)", marginTop: 4, lineHeight: 1.5 }}>{v.note}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 12.5, color: "var(--ph-text-muted)" }}>
                    <i data-lucide="info" style={{ width: 14, height: 14, flexShrink: 0 }}></i> 구매는 최신 버전에만 가능하며, 이전 버전은 구매할 수 없어요.
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
        {related.length > 0 && (
          <section style={{ marginTop: 72 }}>
            <h2 style={{ fontSize: 27, fontWeight: 700, margin: "0 0 24px" }}>비슷한 프롬프트</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
              {related.map((r) => <PromptCard key={r.id} p={r} onOpen={openPrompt} />)}
            </div>
          </section>
        )}
      </div>
    );
  }
  window.DetailScreen = DetailScreen;
})();
