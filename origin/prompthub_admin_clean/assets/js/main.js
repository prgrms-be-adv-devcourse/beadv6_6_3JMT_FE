/* PromptHub 관리자 — combined single-file orchestrator.
 * Renders the login screen first, then the dashboard once authenticated,
 * all in-memory (no page navigation). Used by the combined HTML export. */
(() => {
  function CombinedApp() {
    const [email, setEmail] = React.useState(null); // null = logged out

    if (!email) {
      return <window.AdminLogin onLogin={(e) => setEmail(e)} />;
    }
    return <window.AdminApp email={email} onLogout={() => setEmail(null)} />;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<CombinedApp />);
})();
