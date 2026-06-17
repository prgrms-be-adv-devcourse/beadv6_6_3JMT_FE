/* PromptHub — Browse / search results screen (own implementation so hero
 * tags + header search filter across category, model and text). */
(() => {
  const ns = window.PromptHubDesignSystem_19db23 || {};
  const { Tag } = ns;

  function BrowseScreen({ go, openPrompt, query, setQuery, gridCols = 4, gap = 20 }) {
    const { prompts, categories } = window.PH_DATA;
    const [cat, setCat] = React.useState("all");
    const [sort, setSort] = React.useState("인기순");

    let list = cat === "all" ? prompts : prompts.filter((p) => p.cat === cat);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) => {
        const catLabel = (categories.find((c) => c.id === p.cat) || {}).label || "";
        return [p.title, p.seller, p.model, catLabel].join(" ").toLowerCase().includes(q);
      });
    }
    list = [...list].sort((a, b) =>
      sort === "인기순" ? b.sales - a.sales : sort === "평점순" ? b.rating - a.rating : a.price - b.price
    );

    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 32px 0" }}>
        <h1 style={{ fontSize: 33, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" }}>프롬프트 탐색</h1>
        <p style={{ color: "var(--ph-text-secondary)", fontSize: 16, margin: "0 0 28px" }}>
          {query ? <span>‘{query}’ 검색 결과 · </span> : null}{list.length}개의 프롬프트
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {categories.map((c) => (
            <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Tag>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          {query && (
            <button onClick={() => setQuery("")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--ph-secondary)", color: "var(--ph-primary)", border: "none", borderRadius: "var(--ph-radius-full)", padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ph-font-family)" }}>
              <i data-lucide="x" style={{ width: 13, height: 13 }}></i> 검색 초기화
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            {["인기순", "평점순", "가격순"].map((s) => (
              <button key={s} onClick={() => setSort(s)}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--ph-font-family)", fontSize: 14, fontWeight: sort === s ? 700 : 500, color: sort === s ? "var(--ph-text)" : "var(--ph-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                {sort === s && <i data-lucide="check" style={{ width: 15, height: 15 }}></i>}{s}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div style={{ padding: "90px 0", textAlign: "center", color: "var(--ph-text-muted)" }}>
            <i data-lucide="search-x" style={{ width: 40, height: 40 }}></i>
            <p style={{ marginTop: 12 }}>검색 결과가 없어요. 다른 키워드로 찾아보세요.</p>
          </div>
        ) : (
          <div className="ph-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap }}>
            {list.map((p) => <window.PromptCard key={p.id} p={p} onOpen={openPrompt} />)}
          </div>
        )}
      </div>
    );
  }

  window.PHBrowseScreen = BrowseScreen;
})();
