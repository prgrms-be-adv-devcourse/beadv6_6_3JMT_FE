/* PromptHub — 마이페이지: 프로필, 구매한 프롬프트, 찜한 프롬프트, 설정(닉네임 수정 포함). */
(() => {
  function Switch({ on, onChange }) {
    return (
      <button onClick={() => onChange(!on)} aria-pressed={on}
        style={{ width: 46, height: 27, borderRadius: 9999, border: "none", cursor: "pointer", background: on ? "var(--ph-primary)" : "var(--ph-gray-line)", position: "relative", transition: "background .15s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: "50%", background: "#fff", transition: "left .15s" }}></span>
      </button>
    );
  }

  function Row({ children, last }) {
    return <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 0", borderBottom: last ? "none" : "1px solid var(--ph-border)" }}>{children}</div>;
  }

  function EmptyState({ icon, text, cta, onCta }) {
    const { Button } = window.PromptHubDesignSystem_19db23;
    return (
      <div style={{ padding: "72px 0", textAlign: "center", color: "var(--ph-text-muted)" }}>
        <i data-lucide={icon} style={{ width: 40, height: 40 }}></i>
        <p style={{ margin: "14px 0 20px", fontSize: 15 }}>{text}</p>
        {cta && <Button variant="solid" onClick={onCta}>{cta}</Button>}
      </div>
    );
  }

  /* ── 이메일 변경 + 별도 인증 모달 ──────────────────────────────────
   * 2-step flow: ① 새 이메일 입력 → 인증번호 발송  ② 6자리 인증번호 확인 → 변경 완료.
   * 프로토타입이라 인증번호는 클라이언트에서 생성하고 데모 힌트로 노출합니다. */
  function EmailChangeModal({ currentEmail, onClose, onVerified }) {
    const { Button, Input } = window.PromptHubDesignSystem_19db23;
    const [step, setStep] = React.useState("input"); // input | verify
    const [email, setEmail] = React.useState("");
    const [err, setErr] = React.useState("");
    const [code, setCode] = React.useState("");
    const [sentCode, setSentCode] = React.useState("");
    const [codeErr, setCodeErr] = React.useState("");
    const [secsLeft, setSecsLeft] = React.useState(0);
    const codeRef = React.useRef(null);

    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    React.useEffect(() => { if (step === "verify") codeRef.current && codeRef.current.focus(); }, [step]);
    React.useEffect(() => {
      if (secsLeft <= 0) return;
      const t = setTimeout(() => setSecsLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }, [secsLeft]);

    const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
    const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

    const sendCode = () => {
      const v = email.trim();
      if (!validEmail(v)) { setErr("올바른 이메일 형식이 아니에요"); return; }
      if (v.toLowerCase() === currentEmail.toLowerCase()) { setErr("현재 사용 중인 이메일과 같아요"); return; }
      const c = genCode();
      setSentCode(c); setErr(""); setCode(""); setCodeErr(""); setSecsLeft(180); setStep("verify");
    };
    const resend = () => { if (secsLeft > 0) return; setSentCode(genCode()); setCode(""); setCodeErr(""); setSecsLeft(180); };
    const verify = () => {
      if (code.length !== 6) return;
      if (code !== sentCode) { setCodeErr("인증번호가 일치하지 않아요"); return; }
      onVerified(email.trim());
    };
    const mmss = (s) => `${String(Math.floor(s / 60)).padStart(1, "0")}:${String(s % 60).padStart(2, "0")}`;

    const errStyle = { display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, fontWeight: 600, color: "var(--ph-error)" };

    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: "var(--ph-radius-xl)", maxWidth: 440, width: "100%", padding: 28 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i data-lucide={step === "input" ? "mail" : "shield-check"} style={{ width: 22, height: 22, color: "var(--ph-primary)" }}></i>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-muted)", padding: 4, lineHeight: 0 }}>
              <i data-lucide="x" style={{ width: 20, height: 20 }}></i>
            </button>
          </div>

          {step === "input" && (
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, margin: "14px 0 6px" }}>이메일 변경</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ph-text-secondary)", margin: "0 0 20px" }}>새 이메일 주소를 입력하면 인증번호를 보내드려요. 인증을 완료해야 변경돼요.</p>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ph-text-muted)", marginBottom: 6 }}>현재 이메일</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text-secondary)", padding: "11px 14px", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)" }}>{currentEmail}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <Input label="새 이메일" type="email" value={email} placeholder="you@example.com" autoFocus
                  onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") sendCode(); }} />
                {err && <div style={errStyle}><i data-lucide="alert-circle" style={{ width: 15, height: 15 }}></i>{err}</div>}
              </div>
              <div style={{ marginTop: 24 }}>
                <Button variant="solid" size="lg" fullWidth onClick={sendCode} disabled={!email.trim()}>인증번호 받기</Button>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, margin: "14px 0 6px" }}>인증번호 입력</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ph-text-secondary)", margin: "0 0 16px" }}>
                <strong style={{ color: "var(--ph-text)", fontWeight: 700 }}>{email.trim()}</strong> 으로 보낸 6자리 인증번호를 입력하세요.
              </p>
              {/* 데모 힌트 — 실제 서비스에서는 메일로만 전송됩니다 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "var(--ph-secondary)", borderRadius: "var(--ph-radius-md)", marginBottom: 18, fontSize: 13, color: "var(--ph-primary)", fontWeight: 600 }}>
                <i data-lucide="info" style={{ width: 15, height: 15, flexShrink: 0 }}></i>
                <span>데모용 인증번호: <span style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.08em" }}>{sentCode}</span></span>
              </div>
              <div style={{ position: "relative" }}>
                <input ref={codeRef} inputMode="numeric" maxLength={6} value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeErr(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                  placeholder="000000"
                  style={{ width: "100%", boxSizing: "border-box", fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 24, fontWeight: 700, letterSpacing: "0.34em", textAlign: "center", padding: "14px 16px", border: `1px solid ${codeErr ? "var(--ph-error)" : "var(--ph-border)"}`, borderRadius: "var(--ph-radius-md)", color: "var(--ph-text)", outline: "none" }} />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: secsLeft > 0 ? "var(--ph-text-muted)" : "var(--ph-error)", fontFamily: "ui-monospace, monospace" }}>{secsLeft > 0 ? mmss(secsLeft) : "만료"}</span>
              </div>
              {codeErr && <div style={errStyle}><i data-lucide="alert-circle" style={{ width: 15, height: 15 }}></i>{codeErr}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <button onClick={() => { setStep("input"); setCodeErr(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, padding: 0 }}>
                  <i data-lucide="arrow-left" style={{ width: 14, height: 14 }}></i>이메일 다시 입력
                </button>
                <button onClick={resend} disabled={secsLeft > 0} style={{ background: "none", border: "none", cursor: secsLeft > 0 ? "default" : "pointer", color: secsLeft > 0 ? "var(--ph-text-muted)" : "var(--ph-primary)", fontFamily: "var(--ph-font-family)", fontSize: 13, fontWeight: 600, padding: 0 }}>
                  인증번호 재발송
                </button>
              </div>
              <div style={{ marginTop: 22 }}>
                <Button variant="solid" size="lg" fullWidth onClick={verify} disabled={code.length !== 6 || secsLeft <= 0}>인증하고 변경하기</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function MyPage() {
    const { Button, Input, Card, Avatar } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    const user = store.user || { name: "", email: "" };
    const [tab, setTab] = React.useState(store.myTab || "profile");
    const [nick, setNick] = React.useState(user.name);
    const [savedNick, setSavedNick] = React.useState(false);
    const [emailModal, setEmailModal] = React.useState(false);
    const [notif, setNotif] = React.useState({ email: true, marketing: false, newPrompt: true });
    const [refundTarget, setRefundTarget] = React.useState(null);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    React.useEffect(() => { setTab(store.myTab || "profile"); }, [store.myTab]);
    React.useEffect(() => { setNick(user.name); }, [user.name]);

    const nav = [
      { id: "profile", label: "프로필", icon: "user" },
      { id: "purchased", label: "구매한 프롬프트", icon: "shopping-bag" },
      { id: "wishlist", label: "찜한 프롬프트", icon: "heart" },
      { id: "payments", label: "결제 내역", icon: "receipt" },
      { id: "settings", label: "설정", icon: "settings" },
    ];
    const purchased = store.purchased || [];
    const wishlist = store.wishlist || [];
    const refunds = store.refunds || {};
    const won = window.won || ((n) => "₩" + (n || 0).toLocaleString("ko-KR"));
    const STATUS = {
      paid: { label: "결제완료", color: "var(--ph-primary)", bg: "var(--ph-secondary)" },
      requested: { label: "환불 신청 중", color: "var(--ph-red)", bg: "rgba(217,45,32,0.10)" },
      refunded: { label: "환불 완료", color: "var(--ph-gray-600)", bg: "var(--ph-gray-100)" },
    };

    const SectionTitle = ({ children, sub }) => (
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{children}</h2>
        {sub && <p style={{ color: "var(--ph-text-secondary)", fontSize: 15, margin: "6px 0 0" }}>{sub}</p>}
      </div>
    );

    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 32px 0" }}>
        <h1 style={{ fontSize: 33, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 28px" }}>마이페이지</h1>
        <div style={{ display: "grid", gridTemplateColumns: "224px 1fr", gap: 36, alignItems: "start" }}>
          {/* Sidebar */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 4, position: "sticky", top: 88 }}>
            {nav.map((n) => (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--ph-radius-md)", border: "none", cursor: "pointer", fontFamily: "var(--ph-font-family)", fontSize: 15, fontWeight: tab === n.id ? 700 : 500, textAlign: "left",
                  background: tab === n.id ? "var(--ph-secondary)" : "transparent", color: tab === n.id ? "var(--ph-primary)" : "var(--ph-text-secondary)" }}>
                <i data-lucide={n.icon} style={{ width: 18, height: 18 }}></i>{n.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--ph-border)", margin: "8px 0" }}></div>
            <button onClick={() => store.logout && store.logout()}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--ph-radius-md)", border: "none", cursor: "pointer", fontFamily: "var(--ph-font-family)", fontSize: 15, fontWeight: 500, textAlign: "left", background: "transparent", color: "var(--ph-error)" }}>
              <i data-lucide="log-out" style={{ width: 18, height: 18 }}></i>로그아웃
            </button>
          </nav>

          {/* Content */}
          <div>
            {tab === "profile" && (
              <div>
                <SectionTitle sub="내 계정 정보를 확인하세요.">프로필</SectionTitle>
                <Card padding="28px">
                  <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                    <image-slot id="mypage-avatar" placeholder="사진 추가" shape="circle" fit="cover" style={{ width: 96, height: 96, display: "block" }}></image-slot>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{user.name}</div>
                      <div style={{ color: "var(--ph-text-muted)", fontSize: 15, marginTop: 4 }}>{user.email}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 11px", background: "var(--ph-secondary)", color: "var(--ph-primary)", borderRadius: "var(--ph-radius-full)", fontSize: 13, fontWeight: 600 }}>
                        <i data-lucide={user.role === "seller" ? "store" : "user"} style={{ width: 13, height: 13 }}></i>{user.role === "seller" ? "판매자 계정" : "구매자 계정"}
                      </div>
                    </div>
                    <Button variant="secondary" onClick={() => setTab("settings")} style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>프로필 수정</Button>
                  </div>
                </Card>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
                  {[{ l: "구매한 프롬프트", v: purchased.length, t: "purchased" }, { l: "찜한 프롬프트", v: wishlist.length, t: "wishlist" }, { l: "장바구니", v: (store.cart || []).length }].map((s) => (
                    <Card key={s.l} padding="20px" interactive={!!s.t} style={{ cursor: s.t ? "pointer" : "default" }} onClick={() => s.t && setTab(s.t)}>
                      <div style={{ fontSize: 26, fontWeight: 700 }}>{s.v}</div>
                      <div style={{ fontSize: 14, color: "var(--ph-text-muted)", marginTop: 4 }}>{s.l}</div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {tab === "purchased" && (
              <div>
                <SectionTitle sub="결제한 프롬프트를 다시 받아볼 수 있어요.">구매한 프롬프트</SectionTitle>
                {purchased.length === 0
                  ? <EmptyState icon="shopping-bag" text="아직 구매한 프롬프트가 없어요." cta="프롬프트 둘러보기" onCta={() => store.go && store.go("browse")} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>{purchased.map((p) => {
                      const rst = refunds[p.id];
                      if (rst) {
                        const label = rst === "refunded" ? "환불 완료" : "환불 신청 중";
                        return (
                          <div key={p.id} style={{ position: "relative", cursor: "not-allowed" }} aria-disabled="true">
                            <div style={{ pointerEvents: "none", filter: "grayscale(0.5)" }}>
                              <window.PromptCard p={p} onOpen={null} />
                            </div>
                            <div style={{ position: "absolute", inset: 0, borderRadius: "var(--ph-radius-lg)", background: "rgba(255,255,255,0.66)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 16 }}>
                              <div style={{ width: 42, height: 42, borderRadius: "var(--ph-radius-full)", background: "#fff", border: "1px solid var(--ph-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <i data-lucide="lock" style={{ width: 19, height: 19, color: "var(--ph-text-secondary)" }}></i>
                              </div>
                              <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 11px", borderRadius: "var(--ph-radius-full)", fontSize: 12, fontWeight: 600, color: "var(--ph-red)", background: "rgba(217,45,32,0.10)", whiteSpace: "nowrap" }}>{label}</span>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ph-text-secondary)" }}>열람할 수 없는 프롬프트예요</div>
                            </div>
                          </div>
                        );
                      }
                      return <window.PromptCard key={p.id} p={p} onOpen={store.openPurchased || store.openPrompt} />;
                    })}</div>}
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <SectionTitle sub="관심 있는 프롬프트를 모아뒀어요.">찜한 프롬프트</SectionTitle>
                {wishlist.length === 0
                  ? <EmptyState icon="heart" text="아직 찜한 프롬프트가 없어요." cta="프롬프트 둘러보기" onCta={() => store.go && store.go("browse")} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>{wishlist.map((p) => <window.PromptCard key={p.id} p={p} onOpen={store.openPrompt} />)}</div>}
              </div>
            )}

            {tab === "payments" && (
              <div>
                <SectionTitle sub="결제한 내역과 환불 상태를 확인하세요.">결제 내역</SectionTitle>
                {purchased.length === 0 ? (
                  <EmptyState icon="receipt" text="아직 결제 내역이 없어요." cta="프롬프트 둘러보기" onCta={() => store.go && store.go("browse")} />
                ) : (
                  <Card padding="0" style={{ overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 116px 110px 116px 108px", alignItems: "center", gap: 12, padding: "14px 22px", borderBottom: "1px solid var(--ph-border)", fontSize: 13, fontWeight: 600, color: "var(--ph-text-muted)", background: "var(--ph-gray-50)" }}>
                      <div>상품명</div>
                      <div>결제일</div>
                      <div>금액</div>
                      <div>상태</div>
                      <div style={{ textAlign: "right" }}>환불</div>
                    </div>
                    {purchased.map((p, i) => {
                      const st = refunds[p.id] || "paid";
                      const meta = STATUS[st];
                      const isFree = p.price === 0;
                      const canRefund = st === "paid" && !isFree;
                      const dateStr = new Date(p.purchasedAt || Date.now()).toLocaleDateString("ko-KR");
                      return (
                        <div key={p.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 116px 110px 116px 108px", alignItems: "center", gap: 12, padding: "16px 22px", borderTop: i ? "1px solid var(--ph-border)" : "none" }}>
                          <div style={{ minWidth: 0, fontSize: 14, fontWeight: 600, color: "var(--ph-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                          <div style={{ fontSize: 13, color: "var(--ph-text-secondary)" }}>{dateStr}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ph-text)" }}>{p.price === 0 ? "무료" : won(p.price)}</div>
                          <div>
                            <span style={{ display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: "var(--ph-radius-full)", fontSize: 12, fontWeight: 600, color: meta.color, background: meta.bg, whiteSpace: "nowrap" }}>{meta.label}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {isFree ? (
                              <span style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>—</span>
                            ) : canRefund ? (
                              <Button variant="secondary" size="sm" onClick={() => setRefundTarget(p)}>환불 신청</Button>
                            ) : (
                              <button disabled style={{ fontFamily: "var(--ph-font-family)", fontSize: 14, fontWeight: 600, padding: "7px 12px", minHeight: 34, borderRadius: "var(--ph-radius-sm)", border: "1px solid var(--ph-border)", background: "var(--ph-gray-100)", color: "var(--ph-text-muted)", cursor: "not-allowed" }}>환불 신청</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </div>
            )}

            {tab === "settings" && (
              <div>
                <SectionTitle sub="알림과 계정을 관리하세요.">설정</SectionTitle>

                <div style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>계정 관리</div>
                <Card padding="8px 24px">
                  <Row>
                    <div style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>닉네임</div>
                      <div style={{ fontSize: 13, color: "var(--ph-text-muted)", marginTop: 2 }}>다른 사용자에게 표시돼요</div>
                    </div>
                    <div style={{ flex: 1, maxWidth: 280 }}>
                      <Input value={nick} onChange={(e) => { setNick(e.target.value); setSavedNick(false); }} placeholder="닉네임" />
                    </div>
                    <Button variant="solid" onClick={() => { store.updateNickname && store.updateNickname(nick.trim() || user.name); setSavedNick(true); }} disabled={!nick.trim() || nick.trim() === user.name} style={{ whiteSpace: "nowrap" }}>
                      {savedNick ? "저장됨 ✓" : "저장"}
                    </Button>
                  </Row>
                  <Row>
                    <div style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>이메일</div>
                      <div style={{ fontSize: 13, color: "var(--ph-text-muted)", marginTop: 2 }}>로그인·알림에 사용돼요</div>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, color: "var(--ph-text-secondary)", fontSize: 15, minWidth: 0 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, padding: "3px 9px", borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", color: "var(--ph-primary)", fontSize: 12, fontWeight: 600 }}>
                        <i data-lucide="check" style={{ width: 12, height: 12 }}></i>인증됨
                      </span>
                    </div>
                    <Button variant="secondary" onClick={() => setEmailModal(true)} style={{ whiteSpace: "nowrap" }}>이메일 변경</Button>
                  </Row>
                  <Row last>
                    <div style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>비밀번호</div>
                    </div>
                    <div style={{ flex: 1 }}></div>
                    <Button variant="secondary" onClick={() => {}} style={{ whiteSpace: "nowrap" }}>비밀번호 변경</Button>
                  </Row>
                </Card>

                <div style={{ fontSize: 15, fontWeight: 700, margin: "32px 0 12px" }}>알림 설정</div>
                <Card padding="8px 24px">
                  {[{ k: "email", t: "이메일 알림", d: "주문·다운로드 관련 안내를 이메일로 받아요" }, { k: "newPrompt", t: "새 프롬프트 알림", d: "찜한 크리에이터의 새 프롬프트를 알려드려요" }, { k: "marketing", t: "마케팅 정보 수신", d: "할인·이벤트 소식을 받아요" }].map((n, i, arr) => (
                    <Row key={n.k} last={i === arr.length - 1}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{n.t}</div>
                        <div style={{ fontSize: 13, color: "var(--ph-text-muted)", marginTop: 2 }}>{n.d}</div>
                      </div>
                      <Switch on={notif[n.k]} onChange={(v) => setNotif((s) => ({ ...s, [n.k]: v }))} />
                    </Row>
                  ))}
                </Card>

                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => {}} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-error)", fontFamily: "var(--ph-font-family)", fontSize: 14, fontWeight: 600 }}>회원 탈퇴</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {emailModal && (
          <EmailChangeModal
            currentEmail={user.email}
            onClose={() => setEmailModal(false)}
            onVerified={(newEmail) => { store.updateEmail && store.updateEmail(newEmail); setEmailModal(false); }}
          />
        )}

        {refundTarget && (
          <div onClick={() => setRefundTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: "var(--ph-radius-xl)", maxWidth: 420, width: "100%", padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--ph-radius-full)", background: "rgba(217,45,32,0.10)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <i data-lucide="alert-triangle" style={{ width: 22, height: 22, color: "var(--ph-red)" }}></i>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>환불 신청</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ph-text-secondary)", margin: "0 0 24px" }}>환불 신청 시 구매한 상품 열람이 불가합니다. 환불을 신청하시겠습니까?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}><Button variant="secondary" size="lg" fullWidth onClick={() => setRefundTarget(null)}>취소</Button></div>
                <div style={{ flex: 1 }}><Button variant="solid" size="lg" fullWidth onClick={() => { store.requestRefund && store.requestRefund(refundTarget.id); setRefundTarget(null); }}>환불 신청</Button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  window.PHMyPage = MyPage;

  /* ── 구매한 프롬프트 열람 (Reader) ──────────────────────────────────
   * Buyer-only view of a purchased prompt: full prompt text + copy,
   * seller info + contact, and a link back to the purchases list.
   * Access is gated in main.jsx (must be logged in AND have purchased). */
  const ROLE_BY_CAT = {
    image: "전문 비주얼 디렉터", writing: "전문 카피라이터", coding: "시니어 소프트웨어 엔지니어",
    marketing: "데이터 기반 그로스 마케터", chatbot: "CS 챗봇 설계자", data: "데이터 분석가",
  };
  function buildPromptText(p) {
    const cats = (window.PH_DATA.categories || []);
    const catLabel = (cats.find((c) => c.id === p.cat) || {}).label || "일반";
    const role = ROLE_BY_CAT[p.cat] || "전문가";
    return [
      `당신은 ${role}입니다. 아래 지침에 따라 "${p.title}" 작업을 수행하세요.`,
      ``,
      `[목표]`,
      p.desc,
      ``,
      `[입력 정보]`,
      `- 주제 / 대상: {{여기에 작업 대상을 입력하세요}}`,
      `- 톤앤매너: {{예: 신뢰감 있고 간결하게}}`,
      `- 추가 제약: {{선택 사항}}`,
      ``,
      `[작업 단계]`,
      `1. 입력 정보를 분석해 핵심 요구사항을 3가지로 요약합니다.`,
      `2. ${catLabel} 관점에서 최적의 결과를 ${p.model} 기준으로 생성합니다.`,
      `3. 결과를 바로 사용할 수 있는 형태로 정리하고, 대안 1가지를 함께 제안합니다.`,
      ``,
      `[출력 형식]`,
      `- 핵심 결과: 가장 먼저, 군더더기 없이`,
      `- 대안 제안: 한 줄 요약 + 사용하면 좋은 상황`,
      `- 체크리스트: 결과를 검수할 때 확인할 항목 3가지`,
      ``,
      `[주의사항]`,
      `- 추측이 필요한 부분은 가정한 내용을 명시하세요.`,
      `- 사실 확인이 필요한 수치는 임의로 만들지 마세요.`,
    ].join("\n");
  }

  function StarRate({ value, onRate, size = 34 }) {
    const [hover, setHover] = React.useState(0);
    const active = hover || value;
    return (
      <div style={{ display: "flex", gap: 4 }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= active;
          return (
            <button key={n} onClick={() => onRate(n)} onMouseEnter={() => setHover(n)} aria-label={`${n}점`}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, lineHeight: 0 }}>
              <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "var(--ph-primary)" : "none"} stroke={on ? "var(--ph-primary)" : "var(--ph-gray-line)"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" style={{ transition: "fill .12s ease, stroke .12s ease" }}>
                <path d="M12 2.6l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 18.6l-5.91 3.11 1.13-6.57L2.45 9.54l6.6-.96z"></path>
              </svg>
            </button>
          );
        })}
      </div>
    );
  }

  function ReaderScreen({ p, go, openMyPage, showToast }) {
    const { Button, Card, Badge, Avatar } = window.PromptHubDesignSystem_19db23;
    const store = React.useContext(window.PHCtx) || {};
    const [downloaded, setDownloaded] = React.useState(false);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [fmt, setFmt] = React.useState("txt");
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });
    if (!p) return null;

    const cats = (window.PH_DATA.categories || []);
    const catLabel = (cats.find((c) => c.id === p.cat) || {}).label || "일반";
    const text = buildPromptText(p);
    const dateStr = new Date(p.purchasedAt || Date.now()).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const myRating = store.myRating ? store.myRating(p.id) : 0;
    const rate = (n) => store.ratePrompt && store.ratePrompt(p.id, n);

    const safeName = (p.title || "prompt").replace(/[\\/:*?"<>|]+/g, " ").trim() || "prompt";
    const fmtLabel = { txt: ".txt", md: ".md", pdf: ".pdf" };
    const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const triggerBlob = (blob, filename) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    };
    const doDownload = (format) => {
      if (format === "pdf") {
        const w = window.open("", "_blank");
        if (!w) { showToast && showToast("팝업이 차단되어 PDF를 열 수 없어요"); return; }
        w.document.write('<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>' + escapeHtml(p.title) + '</title><style>@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css");body{font-family:Pretendard,system-ui,sans-serif;padding:48px;color:#111;}h1{font-size:22px;margin:0 0 20px;}pre{white-space:pre-wrap;word-break:break-word;font-family:Pretendard,system-ui,sans-serif;font-size:14px;line-height:1.7;margin:0;}</style></head><body><h1>' + escapeHtml(p.title) + '</h1><pre>' + escapeHtml(text) + '</pre><scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print();},300);};</scr' + 'ipt></body></html>');
        w.document.close();
        showToast && showToast("PDF 인쇄 창을 열었어요");
        return;
      }
      const content = format === "md" ? ("# " + p.title + "\n\n" + text) : text;
      const mime = format === "md" ? "text/markdown" : "text/plain";
      triggerBlob(new Blob([content], { type: mime + ";charset=utf-8" }), safeName + "." + format);
      showToast && showToast(fmtLabel[format] + " 파일을 다운로드했어요");
    };
    const confirmDownload = () => { setConfirmOpen(false); setDownloaded(true); };

    const backLink = (
      <button onClick={() => openMyPage("purchased")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ph-text-secondary)", fontFamily: "var(--ph-font-family)", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}>
        <i data-lucide="arrow-left" style={{ width: 16, height: 16 }}></i> 다른 구매 프롬프트 보기
      </button>
    );

    return (
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px 0" }}>
        <div style={{ marginBottom: 22 }}>{backLink}</div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Badge tone="blue">{catLabel}</Badge>
          <Badge tone="neutral">{p.model}</Badge>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "var(--ph-primary)" }}>
            <i data-lucide="check-circle-2" style={{ width: 15, height: 15 }}></i> 구매 완료
          </span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.015em", margin: 0, lineHeight: 1.3, textWrap: "pretty" }}>{p.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: "var(--ph-text-muted)", fontSize: 14 }}>
          <i data-lucide="calendar-check" style={{ width: 15, height: 15 }}></i> 구매일 {dateStr}
        </div>

        {/* Full prompt text */}
        <Card padding="0" style={{ marginTop: 28, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--ph-border)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              <i data-lucide="file-text" style={{ width: 17, height: 17, color: "var(--ph-primary)" }}></i> 프롬프트 전문
            </div>
            {downloaded ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select value={fmt} onChange={(e) => setFmt(e.target.value)} aria-label="파일 형식"
                  style={{ height: 34, padding: "0 30px 0 12px", borderRadius: "var(--ph-radius-sm)", border: "1px solid var(--ph-border)", background: "#fff", fontFamily: "var(--ph-font-family)", fontSize: 14, fontWeight: 600, color: "var(--ph-text)", cursor: "pointer", appearance: "none", WebkitAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238B95A1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
                  <option value="txt">.txt</option>
                  <option value="md">.md</option>
                  <option value="pdf">.pdf</option>
                </select>
                <Button variant="solid" size="sm" onClick={() => doDownload(fmt)}>
                  <i data-lucide="download" style={{ width: 15, height: 15 }}></i> 다운로드
                </Button>
              </div>
            ) : (
              <Button variant="solid" size="sm" onClick={() => setConfirmOpen(true)}>
                <i data-lucide="download" style={{ width: 15, height: 15 }}></i> 다운로드
              </Button>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <pre style={{ margin: 0, padding: "22px 20px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 14, lineHeight: 1.7, color: "var(--ph-text)", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--ph-gray-50)", filter: downloaded ? "none" : "blur(6px)", userSelect: downloaded ? "auto" : "none", transition: "filter .25s ease", minHeight: downloaded ? "auto" : 180 }}>{text}</pre>
            {!downloaded && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: "var(--ph-radius-full)", background: "rgba(255,255,255,0.92)", border: "1px solid var(--ph-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i data-lucide="lock" style={{ width: 20, height: 20, color: "var(--ph-text-secondary)" }}></i>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ph-text)" }}>다운로드하면 프롬프트 전문을 확인할 수 있어요</div>
              </div>
            )}
          </div>
        </Card>

        {/* My star review (purchased buyers only) */}
        <Card padding="22px 24px" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>이 프롬프트를 평가해 주세요</div>
              <div style={{ fontSize: 13, color: "var(--ph-text-muted)", marginTop: 4 }}>
                {myRating ? `내 별점 ${myRating}.0 · 다시 누르면 변경돼요` : "별점을 남기면 다른 구매자에게 도움이 돼요"}
              </div>
            </div>
            <StarRate value={myRating} onRate={rate} />
          </div>
        </Card>

        {/* Seller info */}
        <Card padding="22px 24px" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={p.seller} size={48} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{p.seller}</div>
              <div style={{ fontSize: 13, color: "var(--ph-text-muted)", marginTop: 2 }}>판매자 · 별점 {p.rating}</div>
            </div>
            <Button variant="secondary" onClick={() => showToast && showToast("판매자에게 문의를 보냈어요")} style={{ whiteSpace: "nowrap" }}>
              <i data-lucide="message-circle" style={{ width: 16, height: 16 }}></i> 문의하기
            </Button>
          </div>
        </Card>

        <div style={{ display: "flex", justifyContent: "center", margin: "36px 0 8px" }}>{backLink}</div>

        {confirmOpen && (
          <div onClick={() => setConfirmOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: "var(--ph-radius-xl)", maxWidth: 420, width: "100%", padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <i data-lucide="alert-triangle" style={{ width: 22, height: 22, color: "var(--ph-primary)" }}></i>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>다운로드 전 확인</div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ph-text-secondary)", margin: "0 0 24px" }}>다운로드 후에는 환불 처리가 불가합니다. 계속하시겠습니까?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}><Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmOpen(false)}>취소</Button></div>
                <div style={{ flex: 1 }}><Button variant="solid" size="lg" fullWidth onClick={confirmDownload}>다운로드 진행</Button></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  window.PHReaderScreen = ReaderScreen;
})();
