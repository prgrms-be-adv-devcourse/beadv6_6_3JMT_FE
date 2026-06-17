/* PromptHub 관리자 — 사용자 관리 */
(() => {
  function Users({ store }) {
    const { SectionCard, AdminTable, Th, Td, Tr, Identity, StatusBadge, FilterTabs, RowBtn, Menu, MenuOption, AdminEmpty } = window;
    const { Input } = window.PromptHubDesignSystem_19db23;
    const [filter, setFilter] = React.useState("all");
    const [role, setRole] = React.useState("all");
    const [q, setQ] = React.useState("");
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const users = store.users;
    const matchQ = (u) => !q || u.name.includes(q) || u.email.toLowerCase().includes(q.toLowerCase()) || u.id.toLowerCase().includes(q.toLowerCase());
    const matchRole = (u) => role === "all" || u.role === role;
    const matchStatus = (u) => filter === "all" || u.status === filter;

    // status-tab counts respect the active 유형 + 검색 filters
    const sBase = users.filter((u) => matchRole(u) && matchQ(u));
    const counts = {
      all: sBase.length,
      active: sBase.filter((u) => u.status === "active").length,
      suspended: sBase.filter((u) => u.status === "suspended").length,
      withdrawn: sBase.filter((u) => u.status === "withdrawn").length,
    };
    const tabs = [
      { id: "all", label: "전체", count: counts.all },
      { id: "active", label: "활성", count: counts.active },
      { id: "suspended", label: "정지", count: counts.suspended },
      { id: "withdrawn", label: "탈퇴", count: counts.withdrawn },
    ];

    // 유형(type)-segment counts respect the active 상태 + 검색 filters
    const rBase = users.filter((u) => matchStatus(u) && matchQ(u));
    const roleTabs = [
      { id: "all", label: "전체", count: rBase.length },
      { id: "구매자", label: "구매자", count: rBase.filter((u) => u.role === "구매자").length },
      { id: "판매자", label: "판매자", count: rBase.filter((u) => u.role === "판매자").length },
    ];

    const filtered = users.filter((u) => matchStatus(u) && matchRole(u) && matchQ(u));

    const STATUS_OPTS = [
      { id: "active", label: "활성으로 변경", icon: "circle-check" },
      { id: "suspended", label: "정지 처리", icon: "circle-pause" },
      { id: "withdrawn", label: "탈퇴 처리", icon: "circle-x", danger: true },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard
          title="사용자 목록"
          sub={`총 ${users.length.toLocaleString("ko-KR")}명 · 구매자 ${users.filter((u) => u.role === "구매자").length}명 · 판매자 ${users.filter((u) => u.role === "판매자").length}명`}
          action={(
            <div style={{ width: 280 }}>
              <Input placeholder="이름·이메일·ID 검색" value={q} onChange={(e) => setQ(e.target.value)}
                leading={<i data-lucide="search" style={{ width: 17, height: 17 }}></i>} />
            </div>
          )}
          bodyStyle={{ padding: 0 }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--ph-border)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ph-text-muted)" }}>상태</span>
              <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
            </div>
            <div style={{ width: 1, height: 24, background: "var(--ph-border)" }}></div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ph-text-muted)" }}>유형</span>
              <FilterTabs tabs={roleTabs} value={role} onChange={setRole} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <AdminEmpty icon="user-x" title="해당하는 사용자가 없어요" sub="검색어나 필터를 바꿔 보세요." />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <Th>사용자</Th>
                  <Th>회원 ID</Th>
                  <Th>유형</Th>
                  <Th align="right">구매</Th>
                  <Th>가입일</Th>
                  <Th>상태</Th>
                  <Th align="right" width={120}>관리</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td><Identity name={u.name} sub={u.email} /></Td>
                    <Td><span style={{ fontSize: 13, color: "var(--ph-text-muted)", fontVariantNumeric: "tabular-nums" }}>{u.id}</span></Td>
                    <Td><span style={{ fontSize: 13.5, color: "var(--ph-text-secondary)", fontWeight: 600 }}>{u.role}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums" }}>{u.orders.toLocaleString("ko-KR")}</span></Td>
                    <Td><span style={{ color: "var(--ph-text-secondary)" }}>{u.joined}</span></Td>
                    <Td><StatusBadge status={u.status} /></Td>
                    <Td align="right">
                      <div style={{ display: "inline-flex", justifyContent: "flex-end" }}>
                        <Menu width={184} trigger={<RowBtn icon="settings-2">상태 변경</RowBtn>}>
                          {(close) => (
                            <React.Fragment>
                              <div style={{ padding: "6px 10px 8px", fontSize: 12, fontWeight: 700, color: "var(--ph-text-muted)" }}>계정 상태</div>
                              {STATUS_OPTS.map((o) => (
                                <MenuOption key={o.id} icon={o.icon} label={o.label} danger={o.danger} active={u.status === o.id}
                                  onClick={() => { store.setUserStatus(u.id, o.id); close(); }} />
                              ))}
                            </React.Fragment>
                          )}
                        </Menu>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </SectionCard>
      </div>
    );
  }

  Object.assign(window, { AdminUsers: Users });
})();
