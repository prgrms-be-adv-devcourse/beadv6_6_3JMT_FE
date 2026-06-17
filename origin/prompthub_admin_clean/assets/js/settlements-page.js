/* PromptHub 관리자 — 정산 관리 */
(() => {
  function Settlements({ store }) {
    const { SectionCard, AdminTable, Th, Td, Tr, Identity, StatusBadge, FilterTabs, RowBtn, AdminEmpty } = window;
    const won = window.adminWon, wonShort = window.adminWonShort;
    const [filter, setFilter] = React.useState("all");
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const rows = store.settlements;
    const counts = {
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      paid: rows.filter((r) => r.status === "paid").length,
      held: rows.filter((r) => r.status === "held").length,
    };
    const tabs = [
      { id: "all", label: "전체", count: counts.all },
      { id: "pending", label: "대기", count: counts.pending },
      { id: "approved", label: "승인", count: counts.approved },
      { id: "paid", label: "지급", count: counts.paid },
      { id: "held", label: "보류", count: counts.held },
    ];
    const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

    const sum = (sts) => rows.filter((r) => sts.includes(r.status)).reduce((s, r) => s + r.amount, 0);
    const summary = [
      { label: "정산 대기", value: wonShort(sum(["pending"])), icon: "clock", note: counts.pending + "건" },
      { label: "승인 완료", value: wonShort(sum(["approved"])), icon: "circle-check", note: counts.approved + "건" },
      { label: "지급 보류", value: wonShort(sum(["held"])), icon: "pause-circle", note: counts.held + "건" },
      { label: "지급 완료", value: wonShort(sum(["paid"])), icon: "banknote", note: counts.paid + "건" },
    ];

    // contextual action buttons per status
    const renderActions = (r) => {
      const A = {
        approve: <RowBtn key="a" tone="solid" icon="check" onClick={() => store.actSettlement(r.id, "approved")}>승인</RowBtn>,
        pay:     <RowBtn key="p" tone="solid" icon="banknote" onClick={() => store.actSettlement(r.id, "paid")}>지급</RowBtn>,
        hold:    <RowBtn key="h" tone="neutral" icon="pause" onClick={() => store.actSettlement(r.id, "held")}>보류</RowBtn>,
        cancel:  <RowBtn key="c" tone="danger" icon="x" onClick={() => store.actSettlement(r.id, "pending")}>취소</RowBtn>,
      };
      if (r.status === "pending") return [A.approve, A.hold];
      if (r.status === "approved") return [A.pay, A.hold, A.cancel];
      if (r.status === "held") return [A.approve, A.cancel];
      return [<span key="done" style={{ fontSize: 13, color: "var(--ph-text-muted)", display: "inline-flex", alignItems: "center", gap: 5 }}><i data-lucide="check-check" style={{ width: 15, height: 15, color: "var(--ph-primary)" }}></i>지급 완료</span>];
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {summary.map((s) => (
            <div key={s.label} style={{ background: "var(--ph-white)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-lg)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--ph-text-secondary)" }}>
                <i data-lucide={s.icon} style={{ width: 17, height: 17, color: "var(--ph-primary)" }}></i>{s.label}
              </div>
              <div style={{ marginTop: 12, fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ph-text)" }}>{s.value}</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ph-text-muted)" }}>{s.note}</div>
            </div>
          ))}
        </div>

        <SectionCard title="정산 예정 목록" sub="판매 수수료 15% 차감 후 지급액 기준" bodyStyle={{ padding: 0 }}>
          <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--ph-border)" }}>
            <FilterTabs tabs={tabs} value={filter} onChange={setFilter} />
          </div>

          {filtered.length === 0 ? (
            <AdminEmpty icon="wallet" title="해당하는 정산 건이 없어요" sub="다른 상태 탭을 확인해 보세요." />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <Th>판매자</Th>
                  <Th>정산 기간</Th>
                  <Th align="right">판매</Th>
                  <Th align="right">총 거래액</Th>
                  <Th align="right">수수료</Th>
                  <Th align="right">지급액</Th>
                  <Th>상태</Th>
                  <Th align="right" width={220}>액션</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <Tr key={r.id}>
                    <Td><Identity name={r.seller} sub={r.shop} /></Td>
                    <Td><span style={{ color: "var(--ph-text-secondary)" }}>{r.period}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums" }}>{r.sales.toLocaleString("ko-KR")}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ph-text-secondary)" }}>{won(r.gross)}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ph-text-muted)" }}>−{won(r.fee)}</span></Td>
                    <Td align="right"><span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{won(r.amount)}</span></Td>
                    <Td><StatusBadge status={r.status} /></Td>
                    <Td align="right">
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>{renderActions(r)}</div>
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

  Object.assign(window, { AdminSettlements: Settlements });
})();
