/* PromptHub 관리자 로그인 — 인증 게이트
 * Admin-only sign-in. Same method as the consumer login (이메일+비밀번호,
 * 카카오) but clearly marked 관리자 콘솔. On success sets a session flag and
 * redirects to the dashboard. */
(() => {
  const { Button, Input } = window.PromptHubDesignSystem_19db23;
  const DASHBOARD = "PromptHub 관리자 대시보드.html";

  function AdminLogo() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--ph-primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <i data-lucide="sparkles" style={{ width: 21, height: 21 }}></i>
        </span>
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ph-text)" }}>
            Prompt<span style={{ color: "var(--ph-primary)" }}>Hub</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ph-text-muted)", letterSpacing: "0.05em" }}>ADMIN CONSOLE</span>
        </span>
      </div>
    );
  }

  function Login({ onLogin }) {
    const [email, setEmail] = React.useState("");
    const [pw, setPw] = React.useState("");
    const [err, setErr] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    React.useEffect(() => { window.lucide && window.lucide.createIcons(); });

    const enter = () => {
      // Combined single-file mode: hand control to the parent app (no navigation).
      if (onLogin) { onLogin(email || "admin@prompthub.kr"); return; }
      try { sessionStorage.setItem("ph_admin_auth", "1"); sessionStorage.setItem("ph_admin_email", email || "admin@prompthub.kr"); } catch (e) {}
      window.location.href = DASHBOARD;
    };

    const emailLogin = (e) => {
      e.preventDefault();
      if (!email.trim() || !pw.trim()) { setErr("이메일과 비밀번호를 모두 입력해 주세요."); return; }
      setErr(""); setLoading(true);
      setTimeout(enter, 450); // simulated auth round-trip
    };
    const kakaoLogin = () => { setLoading(true); setTimeout(enter, 450); };

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #fff, #f3f7fd 45%, #e4eefb)" }}>
        {/* top bar */}
        <header style={{ padding: "22px 32px" }}>
          <AdminLogo />
        </header>

        {/* centered card */}
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 24px 64px" }}>
          <div style={{ width: 440, maxWidth: "100%", background: "#fff", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-xl)", padding: 36 }}>
            {/* admin-only marker */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: "var(--ph-radius-full)", background: "var(--ph-secondary)", color: "var(--ph-primary)", fontSize: 13, fontWeight: 700 }}>
              <i data-lucide="shield-check" style={{ width: 15, height: 15 }}></i>
              관리자 콘솔
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "18px 0 6px", color: "var(--ph-text)" }}>PromptHub Admin 로그인</h1>
            <p style={{ fontSize: 15, color: "var(--ph-text-secondary)", margin: "0 0 26px", lineHeight: 1.5 }}>운영팀 전용 페이지예요. 관리자 계정으로 로그인하세요.</p>

            <button onClick={kakaoLogin} disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", height: 52, borderRadius: "var(--ph-radius-md)", border: "none", cursor: loading ? "default" : "pointer", background: "#FEE500", color: "#191600", fontFamily: "var(--ph-font-family)", fontSize: 16, fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
              <i data-lucide="message-circle" style={{ width: 19, height: 19 }}></i> 카카오로 로그인
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--ph-border)" }}></div>
              <span style={{ fontSize: 13, color: "var(--ph-text-muted)" }}>또는 이메일로</span>
              <div style={{ flex: 1, height: 1, background: "var(--ph-border)" }}></div>
            </div>

            <form onSubmit={emailLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Input label="이메일" placeholder="admin@prompthub.kr" value={email}
                onChange={(e) => { setEmail(e.target.value); setErr(""); }}
                leading={<i data-lucide="mail" style={{ width: 17, height: 17 }}></i>} />
              <Input label="비밀번호" type="password" placeholder="••••••••" value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }}
                error={err || undefined}
                leading={<i data-lucide="lock" style={{ width: 17, height: 17 }}></i>} />
              <Button variant="solid" size="lg" fullWidth as="button" type="submit" style={{ marginTop: 4 }}>
                {loading ? "로그인 중…" : "로그인"}
              </Button>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "11px 13px", background: "var(--ph-gray-50)", border: "1px solid var(--ph-border)", borderRadius: "var(--ph-radius-md)", fontSize: 12.5, color: "var(--ph-text-muted)", lineHeight: 1.5 }}>
              <i data-lucide="info" style={{ width: 14, height: 14, flexShrink: 0 }}></i>
              <span>데모: 아무 이메일·비밀번호나 입력하거나 카카오 버튼을 누르면 관리자 콘솔로 들어갑니다.</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 22, fontSize: 13.5, color: "var(--ph-text-muted)" }}>
              <i data-lucide="lock-keyhole" style={{ width: 14, height: 14 }}></i>
              운영팀 외 접근이 제한된 페이지입니다.
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.AdminLogin = Login;

  // In combined single-file mode the orchestrator mounts everything itself.
  if (!window.__PH_COMBINED) {
    // already authed → skip straight to the dashboard
    try {
      if (sessionStorage.getItem("ph_admin_auth") === "1") window.location.replace("PromptHub 관리자 대시보드.html");
    } catch (e) {}

    ReactDOM.createRoot(document.getElementById("root")).render(<Login />);
  }
})();
