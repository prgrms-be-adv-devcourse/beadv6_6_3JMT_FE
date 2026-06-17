/* PromptHub — seller-only screens: prompt registration (with live preview),
 * seller shop dashboard, and the access gate for non-sellers. */
(() => {
  const won = (n) => "₩" + Number(n || 0).toLocaleString("ko-KR");

  function AccessGate({ openLogin, title, desc }) {
    const { Button } = window.PromptHubDesignSystem_19db23;
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
        <span style={{ width: 64, height: 64, borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i data-lucide="lock" style={{ width: 28, height: 28 }}></i>
        </span>
        <h1 style={{ fontSize: 27, fontWeight: 700, margin: "24px 0 10px", letterSpacing: "-0.01em" }}>{title}</h1>
        <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "0 0 28px", lineHeight: 1.6 }}>{desc}</p>
        <Button variant="solid" size="lg" onClick={openLogin}>판매자로 로그인</Button>
      </div>
    );
  }
  window.PHAccessGate = AccessGate;

  const Label = ({ children, hint }) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text)" }}>{children}</span>
      {hint && <span style={{ fontSize: 12, color: "var(--ph-text-muted)" }}>{hint}</span>}
    </div>
  );

  function SellScreen({ go, user, showToast }) {
    const { Button, Input, Card, Tag, Badge } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    const { categories } = window.PH_DATA;
    const cats = categories.filter((c) => c.id !== "all");
    const [title, setTitle] = React.useState("");
    const [cat, setCat] = React.useState("writing");
    const [model, setModel] = React.useState("");
    const [price, setPrice] = React.useState("");
    const [body, setBody] = React.useState("");
    const [tags, setTags] = React.useState([]);
    const [tagInput, setTagInput] = React.useState("");
    const [status, setStatus] = React.useState(null); // 'saved' | 'submitted'

    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const catObj = cats.find((c) => c.id === cat) || cats[0];
    const addTag = (e) => {
      e.preventDefault();
      const v = tagInput.trim().replace(/^#/, "");
      if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v]);
      setTagInput("");
    };
    const removeTag = (t) => setTags(tags.filter((x) => x !== t));
    const submit = () => {
      if (!title.trim()) { showToast && showToast("프롬프트 제목을 입력해 주세요"); return; }
      store.submitListing && store.submitListing({
        title: title.trim(), cat, icon: catObj.icon, model: model.trim() || "모델 미정",
        price: parseInt(price, 10) || 0, desc: body.trim() || "판매자가 등록한 프롬프트입니다.", tags, seller: user ? user.name : "내 상점",
      });
      setStatus("submitted");
      showToast && showToast("검수 요청이 접수됐어요 · 관리자 승인 후 판매가 시작돼요");
      go("shop");
    };
    const taStyle = { width: "100%", boxSizing: "border-box", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", padding: "12px 14px", fontFamily: "var(--ph-font-family)", fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none", color: "var(--ph-text)" };

    return (
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 0" }}>
        <button onClick={() => go("shop")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 0 }}>
          <i data-lucide="arrow-left" style={{ width: 16, height: 16 }}></i> 내 상점으로
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <i data-lucide="store" style={{ width: 14, height: 14 }}></i> 판매자 · 프롬프트 등록
            </div>
            <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.015em", margin: 0 }}>새 프롬프트 등록</h1>
            <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "8px 0 0" }}>판매 수수료는 단 15%. 나머지는 모두 판매자의 몫이에요.</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "start" }}>
          {/* ── Form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            <Card padding="28px">
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <Label hint={`${title.length}/60`}>프롬프트 제목</Label>
                  <Input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="예: 전환율 높이는 랜딩 카피 작성" />
                </div>
                <div>
                  <Label>카테고리</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {cats.map((c) => <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Tag>)}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div><Label>대상 모델</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="예: GPT-4o" /></div>
                  <div><Label>가격</Label><Input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="4900" leading={<span style={{ fontWeight: 700 }}>₩</span>} /></div>
                </div>
              </div>
            </Card>

            <Card padding="28px">
              <Label hint={`${body.length}자`}>프롬프트 내용</Label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9}
                placeholder={"실제 판매할 프롬프트 본문을 입력하세요.\n\n예) 당신은 전문 카피라이터입니다. 아래 제품 정보를 바탕으로...\n- 타깃:\n- 톤앤매너:\n- 출력 형식:"}
                style={taStyle}></textarea>
              <p style={{ fontSize: 13, color: "var(--ph-text-muted)", margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <i data-lucide="eye" style={{ width: 14, height: 14 }}></i> 입력한 내용은 오른쪽 미리보기에 실시간으로 반영돼요.
              </p>
            </Card>

            <Card padding="28px">
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <Label hint={`${tags.length}/8`}>태그</Label>
                  <form onSubmit={addTag} style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="태그를 입력하고 Enter (예: 카피라이팅)" leading={<span style={{ fontWeight: 700, color: "var(--ph-text-muted)" }}>#</span>} /></div>
                    <Button variant="secondary" as="button" type="submit">추가</Button>
                  </form>
                  {tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {tags.map((t) => (
                        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 8px 6px 12px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600 }}>
                          #{t}
                          <button onClick={() => removeTag(t)} aria-label="태그 삭제" style={{ display: "inline-flex", background: "none", border: "none", cursor: "pointer", color: "var(--ph-primary)", padding: 0 }}><i data-lucide="x" style={{ width: 14, height: 14 }}></i></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label hint="권장 4:3 · 최대 5MB">대표 썸네일</Label>
                  <image-slot id="sell-thumb" placeholder="썸네일을 드래그하거나 클릭해 업로드" shape="rounded" radius="12" fit="cover" style={{ width: "100%", height: 220, display: "block" }}></image-slot>
                </div>
                <div>
                  <Label hint="최대 5장">소개 이미지</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                    {[1, 2, 3, 4, 5].map((k) => (
                      <image-slot key={k} id={`sell-gallery-${k}`} placeholder="+ 추가" shape="rounded" radius="10" fit="cover" style={{ width: "100%", height: 96, display: "block" }}></image-slot>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ph-text-muted)", margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <i data-lucide="images" style={{ width: 14, height: 14 }}></i> 예시 결과·사용법 이미지를 추가하면, 구매자가 상세 페이지에서 넘겨보며 확인할 수 있어요.
                  </p>
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8 }}>
              {status === "saved" && <span style={{ color: "var(--ph-text-secondary)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><i data-lucide="check" style={{ width: 16, height: 16 }}></i> 임시저장됐어요</span>}
              {status === "submitted" && <span style={{ color: "var(--ph-primary)", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}><i data-lucide="check-circle-2" style={{ width: 16, height: 16 }}></i> 등록 검토 요청이 접수됐어요</span>}
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <Button variant="secondary" size="lg" onClick={() => setStatus("saved")}>임시저장</Button>
                <Button variant="solid" size="lg" onClick={submit}>등록하기</Button>
              </div>
            </div>
          </div>

          {/* ── Live preview ── */}
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ph-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
              <i data-lucide="eye" style={{ width: 15, height: 15 }}></i> 미리보기
            </div>
            <Card padding="14px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ height: 150, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--ph-border)" }}>
                <i data-lucide={catObj.icon} style={{ width: 40, height: 40, color: "var(--ph-primary)", opacity: 0.85 }}></i>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge tone="neutral" style={{ whiteSpace: "nowrap" }}>{model || "모델 미정"}</Badge>
                <Badge tone="blue" style={{ whiteSpace: "nowrap" }}>{catObj.label}</Badge>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, color: title ? "var(--ph-text)" : "var(--ph-text-muted)", textWrap: "pretty" }}>{title || "프롬프트 제목이 여기에 표시돼요"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ph-text-muted)", fontSize: 13 }}>
                <i data-lucide="star" style={{ width: 14, height: 14, fill: "var(--ph-primary)", color: "var(--ph-primary)" }}></i>
                <span style={{ color: "var(--ph-text)", fontWeight: 600 }}>신규</span><span>·</span><span>{user ? user.name : "내 상점"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{price ? won(price) : "₩ —"}</span>
                <span style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>0회 판매</span>
              </div>
            </Card>

            <Card padding="16px">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>프롬프트 내용</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.65, color: body ? "var(--ph-text-secondary)" : "var(--ph-text-muted)", whiteSpace: "pre-wrap", maxHeight: 220, overflowY: "auto", fontFamily: "var(--ph-font-family)" }}>{body || "내용을 입력하면 이곳에서 실제 표시 형태를 확인할 수 있어요."}</div>
              {tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                  {tags.map((t) => <span key={t} style={{ fontSize: 12, color: "var(--ph-text-muted)" }}>#{t}</span>)}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }
  window.SellScreen = SellScreen;

  /* ── 상품 수정 ────────────────────────────────────────────────────
   * Edit an existing listing (title / content / price / category) and
   * record the change as a NEW version. The "업데이트 내용" note is
   * required — every saved edit becomes a changelog entry buyers can see. */
  function EditScreen({ p, go, showToast }) {
    const { Button, Input, Card, Tag, Badge } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    const { categories } = window.PH_DATA;
    const cats = categories.filter((c) => c.id !== "all");
    const [title, setTitle] = React.useState(p.title || "");
    const [cat, setCat] = React.useState(p.cat || "writing");
    const [model, setModel] = React.useState(p.model || "");
    const [price, setPrice] = React.useState(p.price === 0 ? "0" : String(p.price || ""));
    const [body, setBody] = React.useState(p.desc || "");
    const [note, setNote] = React.useState("");
    const [noteErr, setNoteErr] = React.useState(false);

    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const versions = store.getVersions ? store.getVersions(p) : [];
    const curVer = versions[0] ? versions[0].ver : "1.0";
    const nextVer = window.PH_VERSIONS ? window.PH_VERSIONS.nextVer(curVer) : "1.1";

    const taStyle = { width: "100%", boxSizing: "border-box", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", padding: "12px 14px", fontFamily: "var(--ph-font-family)", fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none", color: "var(--ph-text)" };

    const save = () => {
      if (!note.trim()) { setNoteErr(true); showToast && showToast("업데이트 내용을 입력해 주세요"); return; }
      store.savePromptVersion && store.savePromptVersion(p.id, note);
      showToast && showToast(`v${nextVer} 새 버전으로 저장됐어요`);
      store.openPrompt ? store.openPrompt(p) : go("shop");
    };

    return (
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 32px 0" }}>
        <button onClick={() => go("shop")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 0 }}>
          <i data-lucide="arrow-left" style={{ width: 16, height: 16 }}></i> 내 상점으로
        </button>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <i data-lucide="pencil" style={{ width: 14, height: 14 }}></i> 상품 수정
            </div>
            <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.015em", margin: 0 }}>프롬프트 수정</h1>
            <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "8px 0 0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              저장하면 <Badge tone="neutral">현재 v{curVer}</Badge> <i data-lucide="arrow-right" style={{ width: 15, height: 15, color: "var(--ph-text-muted)" }}></i> <Badge tone="blue" soft={false}>v{nextVer}</Badge> 새 버전으로 기록돼요.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card padding="28px">
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div>
                <Label hint={`${title.length}/60`}>프롬프트 제목</Label>
                <Input value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="예: 전환율 높이는 랜딩 카피 작성" />
              </div>
              <div>
                <Label>카테고리</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {cats.map((c) => <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Tag>)}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><Label>대상 모델</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="예: GPT-4o" /></div>
                <div><Label>가격</Label><Input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="4900" leading={<span style={{ fontWeight: 700 }}>₩</span>} /></div>
              </div>
            </div>
          </Card>

          <Card padding="28px">
            <Label hint={`${body.length}자`}>프롬프트 내용</Label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8}
              placeholder={"판매할 프롬프트 본문을 입력하세요."}
              style={taStyle}></textarea>
          </Card>

          {/* 업데이트 내용 — 필수 */}
          <Card padding="28px" style={{ border: `1px solid ${noteErr ? "var(--ph-error)" : "var(--ph-border)"}` }}>
            <Label hint="필수">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <i data-lucide="history" style={{ width: 16, height: 16, color: "var(--ph-primary)" }}></i> 업데이트 내용
              </span>
            </Label>
            <p style={{ fontSize: 13, color: "var(--ph-text-muted)", margin: "0 0 12px" }}>이번 수정에서 무엇이 바뀌었는지 적어 주세요. 구매자에게 버전 기록으로 표시돼요.</p>
            <textarea value={note} onChange={(e) => { setNote(e.target.value); setNoteErr(false); }} rows={3}
              placeholder={"예: 프롬프트 지시문 개선, 예시 3개 추가"}
              style={{ ...taStyle, borderColor: noteErr ? "var(--ph-error)" : "var(--ph-border)" }}></textarea>
            {noteErr && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--ph-error)" }}><i data-lucide="alert-circle" style={{ width: 15, height: 15 }}></i>업데이트 내용은 필수예요</div>}
          </Card>

          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8 }}>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              <Button variant="secondary" size="lg" onClick={() => go("shop")}>취소</Button>
              <Button variant="solid" size="lg" onClick={save} disabled={!title.trim()}>새 버전으로 저장</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  window.PHEditScreen = EditScreen;

  function ShopScreen({ go, openPrompt, user }) {
    const { Button, Card, Badge } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    const reviewing = store.myListings || [];
    const baseMine = [...window.PH_DATA.prompts].sort((a, b) => b.sales - a.sales).slice(0, 4);
    const mine = [...reviewing, ...baseMine];
    // Soft state — "판매 중단" is a one-way action: a paused listing is hidden from
    // buyers and can NOT be re-listed (재등록 불가). Stored as { [id]: true }.
    const [stopped, setStopped] = React.useState({});
    const [confirmId, setConfirmId] = React.useState(null);
    const isStopped = (id) => !!stopped[id];
    const isReview = (p) => p.status === "review";
    const stopSelling = (id) => { setStopped((s) => ({ ...s, [id]: true })); setConfirmId(null); };
    const activeCount = baseMine.filter((p) => !isStopped(p.id)).length;
    const reviewCount = reviewing.length;
    const stats = [
      { label: "등록 프롬프트", value: "8개", icon: "layers" },
      { label: "누적 판매", value: "5,360회", icon: "shopping-bag" },
      { label: "이번 달 수익", value: won(2840000), icon: "wallet" },
    ];
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.015em", margin: 0 }}>내 상점</h1>
            <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "8px 0 0" }}>{user ? user.name : "판매자"}님의 판매 현황이에요</p>
          </div>
          <Button variant="solid" size="lg" onClick={() => go("sell")}>
            <i data-lucide="plus" style={{ width: 17, height: 17 }}></i> 새 프롬프트 등록
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, margin: "28px 0 8px" }}>
          {stats.map((s) => (
            <Card key={s.label} padding="22px" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 46, height: 46, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i data-lucide={s.icon} style={{ width: 22, height: 22 }}></i>
              </span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>{s.label}</div>
              </div>
            </Card>
          ))}
        </div>

        <section style={{ marginTop: 44 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>내 프롬프트</h2>
            <Badge tone="neutral">판매 중 {activeCount}</Badge>
            {reviewCount > 0 && <Badge tone="blue">검수중 {reviewCount}</Badge>}
          </div>
          <p style={{ fontSize: 13, color: "var(--ph-text-muted)", margin: "0 0 24px", display: "flex", alignItems: "center", gap: 6 }}>
            <i data-lucide="info" style={{ width: 14, height: 14 }}></i> 새로 등록한 프롬프트는 관리자 검수를 거쳐 승인되면 판매가 시작돼요. 판매를 중단하면 다시 등록할 수 없어요.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {mine.map((p) => {
              const review = isReview(p);
              const off = isStopped(p.id);
              const dim = review || off;
              return (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: 24, right: 24, zIndex: 2 }}>
                      {review
                        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: "var(--ph-radius-full)", background: "var(--ph-text)", color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}><i data-lucide="clock" style={{ width: 12, height: 12 }}></i>검수중</span>
                        : <Badge tone={off ? "neutral" : "blue"} soft={false} style={{ whiteSpace: "nowrap" }}>{off ? "판매 중단" : "판매중"}</Badge>}
                    </div>
                    <div style={{ opacity: dim ? 0.5 : 1, filter: dim ? "grayscale(0.7)" : "none", pointerEvents: dim ? "none" : "auto", transition: "opacity .15s ease, filter .15s ease" }}>
                      <window.PromptCard p={p} onOpen={review ? null : openPrompt} hideActions />
                    </div>
                  </div>
                  {review ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ph-text-secondary)", display: "flex", alignItems: "center", gap: 5 }}>
                        <i data-lucide="search-check" style={{ width: 14, height: 14, color: "var(--ph-primary)" }}></i> 관리자 검수 대기 중이에요
                      </span>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => store.editPrompt && store.editPrompt(p)}>
                        <i data-lucide="pencil" style={{ width: 15, height: 15 }}></i> 수정
                      </Button>
                    </div>
                  ) : off ? (
                    <Button variant="secondary" size="sm" fullWidth disabled>
                      <i data-lucide="lock" style={{ width: 15, height: 15 }}></i> 재등록 불가
                    </Button>
                  ) : confirmId === p.id ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ph-error)", display: "flex", alignItems: "center", gap: 5 }}>
                        <i data-lucide="alert-triangle" style={{ width: 14, height: 14 }}></i> 중단하면 다시 등록할 수 없어요
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(null)}>취소</Button>
                        <Button variant="solid" size="sm" fullWidth onClick={() => stopSelling(p.id)}>중단</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => store.editPrompt && store.editPrompt(p)}>
                        <i data-lucide="pencil" style={{ width: 15, height: 15 }}></i> 수정
                      </Button>
                      <Button variant="secondary" size="sm" fullWidth onClick={() => setConfirmId(p.id)}>
                        <i data-lucide="circle-pause" style={{ width: 15, height: 15 }}></i> 판매 중단
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }
  window.PHShopScreen = ShopScreen;

  /* ── 판매자 등록 요청 ──────────────────────────────────────────────
   * Buyers / visitors apply to become a seller; an admin reviews the
   * request. Submitting shows a success state — the account stays a
   * buyer until approval. */
  function SellerApplyScreen({ go, user, showToast, openLogin }) {
    const { Button, Input, Card, Tag, Avatar } = window.PromptHubDesignSystem_19db23;
    const cats = window.PH_DATA.categories.filter((c) => c.id !== "all");
    const [picked, setPicked] = React.useState([]);
    const [intro, setIntro] = React.useState("");
    const [link, setLink] = React.useState("");
    const [agree, setAgree] = React.useState(false);
    const [done, setDone] = React.useState(false);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    // Name + email are pulled straight from the signed-in account (read-only).
    const name = user ? user.name : "";
    const email = user ? user.email : "";
    const togglePick = (id) => setPicked((s) => s.includes(id) ? s.filter((x) => x !== id) : (s.length < 3 ? [...s, id] : s));
    const valid = picked.length > 0 && agree;
    const submit = () => {
      if (!valid) { showToast && showToast("필수 항목을 모두 입력해 주세요"); return; }
      setDone(true);
      showToast && showToast("판매자 등록 요청이 접수됐어요");
      window.scrollTo({ top: 0 });
    };

    const taStyle = { width: "100%", boxSizing: "border-box", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", padding: "12px 14px", fontFamily: "var(--ph-font-family)", fontSize: 15, lineHeight: 1.6, resize: "vertical", outline: "none", color: "var(--ph-text)" };
    const steps = [
      { icon: "send", t: "요청 접수", d: "신청서가 관리자에게 전달돼요." },
      { icon: "search-check", t: "관리자 검토", d: "보통 1~2 영업일 내에 확인해요." },
      { icon: "store", t: "판매자 전환", d: "승인되면 바로 프롬프트를 등록할 수 있어요." },
    ];

    if (!user) {
      return (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" }}>
          <span style={{ width: 64, height: 64, borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <i data-lucide="lock" style={{ width: 28, height: 28 }}></i>
          </span>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: "24px 0 10px", letterSpacing: "-0.01em" }}>로그인이 필요해요</h1>
          <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "0 0 28px", lineHeight: 1.6 }}>판매자 등록은 로그인 계정의 이름·이메일로 신청해요. 먼저 로그인해 주세요.</p>
          <Button variant="solid" size="lg" onClick={openLogin}>로그인</Button>
        </div>
      );
    }

    if (done) {
      return (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 32px 0", textAlign: "center" }}>
          <span style={{ width: 72, height: 72, borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <i data-lucide="check" style={{ width: 34, height: 34 }}></i>
          </span>
          <h1 style={{ fontSize: 29, fontWeight: 700, letterSpacing: "-0.015em", margin: "26px 0 12px" }}>등록 요청이 접수됐어요</h1>
          <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", lineHeight: 1.65, margin: "0 0 14px" }}>
            관리자 검토 후 <b style={{ color: "var(--ph-text)" }}>{email || "등록하신 이메일"}</b>로 결과를 안내드릴게요.<br />보통 1~2 영업일이 걸려요.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600, marginBottom: 30 }}>
            <i data-lucide="clock" style={{ width: 14, height: 14 }}></i> 검토 대기 중
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Button variant="solid" size="lg" onClick={() => go("home")}>홈으로</Button>
            <Button variant="secondary" size="lg" onClick={() => go("browse")}>프롬프트 둘러보기</Button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 0" }}>
        <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 14, display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: 0 }}>
          <i data-lucide="arrow-left" style={{ width: 16, height: 16 }}></i> 홈으로
        </button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            <i data-lucide="store" style={{ width: 14, height: 14 }}></i> 판매자 신청
          </div>
          <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.015em", margin: 0 }}>판매자 등록 요청</h1>
          <p style={{ fontSize: 16, color: "var(--ph-text-secondary)", margin: "8px 0 0" }}>간단한 신청서를 보내면 관리자가 검토 후 판매자 권한을 드려요.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 40, alignItems: "start" }}>
          {/* ── Form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <Card padding="28px">
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div>
                  <Label hint="로그인 정보에서 자동 입력">신청자 정보</Label>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)" }}>
                    <Avatar name={name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ph-text)" }}>{name}</div>
                      <div style={{ fontSize: 13.5, color: "var(--ph-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--ph-text-muted)", whiteSpace: "nowrap" }}>
                      <i data-lucide="lock" style={{ width: 13, height: 13 }}></i> 로그인 정보
                    </span>
                  </div>
                </div>
                <div>
                  <Label hint={`${picked.length}/3`}>주력 카테고리</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {cats.map((c) => <Tag key={c.id} selected={picked.includes(c.id)} onClick={() => togglePick(c.id)}>{c.label}</Tag>)}
                  </div>
                </div>
              </div>
            </Card>

            <Card padding="28px">
              <Label hint="선택">판매할 프롬프트 소개</Label>
              <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={5}
                placeholder={"어떤 프롬프트를 판매할 계획인지 알려주세요.\n예) 마케팅 카피·블로그 글쓰기용 GPT 프롬프트를 주로 만듭니다."}
                style={taStyle}></textarea>
            </Card>

            <Card padding="28px">
              <Label hint="선택">포트폴리오 / 링크</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="블로그, 포트폴리오, SNS 주소" leading={<i data-lucide="link" style={{ width: 16, height: 16, color: "var(--ph-text-muted)" }}></i>} />
            </Card>

            <Card padding="20px 24px">
              <button onClick={() => setAgree(!agree)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "var(--ph-font-family)" }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: "var(--ph-radius-sm)", border: agree ? "none" : "1.5px solid var(--ph-gray-line)", background: agree ? "var(--ph-primary)" : "#fff", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background .15s ease" }}>
                  {agree && <i data-lucide="check" style={{ width: 14, height: 14 }}></i>}
                </span>
                <span style={{ fontSize: 14, color: "var(--ph-text)" }}>판매자 이용약관과 정산 정책(수수료 15%)에 동의합니다.</span>
              </button>
            </Card>

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 8 }}>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <Button variant="secondary" size="lg" onClick={() => go("home")}>취소</Button>
                <Button variant="solid" size="lg" onClick={submit} disabled={!valid}>등록 요청 보내기</Button>
              </div>
            </div>
          </div>

          {/* ── Side: process explainer ── */}
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
            <Card padding="24px">
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>어떻게 진행되나요</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: "var(--ph-radius-lg)", background: "var(--ph-secondary)", color: "var(--ph-primary)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <i data-lucide={s.icon} style={{ width: 18, height: 18 }}></i>
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.t}</div>
                      <div style={{ fontSize: 13, color: "var(--ph-text-muted)", lineHeight: 1.5, marginTop: 2 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="20px 24px" style={{ background: "var(--ph-secondary)", border: "none" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <i data-lucide="badge-percent" style={{ width: 18, height: 18, color: "var(--ph-primary)", flexShrink: 0, marginTop: 1 }}></i>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ph-text-secondary)" }}>등록은 <b style={{ color: "var(--ph-text)" }}>무료</b>예요. 판매가 발생할 때만 <b style={{ color: "var(--ph-text)" }}>수수료 15%</b>가 적용돼요.</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  window.PHSellerApply = SellerApplyScreen;
})();
