/* PromptHub 관리자 — 대시보드 홈 */
(() => {
  function StatCard({ icon, label, value, sub, delta }) {
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    const up = delta != null && delta >= 0;
    return (
      <div style={{ background: "var(--ph-white)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-lg)", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 38, height: 38, borderRadius: "var(--ph-radius-md)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <i data-lucide={icon} style={{ width: 20, height: 20 }}></i>
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text-secondary)" }}>{label}</span>
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--ph-text)" }}>{value}</span>
          {delta != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 13, fontWeight: 700, color: up ? "var(--ph-primary)" : "var(--ph-error)", paddingBottom: 2 }}>
              <i data-lucide={up ? "trending-up" : "trending-down"} style={{ width: 15, height: 15 }}></i>
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        {sub && <div style={{ marginTop: 8, fontSize: 13, color: "var(--ph-text-muted)" }}>{sub}</div>}
      </div>
    );
  }

  function Dashboard({ store }) {
    const { SectionCard, LinkAction, StatusBadge, BarChart, RowBtn, Identity, AdminEmpty } = window;
    const won = window.adminWon, wonShort = window.adminWonShort;
    const m = store.metrics, sales = store.sales7d;
    const pendingApps = store.sellerApps.filter((a) => a.status === "pending").slice(0, 4);
    const pendingProducts = store.products.filter((p) => p.status === "pending").slice(0, 4);
    const weekTotal = sales.reduce((s, d) => s + d.count, 0);
    const weekRevenue = sales.reduce((s, d) => s + d.revenue, 0);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <StatCard icon="users" label="총 가입자" value={m.totalUsers.toLocaleString("ko-KR")} delta={m.totalUsersDelta} sub="누적 회원 수" />
          <StatCard icon="user-plus" label="오늘 신규 가입" value={m.newToday.toLocaleString("ko-KR")} delta={m.newTodayDelta} sub="어제 대비" />
          <StatCard icon="trending-up" label="이번 달 거래액" value={wonShort(m.monthRevenue)} delta={m.monthRevenueDelta} sub={"GMV · " + won(m.monthRevenue)} />
          <StatCard icon="wallet" label="정산 대기 금액" value={wonShort(m.pendingPayout)} sub={m.pendingPayoutCount + "건 처리 대기"} />
        </div>

        {/* Chart */}
        <SectionCard
          title="최근 7일 거래량"
          sub={`총 ${weekTotal.toLocaleString("ko-KR")}건 · ${won(weekRevenue)} 거래`}
          action={(
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--ph-text-secondary)", fontWeight: 600 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--ph-secondary)", border: "1px solid var(--ph-primary)" }}></span>
                거래 건수
              </span>
            </div>
          )}
          bodyStyle={{ padding: "20px 24px 22px" }}>
          <BarChart data={sales} />
        </SectionCard>

        {/* Two columns: seller apps + product review */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <SectionCard
            title="최근 판매자 신청"
            sub={`${store.sellerApps.filter((a) => a.status === "pending").length}건 승인 대기`}
            action={<LinkAction onClick={() => store.go("sellers")}>전체 보기</LinkAction>}
            bodyStyle={{ padding: pendingApps.length ? "6px 0" : 0 }}>
            {pendingApps.length === 0 ? (
              <AdminEmpty icon="check-circle-2" title="처리할 신청이 없어요" sub="모든 판매자 신청을 검토했습니다." />
            ) : pendingApps.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderTop: i ? "1px solid var(--ph-border)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Identity name={a.name} sub={`${a.shop} · ${a.category}`} size={38} />
                </div>
                <span style={{ fontSize: 12.5, color: "var(--ph-text-muted)", whiteSpace: "nowrap" }}>{a.applied.slice(5)}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <RowBtn tone="solid" onClick={() => store.actSellerApp(a.id, "approved")}>승인</RowBtn>
                  <RowBtn tone="danger" onClick={() => store.actSellerApp(a.id, "rejected")}>반려</RowBtn>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard
            title="검수 대기 상품"
            sub={`${store.products.filter((p) => p.status === "pending").length}건 검수 대기`}
            action={<LinkAction onClick={() => store.go("products")}>전체 보기</LinkAction>}
            bodyStyle={{ padding: pendingProducts.length ? "6px 0" : 0 }}>
            {pendingProducts.length === 0 ? (
              <AdminEmpty icon="clipboard-check" title="검수할 상품이 없어요" sub="모든 등록 상품을 검토했습니다." />
            ) : pendingProducts.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderTop: i ? "1px solid var(--ph-border)" : "none" }}>
                <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "var(--ph-radius-md)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <i data-lucide={catIcon(p.category)} style={{ width: 19, height: 19 }}></i>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ph-text-muted)" }}>{p.seller} · {p.model}</div>
                </div>
                <RowBtn tone="blue" onClick={() => store.go("products", { focus: p.id })}>검수</RowBtn>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    );
  }

  function catIcon(cat) {
    return ({ "이미지 생성": "image", "글쓰기": "pen-line", "코딩": "code-xml", "마케팅": "megaphone", "챗봇": "message-circle", "데이터 분석": "bar-chart-3" })[cat] || "sparkles";
  }

  Object.assign(window, { AdminDashboard: Dashboard, adminCatIcon: catIcon });
})();
