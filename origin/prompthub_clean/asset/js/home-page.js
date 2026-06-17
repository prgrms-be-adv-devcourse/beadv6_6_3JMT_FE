/* PromptHub — Home screen. Three hero "directions" (toss / split / search)
 * plus the shared marketing sections. Exported as window.PHHomeScreen. */
(() => {
  const ns = window.PromptHubDesignSystem_19db23 || {};
  const { Button, Card } = ns;

  const Badge = ({ children }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 14, fontWeight: 600 }}>
      <i data-lucide="sparkles" style={{ width: 15, height: 15 }}></i>{children}
    </div>
  );

  /* ───────────────────────── HERO DIRECTIONS ───────────────────────── */

  function HeroToss({ headline, sub, query, setQuery, onSearch, mascotOn }) {
    return (
      <section style={{ background: "linear-gradient(180deg, #ffffff 0%, #f3f7fd 42%, #e6effb 100%)" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", padding: "96px 32px 88px", textAlign: "center" }}>
          <div className="rise"><Badge>12,000개 이상의 검증된 프롬프트</Badge></div>
          <h1 className="rise" style={{ animationDelay: ".05s", fontSize: 54, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.025em", margin: "24px auto 0", maxWidth: 720, textWrap: "balance" }}>{headline}</h1>
          <p className="rise" style={{ animationDelay: ".1s", fontSize: 19, lineHeight: 1.6, color: "var(--ph-text-secondary)", maxWidth: 540, margin: "20px auto 0" }}>{sub}</p>
          <div className="rise" style={{ animationDelay: ".15s", maxWidth: 620, margin: "36px auto 0" }}>
            <window.SearchBar value={query} onChange={setQuery} onSubmit={onSearch} size="hero" />
          </div>
          <div className="rise" style={{ animationDelay: ".2s", marginTop: 22 }}>
            <window.PopularTags onPick={onSearch} align="center" />
          </div>
          {mascotOn && (
            <div className="rise float" style={{ animationDelay: ".25s", display: "flex", justifyContent: "center", marginTop: 48 }}>
              <window.Mascot size={260} />
            </div>
          )}
        </div>
      </section>
    );
  }

  function HeroSplit({ headline, sub, query, setQuery, onSearch, mascotOn }) {
    return (
      <section style={{ background: "var(--ph-white)", borderBottom: "1px solid var(--ph-border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "76px 32px 84px", display: "grid", gridTemplateColumns: mascotOn ? "1.05fr 0.95fr" : "1fr", gap: 56, alignItems: "center" }}>
          <div style={{ textAlign: mascotOn ? "left" : "center", maxWidth: mascotOn ? "none" : 760, margin: mascotOn ? 0 : "0 auto" }}>
            <div className="rise"><Badge>AI 프롬프트 마켓플레이스</Badge></div>
            <h1 className="rise" style={{ animationDelay: ".05s", fontSize: 50, lineHeight: 1.18, fontWeight: 700, letterSpacing: "-0.025em", margin: "22px 0 0", textWrap: "balance" }}>{headline}</h1>
            <p className="rise" style={{ animationDelay: ".1s", fontSize: 19, lineHeight: 1.6, color: "var(--ph-text-secondary)", margin: "20px 0 0", maxWidth: 520, marginLeft: mascotOn ? 0 : "auto", marginRight: mascotOn ? 0 : "auto" }}>{sub}</p>
            <div className="rise" style={{ animationDelay: ".15s", maxWidth: mascotOn ? 520 : 620, margin: mascotOn ? "32px 0 0" : "32px auto 0" }}>
              <window.SearchBar value={query} onChange={setQuery} onSubmit={onSearch} size="hero" />
            </div>
            <div className="rise" style={{ animationDelay: ".2s", marginTop: 20 }}>
              <window.PopularTags onPick={onSearch} align={mascotOn ? "left" : "center"} />
            </div>
          </div>
          {mascotOn && (
            <div className="rise" style={{ animationDelay: ".15s", background: "linear-gradient(160deg, #f3f7fd, #e6effb)", borderRadius: "var(--ph-radius-xl)", padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="float"><window.Mascot size={300} /></div>
            </div>
          )}
        </div>
      </section>
    );
  }

  function HeroSearch({ headline, sub, query, setQuery, onSearch, mascotOn }) {
    return (
      <section style={{ background: "var(--ph-gray-50)", borderBottom: "1px solid var(--ph-border)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "64px 32px 72px", textAlign: "center" }}>
          {mascotOn && (
            <div className="rise float" style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <window.Mascot size={120} />
            </div>
          )}
          <h1 className="rise" style={{ animationDelay: ".05s", fontSize: 42, lineHeight: 1.22, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 auto", maxWidth: 640, textWrap: "balance" }}>{headline}</h1>
          <p className="rise" style={{ animationDelay: ".1s", fontSize: 18, color: "var(--ph-text-secondary)", margin: "16px auto 0", maxWidth: 480 }}>{sub}</p>
          <div className="rise" style={{ animationDelay: ".15s", margin: "32px auto 0" }}>
            <window.SearchBar value={query} onChange={setQuery} onSubmit={onSearch} size="hero" />
          </div>
          <div className="rise" style={{ animationDelay: ".2s", marginTop: 20 }}>
            <window.PopularTags onPick={onSearch} align="center" />
          </div>
        </div>
      </section>
    );
  }

  /* ───────────────────────── SHARED SECTIONS ───────────────────────── */

  function SectionHead({ title, sub, actionLabel, onAction }) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 33, fontWeight: 700, margin: 0, letterSpacing: "-0.015em" }}>{title}</h2>
          {sub && <p style={{ color: "var(--ph-text-secondary)", fontSize: 16, margin: "8px 0 0" }}>{sub}</p>}
        </div>
        {actionLabel && <Button variant="link" onClick={onAction}>{actionLabel}</Button>}
      </div>
    );
  }

  function PopularGrid({ openPrompt, go, gridCols, gap }) {
    const featured = [...window.PH_DATA.prompts].sort((a, b) => b.sales - a.sales).slice(0, gridCols * 2);
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "84px 32px 0" }}>
        <SectionHead title="이번 주 인기 프롬프트" sub="가장 많이 팔린 프롬프트를 만나보세요" actionLabel="전체 보기 →" onAction={() => go("browse")} />
        <div className="ph-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap }}>
          {featured.map((p) => <window.PromptCard key={p.id} p={p} onOpen={openPrompt} />)}
        </div>
      </section>
    );
  }

  function CategorySection({ onPick }) {
    const cats = window.PH_DATA.categories.filter((c) => c.id !== "all");
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px 0" }}>
        <SectionHead title="카테고리별로 찾아보기" sub="필요한 작업에 맞는 프롬프트를 골라보세요" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {cats.map((c) => (
            <button key={c.id} onClick={() => onPick(c.label)}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "22px 22px", background: "var(--ph-white)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-xl)", cursor: "pointer", fontFamily: "var(--ph-font-family)", textAlign: "left", transition: "border-color .15s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ph-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ph-border)")}>
              <span style={{ width: 52, height: 52, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i data-lucide={c.icon} style={{ width: 24, height: 24 }}></i>
              </span>
              <span>
                <span style={{ display: "block", fontSize: 17, fontWeight: 700, color: "var(--ph-text)" }}>{c.label}</span>
                <span style={{ display: "block", fontSize: 14, color: "var(--ph-text-muted)", marginTop: 3 }}>{c.desc}</span>
              </span>
              <i data-lucide="chevron-right" style={{ width: 18, height: 18, color: "var(--ph-text-muted)", marginLeft: "auto" }}></i>
            </button>
          ))}
        </div>
      </section>
    );
  }

  function WhySection() {
    const items = [
      { icon: "shield-check", title: "검증된 프롬프트", desc: "큐레이션을 거쳐 실제로 작동하는 프롬프트만 등록됩니다. 실패하는 결과에 시간 낭비하지 마세요." },
      { icon: "zap", title: "결제 즉시 다운로드", desc: "구매하면 바로 사용할 수 있어요. 복사해서 붙여넣기만 하면 끝, 기다릴 필요 없이." },
      { icon: "wallet", title: "수수료 단 15%", desc: "판매 수익의 85%가 크리에이터의 몫. 내 프롬프트로 부수입을 만들어 보세요." },
    ];
    return (
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 32px 0" }}>
        <SectionHead title="왜 PromptHub일까요?" sub="가장 쉽고 안전하게 프롬프트를 사고파는 방법" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {items.map((f) => (
            <Card key={f.title} padding="32px">
              <span style={{ width: 52, height: 52, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <i data-lucide={f.icon} style={{ width: 26, height: 26 }}></i>
              </span>
              <h3 style={{ fontSize: 21, fontWeight: 700, margin: "20px 0 10px" }}>{f.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ph-text-secondary)", margin: 0 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  function SellerCTA({ go, mascotOn }) {
    const store = React.useContext(window.PHCtx) || {};
    const isSeller = store.user && store.user.role === "seller";
    // Sellers go straight to the register form; everyone else applies for seller access.
    const onSell = () => go(isSeller ? "sell" : "apply");
    return (
      <section style={{ maxWidth: 1200, margin: "112px auto 0", padding: "0 32px" }}>
        <div style={{ background: "linear-gradient(135deg, #eaf2fe, #e0ebfb)", borderRadius: "var(--ph-radius-xl)", padding: "56px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.25 }}>내 프롬프트로<br />수익을 만들어 보세요</h2>
            <p style={{ fontSize: 17, color: "var(--ph-text-secondary)", margin: "14px 0 28px", lineHeight: 1.6 }}>잘 만든 프롬프트 하나가 꾸준한 수입이 됩니다. 등록은 무료, 수수료는 단 15%.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button variant="solid" size="lg" onClick={onSell}>판매 시작하기</Button>
              <Button variant="secondary" size="lg" onClick={() => go("browse")}>둘러보기</Button>
            </div>
          </div>
          {mascotOn && (
            <div className="float" style={{ flexShrink: 0 }}>
              <img src={(window.__resources && window.__resources.mascotCta) || "assets/mascot-cta.png"} alt="프롬이 마스코트" style={{ width: "auto", height: 200, display: "block" }} />
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ───────────────────────── COMPOSED HOME ───────────────────────── */

  function HomeScreen(props) {
    const { direction } = props;
    const Hero = direction === "split" ? HeroSplit : direction === "search" ? HeroSearch : HeroToss;
    return (
      <div>
        <Hero {...props} />
        <PopularGrid openPrompt={props.openPrompt} go={props.go} gridCols={props.gridCols} gap={props.gap} />
        <CategorySection onPick={props.onSearch} />
        <WhySection />
        <SellerCTA go={props.go} mascotOn={props.mascotOn} />
      </div>
    );
  }

  window.PHHomeScreen = HomeScreen;
})();
