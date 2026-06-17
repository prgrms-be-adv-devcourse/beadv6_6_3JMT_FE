/* PromptHub 관리자 — 상품 검수 (목록 + 미리보기) */
(() => {
  function Products({ store, params }) {
    const { SectionCard, StatusBadge, FilterTabs, RowBtn, AdminEmpty, Identity } = window;
    const { Badge } = window.PromptHubDesignSystem_19db23;
    const won = window.adminWon, catIcon = window.adminCatIcon;
    const [filter, setFilter] = React.useState("pending");
    const products = store.products;

    const counts = {
      pending: products.filter((p) => p.status === "pending").length,
      approved: products.filter((p) => p.status === "approved").length,
      rejected: products.filter((p) => p.status === "rejected").length,
      all: products.length,
    };
    const tabs = [
      { id: "pending", label: "검수 대기", count: counts.pending },
      { id: "approved", label: "승인", count: counts.approved },
      { id: "rejected", label: "반려", count: counts.rejected },
      { id: "all", label: "전체", count: counts.all },
    ];
    const list = filter === "all" ? products : products.filter((p) => p.status === filter);

    const [selId, setSelId] = React.useState(null);
    // keep a valid selection within the current list; honor an incoming focus param
    React.useEffect(() => {
      const focus = params && params.focus;
      if (focus && products.some((p) => p.id === focus)) { setSelId(focus); return; }
    }, [params]);
    React.useEffect(() => {
      if (!list.length) { setSelId(null); return; }
      if (!selId || !list.some((p) => p.id === selId)) setSelId(list[0].id);
    }, [filter, list.length]);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const sel = products.find((p) => p.id === selId);

    const act = (status) => {
      if (!sel) return;
      store.actProduct(sel.id, status);
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 420px) 1fr", gap: 20, alignItems: "start" }}>
        {/* ── List ─────────────────────────────────────────── */}
        <SectionCard title="검수 대기 상품" sub={`${counts.pending}건 대기`} bodyStyle={{ padding: 0 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ph-border)" }}>
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>
          {list.length === 0 ? (
            <AdminEmpty icon="clipboard-check" title="검수할 상품이 없어요" sub="모든 상품을 처리했습니다." />
          ) : (
            <div style={{ maxHeight: 620, overflowY: "auto" }}>
              {list.map((p, i) => {
                const on = p.id === selId;
                return (
                  <button key={p.id} onClick={() => setSelId(p.id)}
                    style={{ display: "flex", gap: 12, width: "100%", textAlign: "left", alignItems: "center", padding: "14px 18px", cursor: "pointer",
                      border: "none", borderTop: i ? "1px solid var(--ph-border)" : "none", borderLeft: `3px solid ${on ? "var(--ph-primary)" : "transparent"}`,
                      background: on ? "var(--ph-secondary)" : "transparent", fontFamily: "var(--ph-font-family)", transition: "background-color .12s ease" }}
                    onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--ph-gray-50)"; }}
                    onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--ph-radius-md)", background: on ? "#fff" : "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <i data-lucide={catIcon(p.category)} style={{ width: 20, height: 20 }}></i>
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ph-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: "var(--ph-text-muted)", marginTop: 2 }}>{p.seller} · {p.submitted.slice(5)}</span>
                    </span>
                    {p.status !== "pending" && <StatusBadge status={p.status} />}
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* ── Preview ──────────────────────────────────────── */}
        {!sel ? (
          <SectionCard bodyStyle={{ padding: 0 }}>
            <AdminEmpty icon="file-search" title="상품을 선택하세요" sub="왼쪽 목록에서 검수할 상품을 골라 주세요." />
          </SectionCard>
        ) : (
          <SectionCard
            title="상품 내용 미리보기"
            action={<StatusBadge status={sel.status} />}
            bodyStyle={{ padding: 0 }}>
            <div style={{ padding: "22px 26px" }}>
              {/* head */}
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ width: 64, height: 64, flexShrink: 0, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <i data-lucide={catIcon(sel.category)} style={{ width: 30, height: 30 }}></i>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <Badge tone="neutral">{sel.category}</Badge>
                    <Badge tone="neutral" soft={false}>{sel.model}</Badge>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{sel.title}</h3>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ph-text)" }}>{sel.price === 0 ? "무료" : won(sel.price)}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ph-text-muted)", marginTop: 2 }}>{sel.id}</div>
                </div>
              </div>

              {/* meta */}
              <div style={{ display: "flex", gap: 28, marginTop: 20, padding: "14px 0", borderTop: "1px solid var(--ph-border)", borderBottom: "1px solid var(--ph-border)" }}>
                <Meta label="판매자" value={sel.seller} />
                <Meta label="등록일" value={sel.submitted} />
                <Meta label="모델" value={sel.model} />
                <Meta label="가격" value={sel.price === 0 ? "무료" : won(sel.price)} />
              </div>

              {/* description */}
              <Field label="상품 설명">
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: "var(--ph-text-secondary)" }}>{sel.desc}</p>
              </Field>

              {/* prompt body */}
              <Field label="프롬프트 본문">
                <div style={{ position: "relative", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", padding: "16px 18px" }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--ph-font-family)", fontSize: 14, lineHeight: 1.7, color: "var(--ph-text)" }}>{sel.prompt}</pre>
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ph-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <i data-lucide="info" style={{ width: 14, height: 14 }}></i>
                  {"{ } 안의 항목은 구매자가 입력하는 변수입니다."}
                </div>
              </Field>

              {/* tags */}
              <Field label="태그">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sel.tags.map((t) => (
                    <span key={t} style={{ fontSize: 13, fontWeight: 600, color: "var(--ph-text-secondary)", background: "var(--ph-gray-100)", padding: "6px 12px", borderRadius: "var(--ph-radius-full)" }}>#{t}</span>
                  ))}
                </div>
              </Field>
            </div>

            {/* action bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 26px", borderTop: "1px solid var(--ph-border)", background: "var(--ph-gray-50)", borderRadius: "0 0 var(--ph-radius-lg) var(--ph-radius-lg)" }}>
              {sel.status === "pending" ? (
                <React.Fragment>
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--ph-text-muted)" }}>가이드라인을 확인한 뒤 승인 또는 반려하세요.</span>
                  <RowBtn tone="danger" icon="x" onClick={() => act("rejected")}>반려</RowBtn>
                  <button onClick={() => act("approved")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px", borderRadius: "var(--ph-radius-md)", border: "none", cursor: "pointer", background: "var(--ph-primary)", color: "#fff", fontFamily: "var(--ph-font-family)", fontSize: 15, fontWeight: 600, transition: "background-color .15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ph-blue-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ph-primary)")}>
                    <i data-lucide="check" style={{ width: 17, height: 17 }}></i> 승인하기
                  </button>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--ph-text-secondary)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <StatusBadge status={sel.status} /> 처리된 상품입니다.
                  </span>
                  <RowBtn icon="rotate-ccw" onClick={() => act("pending")}>검수 대기로 되돌리기</RowBtn>
                </React.Fragment>
              )}
            </div>
          </SectionCard>
        )}
      </div>
    );
  }

  function Meta({ label, value }) {
    return (
      <div>
        <div style={{ fontSize: 12.5, color: "var(--ph-text-muted)", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ph-text)" }}>{value}</div>
      </div>
    );
  }
  function Field({ label, children }) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ph-text-secondary)", marginBottom: 10 }}>{label}</div>
        {children}
      </div>
    );
  }

  Object.assign(window, { AdminProducts: Products });
})();
