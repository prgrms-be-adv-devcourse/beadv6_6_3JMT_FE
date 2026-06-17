/* @ds-bundle: {"format":3,"namespace":"PromptHubDesignSystem_19db23","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"9b2e262c451a","components/core/Badge.jsx":"3ea7eaf1ea6a","components/core/Button.jsx":"a3ce93219084","components/core/Card.jsx":"6bd50a4caa3f","components/core/Input.jsx":"5f1094df2cad","components/core/Tag.jsx":"0e60a854a8a8","ui_kits/marketplace/BrowseScreen.jsx":"f317759099e5","ui_kits/marketplace/Chrome.jsx":"a11bea9d2fa7","ui_kits/marketplace/DetailScreen.jsx":"0cb58abdd9e2","ui_kits/marketplace/HomeScreen.jsx":"c1c8a2e39294","ui_kits/marketplace/PromptCard.jsx":"1d4baad13bcb","ui_kits/marketplace/SellScreen.jsx":"b59e67fff76e","ui_kits/marketplace/data.js":"39989c988c49"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PromptHubDesignSystem_19db23 = window.PromptHubDesignSystem_19db23 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Avatar — circular user/seller image with initials fallback.
 */
function Avatar({
  src,
  name = "",
  size = 40,
  style,
  ...props
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: "var(--ph-radius-full)",
      overflow: "hidden",
      backgroundColor: "var(--ph-secondary)",
      color: "var(--ph-primary)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--ph-font-family)",
      fontWeight: 700,
      fontSize: Math.round(size * 0.4),
      flexShrink: 0,
      ...style
    }
  }, props), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials || "?");
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Badge — small status/category pill. Tones map to the restrained
 * palette: blue (brand), neutral (gray), error (red). Filled or soft.
 */
