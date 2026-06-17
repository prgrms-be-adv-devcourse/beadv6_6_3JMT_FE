/* PromptHub 관리자 — app shell, store & routing */
(() => {
  const { ToastProvider, useToast, AdminSidebar, AdminTopbar } = window;

  const PAGES = {
    dashboard:   { title: "대시보드 홈", sub: "PromptHub 마켓플레이스 운영 현황을 한눈에 확인하세요." },
    users:       { title: "사용자 관리", sub: "회원 계정을 조회하고 상태를 관리합니다." },
    sellers:     { title: "판매자 신청 관리", sub: "판매자 전환 신청을 검토하고 승인·반려합니다." },
    products:    { title: "상품 검수", sub: "등록된 프롬프트를 검수하고 게시 여부를 결정합니다." },
    settlements: { title: "정산 관리", sub: "판매 수익 정산을 승인하고 지급을 처리합니다." },
  };

  function Shell({ onLogout, email: emailProp }) {
    const toast = useToast();
    const [page, setPage] = React.useState("dashboard");
    const [params, setParams] = React.useState(null);

    // mutable copies of the mock data
    const [users, setUsers] = React.useState(() => window.ADMIN_USERS.map((u) => ({ ...u })));
    const [sellerApps, setSellerApps] = React.useState(() => window.ADMIN_SELLER_APPS.map((a) => ({ ...a })));
    const [products, setProducts] = React.useState(() => window.ADMIN_PRODUCTS.map((p) => ({ ...p })));
    const [settlements, setSettlements] = React.useState(() => window.ADMIN_SETTLEMENTS.map((s) => ({ ...s })));

    const go = (p, prm = null) => { setPage(p); setParams(prm); window.scrollTo({ top: 0 }); };

    const adminEmail = emailProp || (() => { try { return sessionStorage.getItem("ph_admin_email"); } catch (e) { return null; } })();
    const logout = onLogout || (() => {
      if (window.__PH_STANDALONE) { window.location.reload(); return; }
      try { sessionStorage.removeItem("ph_admin_auth"); sessionStorage.removeItem("ph_admin_email"); } catch (e) {}
      window.location.href = "PromptHub 관리자 로그인.html";
    });

    const USER_LABEL = { active: "활성", suspended: "정지", withdrawn: "탈퇴" };
    const setUserStatus = (id, status) => {
      setUsers((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
      const u = users.find((x) => x.id === id);
      toast(`${u ? u.name : "사용자"} 계정을 ${USER_LABEL[status]} 상태로 변경했어요`, status === "withdrawn" ? "danger" : "default");
    };

    const actSellerApp = (id, status) => {
      setSellerApps((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
      const a = sellerApps.find((x) => x.id === id);
      toast(`${a ? a.shop : "신청"} 판매자 신청을 ${status === "approved" ? "승인" : "반려"}했어요`, status === "rejected" ? "danger" : "default");
    };

    const actProduct = (id, status) => {
      setProducts((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
      const p = products.find((x) => x.id === id);
      const msg = status === "approved" ? "승인했어요" : status === "rejected" ? "반려했어요" : "검수 대기로 되돌렸어요";
      toast(`'${p ? p.title : "상품"}'을(를) ${msg}`, status === "rejected" ? "danger" : "default");
    };

    const SET_LABEL = { pending: "대기", approved: "승인", paid: "지급", held: "보류" };
    const actSettlement = (id, status) => {
      setSettlements((list) => list.map((s) => (s.id === id ? { ...s, status } : s)));
      const s = settlements.find((x) => x.id === id);
      const verb = status === "pending" ? "취소(대기)로 변경" : `${SET_LABEL[status]} 처리`;
      toast(`${s ? s.shop : "정산"} 정산을 ${verb}했어요`, status === "held" ? "danger" : "default");
    };

    const store = {
      metrics: window.ADMIN_METRICS, sales7d: window.ADMIN_SALES_7D,
      users, sellerApps, products, settlements,
      go, setUserStatus, actSellerApp, actProduct, actSettlement,
    };

    const badges = {
      sellersBadge: sellerApps.filter((a) => a.status === "pending").length,
      productsBadge: products.filter((p) => p.status === "pending").length,
      settlementsBadge: settlements.filter((s) => s.status === "pending").length,
    };

    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const meta = PAGES[page];
    let body = null;
    if (page === "dashboard") body = <window.AdminDashboard store={store} />;
    else if (page === "users") body = <window.AdminUsers store={store} />;
    else if (page === "sellers") body = <window.AdminSellers store={store} />;
    else if (page === "products") body = <window.AdminProducts store={store} params={params} />;
    else if (page === "settlements") body = <window.AdminSettlements store={store} />;

    return (
      <div style={{ minHeight: "100vh", background: "var(--ph-surface-muted)" }}>
        <AdminSidebar current={page} go={go} badges={badges} onLogout={logout} email={adminEmail} />
        <div style={{ marginLeft: 248, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <AdminTopbar title={meta.title} subtitle={meta.sub} />
          <main style={{ flex: 1, padding: "28px 36px 56px", maxWidth: 1320, width: "100%" }}>
            {body}
          </main>
        </div>
      </div>
    );
  }

  function App(props) {
    return (
      <ToastProvider>
        <Shell {...props} />
      </ToastProvider>
    );
  }

  window.AdminApp = App;

  // In combined single-file mode the orchestrator mounts everything itself.
  if (!window.__PH_COMBINED) {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(<App />);
  }
})();
