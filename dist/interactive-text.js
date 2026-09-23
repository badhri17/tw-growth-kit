import { LitElement as Q, css as Z, html as o, nothing as m } from "lit";
import { property as tt, state as E } from "lit/decorators.js";
function et(l, t) {
  if (typeof l == "string") return l;
  if (!l || typeof l != "object") return "";
  const n = l[t] || l.ar || l.en || "";
  return typeof n == "string" ? n.trim() : "";
}
function it() {
  return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
}
function j(l) {
  return l.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class nt extends Q {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const n = String(t || "").trim(), i = n.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), e = i.includes("-") ? i : `salla-${i || "component"}`, a = () => `${e}-${Math.random().toString(36).substring(2, 8)}`, r = () => {
      var p;
      const d = (p = window.Salla) == null ? void 0 : p.bundles;
      return d && typeof d.registerComponent == "function" ? (d.registerComponent(n, {
        component: this,
        dynamicTagName: a()
      }), !0) : !1;
    };
    if (r()) return;
    const s = window.setInterval(() => {
      r() && window.clearInterval(s);
    }, 100);
    window.setTimeout(() => window.clearInterval(s), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return it();
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return et(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, n) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if (i && typeof i.value == "string" && i.value)
        return i.value;
    }
    return n;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return j(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, n) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const i = Number(j(t.trim()));
      if (!Number.isNaN(i)) return i;
    }
    if (Array.isArray(t) && t.length > 0) {
      const i = t[0];
      if ((i == null ? void 0 : i.value) !== void 0) return this._num(i.value, n);
    }
    return n;
  }
}
const I = {
  none: 0,
  xs: 12,
  sm: 24,
  md: 40,
  lg: 56,
  xl: 72
}, L = {
  none: 0,
  xs: 20,
  sm: 32,
  md: 64,
  lg: 96,
  xl: 128
};
function at(l, t, n = "md", i = "md") {
  const e = t(l == null ? void 0 : l.space_top, n), a = t(l == null ? void 0 : l.space_bottom, i), r = I[e] ?? I.md, s = I[a] ?? I.md, d = L[e] ?? L.md, p = L[a] ?? L.md;
  return [
    `--sp-top-m:${r}px`,
    `--sp-bot-m:${s}px`,
    `--sp-top-d:${d}px`,
    `--sp-bot-d:${p}px`
  ];
}
const rt = Z`
  :host {
    display: block;
    /* Containment so long unbreakable content can never push sibling
       Salla sections off-screen. */
    container-type: inline-size;
  }

  * {
    box-sizing: border-box;
  }

  .it {
    position: relative;
    overflow: hidden;
    /* Vertical space is the merchant's, via shared tiers; the horizontal
       padding stays the section's own. See src/shared/section-spacing.ts. */
    padding-block: var(--sp-top-m) var(--sp-bot-m);
    padding-inline: 1.25rem;
    font-family: inherit;

    --it-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --it-accent: #d94215;
    --it-accent-2: #f97316;
    --it-accent-soft: rgba(124, 58, 237, 0.22);
  }

  /* ------------------------------------------------------------
     Theme palettes (inline host style overrides win over these)
     ------------------------------------------------------------ */
  .it[data-theme="light"] {
    --it-title-c: #10131a;
    --it-subtitle-c: #3d4452;
    --it-text-c: #5a6172;
    --it-bg-base: #ffffff;
    --it-grad-1: #f6f4ff;
    --it-grad-2: #fdf2f8;
  }
  .it[data-theme="dark"] {
    --it-title-c: #f8fafc;
    --it-subtitle-c: #d4dae4;
    --it-text-c: #a8b1c0;
    --it-bg-base: #0b0f19;
    --it-grad-1: #131a2b;
    --it-grad-2: #1d1430;
  }

  .it[data-bg="solid"] {
    background: var(--it-bg, var(--it-bg-base));
  }
  .it[data-bg="gradient"] {
    background: linear-gradient(160deg, var(--it-grad-1), var(--it-grad-2));
  }

  /* ------------------------------------------------------------
     Size tiers — mobile base, desktop override keyed on its own attr
     ------------------------------------------------------------ */
  .it {
    --it-fs-eyebrow: 0.8rem;
  }
  .it[data-size="small"] {
    --it-fs-title: 1.6rem;
    --it-fs-subtitle: 1.02rem;
    --it-fs-text: 0.95rem;
  }
  .it[data-size="medium"] {
    --it-fs-title: 2rem;
    --it-fs-subtitle: 1.15rem;
    --it-fs-text: 1rem;
  }
  .it[data-size="large"] {
    --it-fs-title: 2.5rem;
    --it-fs-subtitle: 1.25rem;
    --it-fs-text: 1.08rem;
  }

  /* Line-gap tiers (the section's own vertical space is --sp-*) */
  .it[data-spacing="compact"] {
    --it-gap: 0.85rem;
  }
  .it[data-spacing="normal"] {
    --it-gap: 1.1rem;
  }
  .it[data-spacing="spacious"] {
    --it-gap: 1.35rem;
  }

  /* Content width tiers */
  .it[data-width="narrow"] {
    --it-maxw: 36rem;
  }
  .it[data-width="medium"] {
    --it-maxw: 46rem;
  }
  .it[data-width="wide"] {
    --it-maxw: 62rem;
  }

  @media (min-width: 768px) {
    .it[data-size-desktop="small"] {
      --it-fs-title: 2.3rem;
      --it-fs-subtitle: 1.15rem;
      --it-fs-text: 1rem;
    }
    .it[data-size-desktop="medium"] {
      --it-fs-title: 3rem;
      --it-fs-subtitle: 1.3rem;
      --it-fs-text: 1.125rem;
    }
    .it[data-size-desktop="large"] {
      --it-fs-title: 3.8rem;
      --it-fs-subtitle: 1.45rem;
      --it-fs-text: 1.2rem;
    }
    .it {
      padding-block: var(--sp-top-d) var(--sp-bot-d);
      --it-fs-eyebrow: 0.875rem;
    }
  }

  /* ------------------------------------------------------------
     Layout
     ------------------------------------------------------------ */
  .it-inner {
    max-width: var(--it-maxw);
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: var(--it-gap);
  }
  .it[data-align="start"] .it-inner {
    text-align: start;
    align-items: flex-start;
  }
  .it[data-align="center"] .it-inner {
    text-align: center;
    align-items: center;
  }
  .it[data-align="end"] .it-inner {
    text-align: end;
    align-items: flex-end;
  }

  .it-eyebrow {
    margin: 0;
    font-size: var(--it-fs-eyebrow);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--it-accent);
  }

  .it-title {
    margin: 0;
    font-size: var(--it-fs-title);
    font-weight: 800;
    line-height: 1.35;
    color: var(--it-title-c);
    overflow-wrap: break-word;
  }

  .it-subtitle {
    margin: 0;
    font-size: var(--it-fs-subtitle);
    font-weight: 600;
    line-height: 1.6;
    color: var(--it-subtitle-c);
  }

  .it-paragraph {
    margin: 0;
    font-size: var(--it-fs-text);
    line-height: 1.9;
    color: var(--it-text-c);
    white-space: pre-line;
  }
  /* Word / line splitting renders its own structure — no literal newlines. */
  .it-paragraph[data-split] {
    white-space: normal;
  }

  /* ------------------------------------------------------------
     Highlight treatments
     ------------------------------------------------------------ */
  .it-hl[data-hl="color"] {
    color: var(--it-accent);
  }
  .it-hl[data-hl="gradient"] {
    background-image: linear-gradient(
      var(--it-grad-dir, 90deg),
      var(--it-accent),
      var(--it-accent-2)
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .it-hl[data-hl="marker"],
  .it-hl[data-hl="underline"] {
    background-repeat: no-repeat;
    transition: background-size calc(var(--it-dur, 0.7s) * 1.2) var(--it-ease);
    transition-delay: var(--hd, 0.4s);
  }
  .it-hl[data-hl="marker"] {
    background-image: linear-gradient(
      var(--it-accent-soft),
      var(--it-accent-soft)
    );
    background-size: 100% 45%;
    background-position: var(--it-hl-x, left) 88%;
    padding-inline: 0.08em;
  }
  .it-hl[data-hl="underline"] {
    background-image: linear-gradient(var(--it-accent), var(--it-accent));
    background-size: 100% 0.12em;
    background-position: var(--it-hl-x, left) 100%;
    padding-bottom: 0.1em;
  }
  .it[data-entered="false"] .it-hl[data-hl="marker"] {
    background-size: 0% 45%;
  }
  .it[data-entered="false"] .it-hl[data-hl="underline"] {
    background-size: 0% 0.12em;
  }

  /* ------------------------------------------------------------
     CTA button
     ------------------------------------------------------------ */
  .it-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.35rem;
    padding: 0.8em 2em;
    border-radius: 999px;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 0.25s var(--it-ease),
      opacity 0.25s ease;
  }
  .it-btn[data-style="solid"] {
    background: var(--it-accent);
    color: var(--it-btn-text, #ffffff);
  }
  .it-btn[data-style="outline"] {
    border: 2px solid var(--it-accent);
    color: var(--it-btn-text, var(--it-accent));
    background: transparent;
  }
  .it-btn[data-style="ghost"] {
    padding: 0.4em 0.2em;
    border-radius: 0;
    color: var(--it-btn-text, var(--it-accent));
    background: transparent;
  }
  .it-btn:hover {
    transform: translateY(-2px);
  }
  .it-btn-arrow {
    display: inline-block;
    transition: transform 0.25s var(--it-ease);
  }
  .it[data-dir="ltr"] .it-btn:hover .it-btn-arrow {
    transform: translateX(4px);
  }
  .it[data-dir="rtl"] .it-btn:hover .it-btn-arrow {
    transform: translateX(-4px);
  }

  @media (min-width: 768px) {
    .it-btn {
      font-size: 1rem;
    }
  }

  /* ------------------------------------------------------------
     Entrance animation machinery
     ------------------------------------------------------------ */

  /* Block-level units (every direct content element is an .it-block). */
  .it-block {
    transition:
      opacity var(--it-dur, 0.7s) ease,
      transform var(--it-dur, 0.7s) var(--it-ease);
    transition-delay: var(--d, 0s);
  }
  .it[data-entered="false"] .it-block[data-fx="fade"] {
    opacity: 0;
  }
  .it[data-entered="false"] .it-block[data-fx="rise"] {
    opacity: 0;
    transform: translateY(16px);
  }
  .it[data-entered="false"] .it-block[data-fx="slide"] {
    opacity: 0;
    transform: translate(var(--it-fx, 0px), var(--it-fy, 28px));
  }

  /* Word-by-word units. Inline-block per WORD only — never per letter —
     so Arabic letter joining is preserved. */
  .it-w {
    display: inline-block;
    transition:
      opacity var(--it-wdur, 0.55s) ease,
      transform var(--it-wdur, 0.55s) var(--it-ease);
    transition-delay: var(--d, 0s);
  }
  .it[data-entered="false"] .it-w {
    opacity: 0;
    transform: translateY(0.55em);
  }

  /* Curtain reveal: clip wrapper + sliding inner. Generous padding (cancelled
     by negative margin) so Arabic ascenders/diacritics never get clipped. */
  .it-clip {
    display: block;
    overflow: hidden;
    padding: 0.15em 0.1em;
    margin: -0.15em -0.1em;
  }
  .it-reveal,
  .it-line {
    display: block;
    transition: transform var(--it-rdur, 0.9s) var(--it-ease);
    transition-delay: var(--d, 0s);
  }
  .it[data-entered="false"] .it-reveal,
  .it[data-entered="false"] .it-line {
    transform: translateY(130%);
  }

  /* Typewriter caret + post-typing blocks. */
  .it-caret {
    display: inline-block;
    width: 2px;
    height: 1em;
    margin-inline-start: 2px;
    vertical-align: -0.1em;
    background: var(--it-accent);
    animation: it-blink 0.9s steps(1) infinite;
  }
  @keyframes it-blink {
    50% {
      opacity: 0;
    }
  }
  .it[data-typed="false"] .it-post {
    opacity: 0;
    transform: translateY(14px);
  }

  /* ------------------------------------------------------------
     Empty state (admin preview before any content is set)
     ------------------------------------------------------------ */
  .it-empty {
    max-width: var(--it-maxw, 46rem);
    margin-inline: auto;
    padding: 2rem 1.25rem;
    border: 1px dashed currentColor;
    border-radius: 12px;
    opacity: 0.55;
    text-align: center;
    font-size: 0.95rem;
    color: var(--it-text-c, #5a6172);
  }

  /* ------------------------------------------------------------
     Reduced motion: everything appears instantly
     ------------------------------------------------------------ */
  @media (prefers-reduced-motion: reduce) {
    .it-block,
    .it-w,
    .it-reveal,
    .it-line,
    .it-hl,
    .it-post {
      transition: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .it-hl[data-hl="marker"] {
      background-size: 100% 45% !important;
    }
    .it-hl[data-hl="underline"] {
      background-size: 100% 0.12em !important;
    }
    .it-caret {
      animation: none;
    }
  }
`;
var st = Object.defineProperty, V = (l, t, n, i) => {
  for (var e = void 0, a = l.length - 1, r; a >= 0; a--)
    (r = l[a]) && (e = r(t, n, e) || e);
  return e && st(t, n, e), e;
};
const ot = {
  slow: 1.45,
  normal: 1,
  fast: 0.65
}, lt = 80, F = class F extends nt {
  constructor() {
    super(...arguments), this._entered = !1, this._typedCount = 0, this._typingDone = !1, this._io = null, this._typingTimer = null, this._reduced = !1;
  }
  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------
  _isRtl() {
    const t = (document.documentElement.dir || "").toLowerCase();
    return t === "ltr" ? !1 : t === "rtl" ? !0 : this._lang() === "ar";
  }
  /** #rgb / #rrggbb → translucent rgba; anything else falls back to color-mix. */
  _softColor(t, n) {
    const i = t.trim().replace(/^#/, "");
    if (!(/^[0-9a-f]{3}$/i.test(i) || /^[0-9a-f]{6}$/i.test(i)))
      return `color-mix(in srgb, ${t} ${Math.round(n * 100)}%, transparent)`;
    const a = i.length === 3 ? i.split("").map((s) => s + s).join("") : i, r = parseInt(a, 16);
    return `rgba(${r >> 16 & 255}, ${r >> 8 & 255}, ${r & 255}, ${n})`;
  }
  // ------------------------------------------------------------
  // Text segmentation (highlight matching)
  // ------------------------------------------------------------
  /** [start, end) ranges of every case-insensitive highlight match. */
  _matchRanges(t, n) {
    const i = n.trim();
    if (!t || !i) return [];
    const e = t.toLowerCase(), a = i.toLowerCase(), r = [];
    let s = 0;
    for (; s <= e.length - a.length; ) {
      const d = e.indexOf(a, s);
      if (d === -1) break;
      r.push([d, d + a.length]), s = d + a.length;
    }
    return r;
  }
  /** Split into highlighted / plain runs (block + typewriter rendering). */
  _segments(t, n) {
    if (!t) return [];
    const i = this._matchRanges(t, n);
    if (i.length === 0) return [{ value: t, hl: !1 }];
    const e = [];
    let a = 0;
    for (const [r, s] of i)
      r > a && e.push({ value: t.slice(a, r), hl: !1 }), e.push({ value: t.slice(r, s), hl: !0 }), a = s;
    return a < t.length && e.push({ value: t.slice(a), hl: !1 }), e;
  }
  /**
   * Split into whole words, flagging any word that overlaps a highlight match.
   * Whole words only: an inline-block boundary inside an Arabic word would
   * break letter joining.
   */
  _words(t, n) {
    const i = this._matchRanges(t, n), e = [], a = /\S+/g;
    let r;
    for (; r = a.exec(t); ) {
      const s = r.index, d = s + r[0].length;
      e.push({
        value: r[0],
        hl: i.some(([p, h]) => s < h && d > p)
      });
    }
    return e;
  }
  _lines(t) {
    return t.split(/\r?\n/).map((n) => n.trim()).filter(Boolean);
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback(), this._reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, this._reduced && (this._entered = !0, this._typingDone = !0);
  }
  firstUpdated() {
    if (!this._entered) {
      if (!("IntersectionObserver" in window)) {
        this._entered = !0;
        return;
      }
      this._io = new IntersectionObserver(
        (t) => {
          var n;
          t.some((i) => i.isIntersecting) && (this._entered = !0, (n = this._io) == null || n.disconnect(), this._io = null);
        },
        { threshold: 0.15 }
      ), this._io.observe(this);
    }
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._io) == null || t.disconnect(), this._io = null, this._stopTyping();
  }
  updated(t) {
    this._anim() === "typing" && this._entered && !this._typingDone && this._typingTimer === null && this._startTyping();
  }
  // ------------------------------------------------------------
  // Typewriter
  // ------------------------------------------------------------
  _anim() {
    var t;
    return this._reduced ? "none" : this._pickValue(
      (t = this.config) == null ? void 0 : t.animation_style,
      "words"
    );
  }
  _speedMult() {
    var t;
    return ot[this._pickValue((t = this.config) == null ? void 0 : t.animation_speed, "normal")];
  }
  _typingInterval() {
    return Math.max(28, Math.round(58 * this._speedMult()));
  }
  _startTyping() {
    var t;
    if (this.localizedString((t = this.config) == null ? void 0 : t.title).length === 0) {
      this._typingDone = !0;
      return;
    }
    this._typingTimer = window.setInterval(() => {
      var i;
      const n = this.localizedString((i = this.config) == null ? void 0 : i.title).length;
      if (this._typedCount >= n) {
        this._stopTyping(), window.setTimeout(() => {
          this._typingDone = !0;
        }, 350);
        return;
      }
      this._typedCount += 1;
    }, this._typingInterval());
  }
  _stopTyping() {
    this._typingTimer !== null && (window.clearInterval(this._typingTimer), this._typingTimer = null);
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, n = this._lang() === "ar", i = this._isRtl(), e = this._anim(), a = this._speedMult(), r = this._pickValue(t.enter_direction, "up"), s = this._pickValue(t.text_align, "center"), d = this._pickValue(t.text_size_mobile, "medium"), p = this._pickValue(
      t.text_size_desktop,
      "inherit"
    ), h = p === "inherit" ? d : p, u = this._pickValue(t.content_width, "medium"), f = this._pickValue(t.spacing, "normal"), _ = this._pickValue(t.theme, "light"), R = this._pickValue(t.bg_style, "transparent"), Y = this._pickValue(
      t.highlight_style,
      "gradient"
    ), M = this._pickValue(t.button_style, "solid"), k = this.localizedString(t.eyebrow), y = this.localizedString(t.title), W = this.localizedString(t.highlight_words), z = this.localizedString(t.subtitle), v = this.localizedString(t.paragraph), A = this.localizedString(t.button_text), U = (t.button_url || "").trim();
    if (!k && !y && !z && !v)
      return o`<section
        class="it"
        data-theme=${_}
        data-bg="transparent"
        data-spacing="normal"
        data-width="medium"
        data-size="medium"
        data-size-desktop="medium"
      >
        <p class="it-empty">
          ${n ? "أضف عنوانًا أو فقرة لعرض هذا القسم." : "Add a title or a paragraph to display this section."}
        </p>
      </section>`;
    const x = 0.14 * a, S = 0.055 * a, D = 0.18 * a, N = e === "words" ? this._words(y, W) : [], P = e === "lines" ? this._lines(y) : [], C = e === "words" ? this._words(v, "") : [], B = e === "lines" ? this._lines(v) : [], O = e === "words" && C.length > 0 && C.length <= lt;
    let c = 0.08;
    const g = {
      eyebrowDelay: 0,
      titleDelay: 0,
      subtitleDelay: 0,
      paragraphDelay: 0,
      buttonDelay: 0
    };
    k && (g.eyebrowDelay = c, c += x), y && (g.titleDelay = c, e === "words" ? c += N.length * S + 0.1 : e === "lines" ? c += P.length * D : c += x), z && (g.subtitleDelay = c, c += x), v && (g.paragraphDelay = c, e === "lines" ? c += B.length * D : O ? c += C.length * S : c += x), A && (g.buttonDelay = c, c += x);
    const X = e === "typing" ? y.length * this._typingInterval() / 1e3 + 0.4 : c + 0.1;
    e === "typing" && (g.subtitleDelay = 0, g.paragraphDelay = 0.12 * a, g.buttonDelay = 0.24 * a);
    const $ = e === "fade" ? "fade" : e === "slide" ? "slide" : e === "none" ? "none" : "rise", w = { fx: "0px", fy: "0px" };
    e === "slide" && (r === "up" ? w.fy = "30px" : r === "down" ? w.fy = "-30px" : r === "start" ? w.fx = i ? "36px" : "-36px" : w.fx = i ? "-36px" : "36px");
    const T = (t.accent_color || "").trim(), H = [
      `--it-dur:${(0.7 * a).toFixed(2)}s`,
      `--it-wdur:${(0.55 * a).toFixed(2)}s`,
      `--it-rdur:${(0.9 * a).toFixed(2)}s`,
      `--it-fx:${w.fx}`,
      `--it-fy:${w.fy}`,
      `--hd:${X.toFixed(2)}s`,
      `--it-grad-dir:${i ? "270deg" : "90deg"}`,
      `--it-hl-x:${i ? "right" : "left"}`,
      T ? `--it-accent:${T}` : "",
      T ? `--it-accent-soft:${this._softColor(T, 0.22)}` : "",
      t.accent_color_2 ? `--it-accent-2:${t.accent_color_2}` : "",
      t.bg_color ? `--it-bg:${t.bg_color}` : "",
      t.bg_grad_1 ? `--it-grad-1:${t.bg_grad_1}` : "",
      t.bg_grad_2 ? `--it-grad-2:${t.bg_grad_2}` : "",
      t.title_color ? `--it-title-c:${t.title_color}` : "",
      t.subtitle_color ? `--it-subtitle-c:${t.subtitle_color}` : "",
      t.text_color ? `--it-text-c:${t.text_color}` : "",
      t.button_text_color ? `--it-btn-text:${t.button_text_color}` : "",
      ...at(t, (G, J) => this._pickValue(G, J), "lg", "lg")
    ].filter(Boolean).join("; "), K = e === "none" ? !0 : this._entered, q = e === "typing" ? this._typingDone : !0;
    return o`
      <section
        class="it"
        style=${H}
        data-entered=${K ? "true" : "false"}
        data-typed=${q ? "true" : "false"}
        data-anim=${e}
        data-theme=${_}
        data-bg=${R}
        data-align=${s}
        data-size=${d}
        data-size-desktop=${h}
        data-spacing=${f}
        data-width=${u}
        data-dir=${i ? "rtl" : "ltr"}
      >
        <div class="it-inner">
          ${k ? o`<p
                class="it-eyebrow it-block"
                data-fx=${e === "reveal" ? "none" : $}
                style="--d:${g.eyebrowDelay.toFixed(2)}s"
              >
                ${this._wrapReveal(e, o`${k}`)}
              </p>` : m}
          ${y ? this._renderTitle(
      e,
      y,
      W,
      Y,
      N,
      P,
      g.titleDelay,
      S,
      D,
      $
    ) : m}
          ${z ? o`<p
                class="it-subtitle it-block ${e === "typing" ? "it-post" : ""}"
                data-fx=${e === "reveal" ? "none" : $}
                style="--d:${g.subtitleDelay.toFixed(2)}s"
              >
                ${this._wrapReveal(e, o`${z}`)}
              </p>` : m}
          ${v ? this._renderParagraph(
      e,
      v,
      C,
      B,
      O,
      g.paragraphDelay,
      S,
      D,
      $
    ) : m}
          ${A ? o`<a
                class="it-btn it-block ${e === "typing" ? "it-post" : ""}"
                data-style=${M}
                data-fx=${e === "reveal" ? "rise" : $}
                style="--d:${g.buttonDelay.toFixed(2)}s"
                href=${U || "#"}
              >
                <span>${A}</span>
                ${M === "ghost" ? o`<span class="it-btn-arrow" aria-hidden="true"
                      >${i ? "←" : "→"}</span
                    >` : m}
              </a>` : m}
        </div>
      </section>
    `;
  }
  /** In reveal mode, wrap a block's content in the curtain clip structure. */
  _wrapReveal(t, n) {
    return t !== "reveal" ? n : o`<span class="it-clip"
      ><span class="it-reveal">${n}</span></span
    >`;
  }
  _renderInlineSegments(t, n) {
    return t.map(
      (i) => i.hl ? o`<span class="it-hl" data-hl=${n}>${i.value}</span>` : o`${i.value}`
    );
  }
  _renderWordSpans(t, n, i, e) {
    return t.map(
      (a, r) => o`<span
            class="it-w ${a.hl ? "it-hl" : ""}"
            data-hl=${a.hl ? n : m}
            style="--d:${(i + r * e).toFixed(2)}s"
            >${a.value}</span
          >${" "}`
    );
  }
  _renderTitle(t, n, i, e, a, r, s, d, p, h) {
    const u = t === "words" || t === "lines" || t === "typing";
    let f;
    return t === "words" ? f = this._renderWordSpans(a, e, s, d) : t === "lines" ? f = r.map(
      (_, R) => o`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(s + R * p).toFixed(2)}s"
              >${this._renderInlineSegments(
        this._segments(_, i),
        e
      )}</span
            ></span
          >`
    ) : t === "typing" ? f = o`${this._renderTyped(
      this._segments(n, i),
      e
    )}${this._entered && !this._typingDone ? o`<span class="it-caret" aria-hidden="true"></span>` : m}` : f = this._wrapReveal(
      t,
      o`${this._renderInlineSegments(
        this._segments(n, i),
        e
      )}`
    ), o`<h2
      class="it-title it-block"
      data-fx=${u || t === "reveal" ? "none" : h}
      style="--d:${s.toFixed(2)}s"
      aria-label=${u ? n.replace(/\s+/g, " ") : m}
    >
      ${u ? o`<span aria-hidden="true">${f}</span>` : f}
    </h2>`;
  }
  /** Typewriter: walk the highlight segments, slicing up to the typed count. */
  _renderTyped(t, n) {
    let i = this._typedCount;
    const e = [];
    for (const a of t) {
      if (i <= 0) break;
      const r = Math.min(a.value.length, i);
      i -= r;
      const s = a.value.slice(0, r);
      e.push(
        a.hl ? o`<span class="it-hl" data-hl=${n}>${s}</span>` : o`${s}`
      );
    }
    return e;
  }
  _renderParagraph(t, n, i, e, a, r, s, d, p) {
    const h = t === "words" && a || t === "lines";
    let u;
    return t === "lines" ? u = e.map(
      (f, _) => o`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(r + _ * d).toFixed(2)}s"
              >${f}</span
            ></span
          >`
    ) : h ? u = this._renderWordSpans(i, "color", r, s) : u = this._wrapReveal(t, o`${n}`), o`<p
      class="it-paragraph it-block ${t === "typing" ? "it-post" : ""}"
      data-split=${h ? "true" : m}
      data-fx=${h || t === "reveal" ? "none" : p}
      style="--d:${r.toFixed(2)}s"
      aria-label=${h ? n.replace(/\s+/g, " ") : m}
    >
      ${h ? o`<span aria-hidden="true">${u}</span>` : u}
    </p>`;
  }
};
F.styles = rt;
let b = F;
V([
  tt({ type: Object })
], b.prototype, "config");
V([
  E()
], b.prototype, "_entered");
V([
  E()
], b.prototype, "_typedCount");
V([
  E()
], b.prototype, "_typingDone");
typeof b < "u" && b.registerSallaComponent("salla-interactive-text");
export {
  b as default
};