function Badge({
  tone = "blue",
  soft = true,
  children,
  style,
  ...props
}) {
  const palettes = {
    blue: soft ? {
      bg: "var(--ph-secondary)",
      fg: "var(--ph-primary)"
    } : {
      bg: "var(--ph-primary)",
      fg: "var(--ph-on-accent)"
    },
    neutral: soft ? {
      bg: "var(--ph-gray-100)",
      fg: "var(--ph-gray-600)"
    } : {
      bg: "var(--ph-black)",
      fg: "var(--ph-white)"
    },
    error: soft ? {
      bg: "#fdeceb",
      fg: "var(--ph-error)"
    } : {
      bg: "var(--ph-error)",
      fg: "var(--ph-white)"
    }
  };
  const p = palettes[tone] || palettes.blue;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      backgroundColor: p.bg,
      color: p.fg,
      fontFamily: "var(--ph-font-family)",
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1,
      padding: "5px 9px",
      borderRadius: "var(--ph-radius-full)",
      letterSpacing: "0px",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Button — primary (pale-blue fill, blue text), secondary
 * (black outline), and link (underlined) variants. No shadows; flat fills.
 */
function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  as = "button",
  children,
  style,
  ...props
}) {
  const base = {
    fontFamily: "var(--ph-font-family)",
    fontWeight: 600,
    letterSpacing: "0px",
    border: "1px solid transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textDecoration: "none",
    boxShadow: "none",
    width: fullWidth ? "100%" : undefined,
    transition: "background-color .15s ease, color .15s ease, opacity .15s ease",
    opacity: disabled ? 0.4 : 1,
    boxSizing: "border-box"
  };
  const sizes = {
    sm: {
      fontSize: "14px",
      padding: "7px 12px",
      minHeight: "34px",
      minWidth: "64px"
    },
    md: {
      fontSize: "15px",
      padding: "11px 16px",
      minHeight: "40px",
      minWidth: "84px"
    },
    lg: {
      fontSize: "17px",
      padding: "15px 24px",
      minHeight: "52px",
      minWidth: "120px"
    }
  };
  const variants = {
    primary: {
      backgroundColor: "var(--ph-secondary)",
      color: "var(--ph-primary)",
      borderColor: "transparent",
      borderRadius: "var(--ph-radius-md)"
    },
    secondary: {
      backgroundColor: "transparent",
      color: "var(--ph-text)",
      borderColor: "var(--ph-text)",
      borderRadius: "var(--ph-radius-sm)"
    },
    solid: {
      backgroundColor: "var(--ph-primary)",
      color: "var(--ph-on-accent)",
      borderColor: "transparent",
      borderRadius: "var(--ph-radius-md)"
    },
    link: {
      backgroundColor: "transparent",
      color: "var(--ph-text)",
      borderColor: "transparent",
      borderRadius: "var(--ph-radius-none)",
      textDecoration: "underline",
      padding: "0px",
      minHeight: "0px",
      minWidth: "0px",
      fontWeight: 400
    }
  };
  const v = variants[variant] || variants.primary;
  const sz = variant === "link" ? {} : sizes[size] || sizes.md;
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === "button" ? disabled : undefined,
    style: {
      ...base,
      ...sz,
      ...v,
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Card — quiet structural container. White surface, 1px light-gray
 * border, 8px radius, no shadow. Optional `interactive` adds a subtle
 * border-darken + lift-free hover for clickable tiles.
 */
function Card({
  interactive = false,
  padding = "16px",
  children,
  style,
  ...props
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      backgroundColor: "var(--ph-surface)",
      color: "var(--ph-on-surface)",
      border: `1px solid ${hover ? "var(--ph-gray-400)" : "var(--ph-border)"}`,
      borderRadius: "var(--ph-radius-lg)",
      padding,
      boxShadow: "none",
      boxSizing: "border-box",
      cursor: interactive ? "pointer" : "default",
      transition: "border-color .15s ease",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Input — clean text field. Faint border by default, blue border on
 * focus, no shadow. Supports an optional leading icon and label.
 */
function Input({
  label,
  leading,
  error,
  fullWidth = true,
  style,
  id,
  ...props
}) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId();
  const inputId = id || reactId;
  const borderColor = error ? "var(--ph-error)" : focus ? "var(--ph-primary)" : "var(--ph-border)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: fullWidth ? "100%" : undefined
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: "block",
      fontFamily: "var(--ph-font-family)",
      fontSize: "14px",
      fontWeight: 600,
      color: "var(--ph-text)",
      marginBottom: "8px"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      border: `1px solid ${borderColor}`,
      borderRadius: "var(--ph-radius-md)",
      padding: "0 14px",
      backgroundColor: "var(--ph-surface)",
      transition: "border-color .15s ease"
    }
  }, leading && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      color: "var(--ph-text-muted)"
    }
  }, leading), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      props.onFocus && props.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      props.onBlur && props.onBlur(e);
    },
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--ph-font-family)",
      fontSize: "15px",
      color: "var(--ph-text)",
      padding: "11px 0",
      minWidth: 0,
      ...style
    }
  }, props))), error && /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--ph-font-family)",
      fontSize: "13px",
      color: "var(--ph-error)",
      margin: "6px 0 0"
    }
  }, error));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PromptHub Tag — low-key filterable chip used for prompt categories/models.
 * Selectable variant toggles to a pale-blue selected state.
 */
function Tag({
  selected = false,
  children,
  style,
  ...props
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    style: {
      fontFamily: "var(--ph-font-family)",
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1,
      padding: "9px 14px",
      borderRadius: "var(--ph-radius-full)",
      cursor: "pointer",
      transition: "background-color .15s ease, border-color .15s ease, color .15s ease",
      backgroundColor: selected ? "var(--ph-secondary)" : "var(--ph-white)",
      color: selected ? "var(--ph-primary)" : "var(--ph-text-secondary)",
      border: `1px solid ${selected ? "transparent" : "var(--ph-border)"}`,
      boxShadow: "none",
      ...style
    }
  }, props), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/BrowseScreen.jsx
