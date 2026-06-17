/* PromptHub 관리자 — 판매자 신청 관리 */
(() => {
  function Sellers({ store }) {
    const { SectionCard, AdminTable, Th, Td, Tr, Identity, StatusBadge, FilterTabs, RowBtn, AdminEmpty } = window;
    const [filter, setFilter] = React.useState("pending");
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const apps = store.sellerApps;
    const counts = {
      all: apps.length,
      pending: apps.filter((a) => a.status === "pending").length,
      approved: apps.filter((a) => a.status === "approved").length,
      rejected: apps.filter((a) => a.status === "rejected").length,
    };
    const tabs = [
      { id: "pending", label: "대기", count: counts.pending },
      { id: "approved", label: "승인", count: counts.approved },
      { id: "rejected", label: "반려", count: counts.rejected },
      { id: "all", label: "전체", count: counts.all },
    ];
    const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard
          title="판매자 신청"
          sub={`${counts.pending}건 승인 대기 중`}
          bodyStyle={{ padding: 0 }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--ph-border)" }}>
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          {filtered.length === 0 ? (
            <AdminEmpty icon="store" title="해당하는 신청이 없어요" sub="다른 상태 탭을 확인해 보세요." />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <Th width="22%">신청자</Th>
                  <Th>판매 소개</Th>
                  <Th>카테고리</Th>
                  <Th align="right">샘플</Th>
                  <Th>신청일</Th>
                  <Th>상태</Th>
                  <Th align="right" width={170}>처리</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <Tr key={a.id}>
                    <Td><Identity name={a.name} sub={a.shop} /></Td>
                    <Td style={{ maxWidth: 360 }}>
                      <span style={{ display: "block", fontSize: 13.5, color: "var(--ph-text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.intro}</span>
                    </Td>
                    <Td><span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ph-text-secondary)" }}>{a.category}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums" }}>{a.samples}</span></Td>
                    <Td><span style={{ color: "var(--ph-text-secondary)" }}>{a.applied}</span></Td>
                    <Td><StatusBadge status={a.status} /></Td>
                    <Td align="right">
                      {a.status === "pending" ? (
                        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                          <RowBtn tone="solid" icon="check" onClick={() => store.actSellerApp(a.id, "approved")}>승인</RowBtn>
                          <RowBtn tone="danger" icon="x" onClick={() => store.actSellerApp(a.id, "rejected")}>반려</RowBtn>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>처리 완료</span>
                      )}
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

  Object.assign(window, { AdminSellers: Sellers });
})();
