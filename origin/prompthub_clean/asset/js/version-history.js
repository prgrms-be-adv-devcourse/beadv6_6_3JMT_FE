/* PromptHub — prompt version-history helpers.
 * Each prompt carries a seeded changelog (newest first). Sellers add new
 * versions by saving edits; buyers see whether they own the latest version. */
(() => {
  // Deterministic base changelog for every prompt. Sellers prepend newer
  // versions on save (stored in App's versionsMap state).
  const SEED = [
    { ver: "1.2", date: "2026.06.15", note: "프롬프트 지시문 개선, 예시 3개 추가" },
    { ver: "1.1", date: "2026.03.28", note: "출력 형식 정리, 불필요한 문장 제거" },
    { ver: "1.0", date: "2026.01.12", note: "최초 등록" },
  ];

  // newest-first list = seller-added versions (extra) + seed
  function combine(extra) {
    return [...(extra || []), ...SEED];
  }

  function nextVer(latest) {
    const parts = String(latest || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
    parts[parts.length - 1] += 1;
    return parts.join(".");
  }

  function todayStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
  }

  window.PH_VERSIONS = { SEED, combine, nextVer, todayStr };
})();