try { (() => {
// PromptHub — Browse / marketplace listing with filter chips.
const {
  Tag: BrowseTag,
  Button: BrowseButton
} = window.PromptHubDesignSystem_19db23;
function BrowseScreen({
  openPrompt,
  query
}) {
  const {
    prompts,
    categories
  } = window.PH_DATA;
  const [cat, setCat] = React.useState("all");
  const [sort, setSort] = React.useState("인기순");
  let list = cat === "all" ? prompts : prompts.filter(p => p.cat === cat);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(p => p.title.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q));
  }
  list = [...list].sort((a, b) => sort === "인기순" ? b.sales - a.sales : sort === "평점순" ? b.rating - a.rating : a.price - b.price);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "48px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 33,
      fontWeight: 700,
      margin: "0 0 8px",
      letterSpacing: "-0.01em"
    }
  }, "\uD504\uB86C\uD504\uD2B8 \uD0D0\uC0C9"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ph-text-secondary)",
      fontSize: 16,
      margin: "0 0 28px"
    }
  }, query ? /*#__PURE__*/React.createElement(React.Fragment, null, "\u2018", query, "\u2019 \uAC80\uC0C9 \uACB0\uACFC \xB7 ") : null, list.length, "\uAC1C\uC758 \uD504\uB86C\uD504\uD2B8"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24
    }
  }, categories.map(c => /*#__PURE__*/React.createElement(BrowseTag, {
    key: c.id,
    selected: cat === c.id,
    onClick: () => setCat(c.id)
  }, c.label))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 24
    }
  }, ["인기순", "평점순", "가격순"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSort(s),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--ph-font-family)",
      fontSize: 14,
      fontWeight: sort === s ? 700 : 500,
      color: sort === s ? "var(--ph-text)" : "var(--ph-text-muted)",
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, sort === s && /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check",
    style: {
      width: 15,
      height: 15
    }
  }), s))), list.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "80px 0",
      textAlign: "center",
      color: "var(--ph-text-muted)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search-x",
    style: {
      width: 40,
      height: 40
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12
    }
  }, "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20
    }
  }, list.map(p => /*#__PURE__*/React.createElement(window.PromptCard, {
    key: p.id,
    p: p,
    onOpen: openPrompt
  }))));
}
window.BrowseScreen = BrowseScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/BrowseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/Chrome.jsx
try { (() => {
// PromptHub marketplace — top navigation (thin, low-contrast) + footer.
const {
  Button: PHButton,
  Input: PHInput,
  Avatar: PHAvatar
} = window.PromptHubDesignSystem_19db23;
function Logo({
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 8,
      background: "var(--ph-primary)",
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "sparkles",
    style: {
      width: 17,
      height: 17
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: "var(--ph-text)"
    }
  }, "Prompt", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ph-primary)"
    }
  }, "Hub")));
}
function Header({
  go,
  current,
  query,
  setQuery
}) {
  const navItems = [{
    id: "browse",
    label: "탐색"
  }, {
    id: "sell",
    label: "판매하기"
  }];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--ph-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      height: 64,
      padding: "0 32px",
      display: "flex",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    onClick: () => go("home")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 380
    }
  }, /*#__PURE__*/React.createElement(PHInput, {
    placeholder: "\uD504\uB86C\uD504\uD2B8, \uD06C\uB9AC\uC5D0\uC774\uD130 \uAC80\uC0C9",
    value: query,
    onChange: e => setQuery(e.target.value),
    onFocus: () => go("browse"),
    leading: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "search",
      style: {
        width: 18,
        height: 18
      }
    })
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginLeft: "auto"
    }
  }, navItems.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    onClick: () => go(n.id),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--ph-font-family)",
      fontSize: 15,
      fontWeight: current === n.id ? 700 : 500,
      color: current === n.id ? "var(--ph-text)" : "var(--ph-text-secondary)",
      padding: "8px 12px"
    }
  }, n.label)), /*#__PURE__*/React.createElement(PHButton, {
    variant: "solid",
    size: "sm",
    onClick: () => go("browse")
  }, "\uC2DC\uC791\uD558\uAE30"), /*#__PURE__*/React.createElement(PHAvatar, {
    name: "\uAE40\uD1A0\uC2A4",
    size: 34,
    style: {
      marginLeft: 6,
      cursor: "pointer"
    }
  }))));
}
function Footer() {
  const cols = [{
    h: "PromptHub",
    links: ["소개", "채용", "블로그", "고객센터"]
  }, {
    h: "마켓플레이스",
    links: ["인기 프롬프트", "신규 등록", "카테고리", "크리에이터"]
  }, {
    h: "판매자",
    links: ["판매 시작하기", "수익 정산", "가이드라인", "FAQ"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--ph-border)",
      background: "var(--ph-gray-50)",
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "56px 32px",
      display: "flex",
      gap: 64,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    onClick: () => {}
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ph-text-muted)",
      fontSize: 14,
      lineHeight: 1.6,
      marginTop: 16,
      maxWidth: 240
    }
  }, "\uAC80\uC99D\uB41C AI \uD504\uB86C\uD504\uD2B8\uB97C \uC0AC\uACE0\uD30C\uB294 \uAC00\uC7A5 \uC26C\uC6B4 \uBC29\uBC95.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 16
    }
  }, c.h), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, c.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: "var(--ph-text-secondary)",
      textDecoration: "none",
      fontSize: 14
    }
  }, l))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--ph-border)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "20px 32px",
      color: "var(--ph-text-muted)",
      fontSize: 13
    }
  }, "\xA9 2026 PromptHub. All rights reserved.")));
}
Object.assign(window, {
  Header,
  Footer,
  Logo
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/DetailScreen.jsx
try { (() => {
// PromptHub — Prompt detail / purchase page.
const {
  Button: DetailButton,
  Badge: DetailBadge,
  Card: DetailCard,
  Avatar: DetailAvatar
} = window.PromptHubDesignSystem_19db23;
function DetailScreen({
  p,
  go,
  openPrompt
}) {
  if (!p) return null;
  const {
    prompts
  } = window.PH_DATA;
  const related = prompts.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 4);
  const [bought, setBought] = React.useState(false);
  const features = ["결제 즉시 다운로드", "상업적 이용 가능", "무료 업데이트 제공"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "32px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go("browse"),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--ph-text-secondary)",
      fontFamily: "var(--ph-font-family)",
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 24,
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-left",
    style: {
      width: 16,
      height: 16
    }
  }), " \uD0D0\uC0C9\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      gap: 48,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 360,
      borderRadius: 16,
      background: "var(--ph-secondary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--ph-border)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": p.icon,
    style: {
      width: 88,
      height: 88,
      color: "var(--ph-primary)",
      opacity: 0.85
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(DetailBadge, {
    tone: "neutral"
  }, p.model), p.badge && /*#__PURE__*/React.createElement(DetailBadge, {
    tone: "blue",
    soft: false
  }, p.badge)), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 33,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      margin: "16px 0 0",
      textWrap: "pretty"
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "20px 0 32px",
      color: "var(--ph-text-secondary)",
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "star",
    style: {
      width: 16,
      height: 16,
      fill: "var(--ph-primary)",
      color: "var(--ph-primary)"
    }
  }), /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--ph-text)"
    }
  }, p.rating)), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.sales.toLocaleString(), "\uD68C \uD310\uB9E4")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      margin: "0 0 12px"
    }
  }, "\uD504\uB86C\uD504\uD2B8 \uC18C\uAC1C"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.7,
      color: "var(--ph-text-secondary)",
      margin: 0,
      maxWidth: 620
    }
  }, p.desc), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 20,
      fontWeight: 700,
      margin: "40px 0 16px"
    }
  }, "\uD310\uB9E4\uC790"), /*#__PURE__*/React.createElement(DetailCard, {
    padding: "20px",
    style: {
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(DetailAvatar, {
    name: p.seller,
    size: 48
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 16
    }
  }, p.seller), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--ph-text-muted)",
      fontSize: 14
    }
  }, "\uAC80\uC99D\uB41C \uD06C\uB9AC\uC5D0\uC774\uD130 \xB7 \uD504\uB86C\uD504\uD2B8 24\uAC1C")))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 88
    }
  }, /*#__PURE__*/React.createElement(DetailCard, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 700
    }
  }, window.won(p.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--ph-text-muted)",
      fontSize: 14,
      marginTop: 4
    }
  }, "1\uD68C \uACB0\uC81C \xB7 \uC601\uAD6C \uC774\uC6A9"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(DetailButton, {
    variant: "solid",
    size: "lg",
    fullWidth: true,
    onClick: () => setBought(true)
  }, bought ? "구매 완료 ✓" : "프롬프트 구매하기"), /*#__PURE__*/React.createElement(DetailButton, {
    variant: "secondary",
    size: "lg",
    fullWidth: true
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "bookmark",
    style: {
      width: 17,
      height: 17
    }
  }), " \uC704\uC2DC\uB9AC\uC2A4\uD2B8")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 14,
      color: "var(--ph-text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check-circle-2",
    style: {
      width: 17,
      height: 17,
      color: "var(--ph-primary)"
    }
  }), f)))))), related.length > 0 && /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 72
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 27,
      fontWeight: 700,
      margin: "0 0 24px"
    }
  }, "\uBE44\uC2B7\uD55C \uD504\uB86C\uD504\uD2B8"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20
    }
  }, related.map(r => /*#__PURE__*/React.createElement(window.PromptCard, {
    key: r.id,
    p: r,
    onOpen: openPrompt
  })))));
}
window.DetailScreen = DetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/DetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/HomeScreen.jsx
try { (() => {
// PromptHub — Home (airy hero + featured grid, toss.im style).
const {
  Button: HomeButton
} = window.PromptHubDesignSystem_19db23;
function HomeScreen({
  go,
  openPrompt
}) {
  const {
    prompts,
    categories
  } = window.PH_DATA;
  const featured = prompts.slice(0, 8);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      background: "linear-gradient(180deg, #ffffff 0%, #f3f7fd 40%, #e4eefb 100%)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "90px 32px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 14px",
      background: "var(--ph-secondary)",
      color: "var(--ph-primary)",
      borderRadius: 9999,
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "sparkles",
    style: {
      width: 15,
      height: 15
    }
  }), "12,000\uAC1C \uC774\uC0C1\uC758 \uAC80\uC99D\uB41C \uD504\uB86C\uD504\uD2B8"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 56,
      lineHeight: 1.18,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      margin: "0 auto",
      maxWidth: 760,
      textWrap: "balance"
    }
  }, "\uB354 \uC88B\uC740 \uACB0\uACFC\uB97C \uB9CC\uB4DC\uB294", /*#__PURE__*/React.createElement("br", null), "AI \uD504\uB86C\uD504\uD2B8, \uC5EC\uAE30 \uB2E4 \uC788\uC5B4\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 19,
      lineHeight: 1.6,
      color: "var(--ph-text-secondary)",
      maxWidth: 540,
      margin: "24px auto 0"
    }
  }, "\uD06C\uB9AC\uC5D0\uC774\uD130\uAC00 \uAC80\uC99D\uD55C \uD504\uB86C\uD504\uD2B8\uB97C \uAD6C\uB9E4\uD558\uACE0, \uB0B4 \uD504\uB86C\uD504\uD2B8\uB85C \uC218\uC775\uB3C4 \uB9CC\uB4E4\uC5B4 \uBCF4\uC138\uC694."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      justifyContent: "center",
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(HomeButton, {
    variant: "solid",
    size: "lg",
    onClick: () => go("browse")
  }, "\uD504\uB86C\uD504\uD2B8 \uB458\uB7EC\uBCF4\uAE30"), /*#__PURE__*/React.createElement(HomeButton, {
    variant: "secondary",
    size: "lg",
    onClick: () => go("sell")
  }, "\uD310\uB9E4 \uC2DC\uC791\uD558\uAE30"))), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/hero-objects.svg",
    alt: "\uD504\uB86C\uD504\uD2B8 \uC624\uBE0C\uC81D\uD2B8 \uC0AC\uC774\uC758 \uB9C8\uC2A4\uCF54\uD2B8 \uD504\uB86C\uC774",
    style: {
      display: "block",
      width: "100%",
      maxWidth: 1680,
      margin: "12px auto 0",
      padding: "0 16px",
      boxSizing: "border-box"
    }
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 14
    }
  }, categories.filter(c => c.id !== "all").map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => go("browse"),
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      padding: "24px 12px",
      background: "var(--ph-gray-50)",
      border: "1px solid var(--ph-border)",
      borderRadius: 16,
      cursor: "pointer",
      fontFamily: "var(--ph-font-family)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": c.icon,
    style: {
      width: 26,
      height: 26,
      color: "var(--ph-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--ph-text)"
    }
  }, c.label))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "80px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 33,
      fontWeight: 700,
      margin: 0,
      letterSpacing: "-0.01em"
    }
  }, "\uC774\uBC88 \uC8FC \uC778\uAE30 \uD504\uB86C\uD504\uD2B8"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ph-text-secondary)",
      fontSize: 16,
      margin: "8px 0 0"
    }
  }, "\uAC00\uC7A5 \uB9CE\uC774 \uD314\uB9B0 \uD504\uB86C\uD504\uD2B8\uB97C \uB9CC\uB098\uBCF4\uC138\uC694")), /*#__PURE__*/React.createElement(HomeButton, {
    variant: "link",
    onClick: () => go("browse")
  }, "\uC804\uCCB4 \uBCF4\uAE30 \u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 20
    }
  }, featured.map(p => /*#__PURE__*/React.createElement(window.PromptCard, {
    key: p.id,
    p: p,
    onOpen: openPrompt
  })))));
}
window.HomeScreen = HomeScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/PromptCard.jsx
try { (() => {
// PromptHub — prompt thumbnail tile, used in grids across screens.
const {
  Card: PHCard,
  Badge: PHBadge
} = window.PromptHubDesignSystem_19db23;
function won(n) {
  return "₩" + n.toLocaleString("ko-KR");
}
function PromptThumb({
  icon
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 150,
      borderRadius: 8,
      background: "var(--ph-secondary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--ph-border)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": icon || "sparkles",
    style: {
      width: 40,
      height: 40,
      color: "var(--ph-primary)",
      opacity: 0.85
    }
  }));
}
function PromptCard({
  p,
  onOpen
}) {
  return /*#__PURE__*/React.createElement(PHCard, {
    interactive: true,
    padding: "14px",
    onClick: () => onOpen && onOpen(p),
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(PromptThumb, {
    icon: p.icon
  }), p.badge && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 10,
      left: 10
    }
  }, /*#__PURE__*/React.createElement(PHBadge, {
    tone: "blue",
    soft: false
  }, p.badge))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(PHBadge, {
    tone: "neutral"
  }, p.model)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      lineHeight: 1.35,
      color: "var(--ph-text)",
      textWrap: "pretty"
    }
  }, p.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "var(--ph-text-muted)",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "star",
    style: {
      width: 14,
      height: 14,
      fill: "var(--ph-primary)",
      color: "var(--ph-primary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ph-text)",
      fontWeight: 600
    }
  }, p.rating), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, p.seller)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      fontWeight: 700
    }
  }, won(p.price)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--ph-text-muted)"
    }
  }, p.sales.toLocaleString(), "\uD68C \uD310\uB9E4")));
}
Object.assign(window, {
  PromptCard,
  PromptThumb,
  won
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/PromptCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/SellScreen.jsx
try { (() => {
// PromptHub — Sell / list-a-prompt form screen.
const {
  Button: SellButton,
  Input: SellInput,
  Card: SellCard,
  Tag: SellTag
} = window.PromptHubDesignSystem_19db23;
function SellScreen({
  go
}) {
  const {
    categories
  } = window.PH_DATA;
  const [cat, setCat] = React.useState("writing");
  const [submitted, setSubmitted] = React.useState(false);
  const Label = ({
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "var(--ph-text)",
      marginBottom: 8
    }
  }, children);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720,
      margin: "0 auto",
      padding: "56px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 14px",
      background: "var(--ph-secondary)",
      color: "var(--ph-primary)",
      borderRadius: 9999,
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "store",
    style: {
      width: 15,
      height: 15
    }
  }), " \uD310\uB9E4\uC790 \uB4F1\uB85D"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 40,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      margin: "0 0 12px",
      lineHeight: 1.2
    }
  }, "\uD504\uB86C\uD504\uD2B8\uB97C \uB4F1\uB85D\uD558\uACE0", /*#__PURE__*/React.createElement("br", null), "\uC218\uC775\uC744 \uB9CC\uB4E4\uC5B4 \uBCF4\uC138\uC694"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      color: "var(--ph-text-secondary)",
      margin: "0 0 40px",
      lineHeight: 1.6
    }
  }, "\uD310\uB9E4 \uC218\uC218\uB8CC\uB294 \uB2E8 15%. \uB098\uBA38\uC9C0\uB294 \uBAA8\uB450 \uD06C\uB9AC\uC5D0\uC774\uD130\uC758 \uBAAB\uC785\uB2C8\uB2E4."), /*#__PURE__*/React.createElement(SellCard, {
    padding: "32px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "\uD504\uB86C\uD504\uD2B8 \uC81C\uBAA9"), /*#__PURE__*/React.createElement(SellInput, {
    placeholder: "\uC608: \uC804\uD658\uC728 \uB192\uC774\uB294 \uB79C\uB529 \uCE74\uD53C \uC791\uC131"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "\uCE74\uD14C\uACE0\uB9AC"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, categories.filter(c => c.id !== "all").map(c => /*#__PURE__*/React.createElement(SellTag, {
    key: c.id,
    selected: cat === c.id,
    onClick: () => setCat(c.id)
  }, c.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "\uB300\uC0C1 \uBAA8\uB378"), /*#__PURE__*/React.createElement(SellInput, {
    placeholder: "\uC608: GPT-4o"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "\uAC00\uACA9 (\uC6D0)"), /*#__PURE__*/React.createElement(SellInput, {
    placeholder: "4900",
    inputMode: "numeric",
    leading: /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, "\u20A9")
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Label, null, "\uD504\uB86C\uD504\uD2B8 \uC124\uBA85"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "\uC774 \uD504\uB86C\uD504\uD2B8\uAC00 \uC5B4\uB5A4 \uACB0\uACFC\uB97C \uB9CC\uB4E4\uC5B4 \uC8FC\uB294\uC9C0 \uC124\uBA85\uD574 \uC8FC\uC138\uC694.",
    rows: 4,
    style: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid var(--ph-border)",
      borderRadius: "var(--ph-radius-md)",
      padding: "12px 14px",
      fontFamily: "var(--ph-font-family)",
      fontSize: 15,
      resize: "vertical",
      outline: "none",
      color: "var(--ph-text)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      justifyContent: "flex-end",
      alignItems: "center"
    }
  }, submitted && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ph-primary)",
      fontWeight: 600,
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check-circle-2",
    style: {
      width: 16,
      height: 16
    }
  }), " \uAC80\uD1A0 \uC694\uCCAD\uC774 \uC811\uC218\uB410\uC5B4\uC694"), /*#__PURE__*/React.createElement(SellButton, {
    variant: "secondary",
    onClick: () => go("home")
  }, "\uCDE8\uC18C"), /*#__PURE__*/React.createElement(SellButton, {
    variant: "solid",
    onClick: () => setSubmitted(true)
  }, "\uB4F1\uB85D \uAC80\uD1A0 \uC694\uCCAD")))));
}
window.SellScreen = SellScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/SellScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketplace/data.js
try { (() => {
// Shared mock data for the PromptHub marketplace UI kit.
window.PH_DATA = {
  categories: [{
    id: "all",
    label: "전체"
  }, {
    id: "image",
    label: "이미지 생성",
    icon: "image"
  }, {
    id: "writing",
    label: "글쓰기",
    icon: "pen-line"
  }, {
    id: "coding",
    label: "코딩",
    icon: "code-xml"
  }, {
    id: "marketing",
    label: "마케팅",
    icon: "megaphone"
  }, {
    id: "chatbot",
    label: "챗봇",
    icon: "message-circle"
  }, {
    id: "data",
    label: "데이터 분석",
    icon: "bar-chart-3"
  }],
  prompts: [{
    id: 1,
    title: "사진 같은 제품 목업 생성기",
    cat: "image",
    icon: "image",
    model: "Midjourney v6",
    price: 5900,
    rating: 4.9,
    sales: 1240,
    seller: "비주얼랩",
    badge: "신규",
    desc: "제품 사진을 스튜디오 품질의 광고 컷으로 바꿔주는 미드저니 프롬프트. 조명·각도·배경을 한 번에 지정합니다."
  }, {
    id: 2,
    title: "전환율 높이는 랜딩 카피 작성",
    cat: "writing",
    icon: "pen-line",
    model: "GPT-4o",
    price: 4900,
    rating: 4.8,
    sales: 980,
    seller: "카피킷",
    badge: "베스트",
    desc: "후킹 헤드라인부터 CTA까지, 검증된 프레임워크로 랜딩 페이지 카피를 단계별로 만들어 줍니다."
  }, {
    id: 3,
    title: "리액트 컴포넌트 리팩터링 도우미",
    cat: "coding",
    icon: "code-xml",
    model: "Claude 3.5",
    price: 7900,
    rating: 5.0,
    sales: 612,
    seller: "데브플로우",
    desc: "지저분한 컴포넌트를 깔끔한 훅 기반 구조로 리팩터링하고, 테스트 코드까지 제안합니다."
  }, {
    id: 4,
    title: "30일 SNS 콘텐츠 캘린더",
    cat: "marketing",
    icon: "megaphone",
    model: "GPT-4o",
    price: 3900,
    rating: 4.7,
    sales: 2310,
    seller: "그로스하우스",
    badge: "베스트",
    desc: "브랜드 톤만 입력하면 한 달치 인스타·스레드 게시물 아이디어와 카피를 자동 생성합니다."
  }, {
    id: 5,
    title: "친절한 CS 챗봇 페르소나",
    cat: "chatbot",
    icon: "message-circle",
    model: "Claude 3.5",
    price: 6900,
    rating: 4.9,
    sales: 540,
    seller: "토크봇",
    desc: "고객 문의를 따뜻하고 정확하게 응대하는 상담 챗봇 시스템 프롬프트. 에스컬레이션 규칙 포함."
  }, {
    id: 6,
    title: "엑셀 데이터 인사이트 요약",
    cat: "data",
    icon: "bar-chart-3",
    model: "GPT-4o",
    price: 5500,
    rating: 4.6,
    sales: 430,
    seller: "데이터핀",
    desc: "표 데이터를 붙여넣으면 핵심 추세·이상치·다음 액션을 보고서 형태로 정리해 줍니다."
  }, {
    id: 7,
    title: "감성 일러스트 캐릭터 시트",
    cat: "image",
    icon: "image",
    model: "Midjourney v6",
    price: 4500,
    rating: 4.8,
    sales: 870,
    seller: "비주얼랩",
    desc: "일관된 캐릭터를 여러 포즈·표정으로 생성하는 캐릭터 시트 프롬프트."
  }, {
    id: 8,
    title: "유튜브 스크립트 후킹 오프닝",
    cat: "writing",
    icon: "pen-line",
    model: "GPT-4o",
    price: 3500,
    rating: 4.7,
    sales: 1520,
    seller: "카피킷",
    badge: "신규",
    desc: "첫 15초에 이탈을 막는 강력한 오프닝 훅을 주제별로 생성합니다."
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketplace/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Tag = __ds_scope.Tag;

})();
