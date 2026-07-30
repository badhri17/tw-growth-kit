import { LitElement as K, css as q, html as o, nothing as m } from "lit";
import { property as G, state as F } from "lit/decorators.js";
function J(c, t) {
  if (typeof c == "string") return c;
  if (!c || typeof c != "object") return "";
  const a = c[t] || c.ar || c.en || "";
  return typeof a == "string" ? a.trim() : "";
}
function P(c) {
  return c.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class Q extends K {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const a = String(t || "").trim(), e = a.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), i = e.includes("-") ? e : `salla-${e || "component"}`, n = () => `${i}-${Math.random().toString(36).substring(2, 8)}`, r = () => {
      var g;
      const l = (g = window.Salla) == null ? void 0 : g.bundles;
      return l && typeof l.registerComponent == "function" ? (l.registerComponent(a, {
        component: this,
        dynamicTagName: n()
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
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return J(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, a) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if (e && typeof e.value == "string" && e.value)
        return e.value;
    }
    return a;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return P(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, a) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const e = Number(P(t.trim()));
      if (!Number.isNaN(e)) return e;
    }
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if ((e == null ? void 0 : e.value) !== void 0) return this._num(e.value, a);
    }
    return a;
  }
}
const Z = q`
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
    padding-block: var(--it-pad-y);
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

  /* Spacing tiers */
  .it[data-spacing="compact"] {
    --it-pad-y: 2.25rem;
    --it-gap: 0.85rem;
  }
  .it[data-spacing="normal"] {
    --it-pad-y: 3.5rem;
    --it-gap: 1.1rem;
  }
  .it[data-spacing="spacious"] {
    --it-pad-y: 5rem;
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
    .it[data-spacing="compact"] {
      --it-pad-y: 3.25rem;
    }
    .it[data-spacing="normal"] {
      --it-pad-y: 5rem;
    }
    .it[data-spacing="spacious"] {
      --it-pad-y: 7.5rem;
    }
    .it {
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
var tt = Object.defineProperty, I = (c, t, a, e) => {
  for (var i = void 0, n = c.length - 1, r; n >= 0; n--)
    (r = c[n]) && (i = r(t, a, i) || i);
  return i && tt(t, a, i), i;
};
const et = {
  slow: 1.45,
  normal: 1,
  fast: 0.65
}, it = 80, L = class L extends Q {
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
  _softColor(t, a) {
    const e = t.trim().replace(/^#/, "");
    if (!(/^[0-9a-f]{3}$/i.test(e) || /^[0-9a-f]{6}$/i.test(e)))
      return `color-mix(in srgb, ${t} ${Math.round(a * 100)}%, transparent)`;
    const n = e.length === 3 ? e.split("").map((s) => s + s).join("") : e, r = parseInt(n, 16);
    return `rgba(${r >> 16 & 255}, ${r >> 8 & 255}, ${r & 255}, ${a})`;
  }
  // ------------------------------------------------------------
  // Text segmentation (highlight matching)
  // ------------------------------------------------------------
  /** [start, end) ranges of every case-insensitive highlight match. */
  _matchRanges(t, a) {
    const e = a.trim();
    if (!t || !e) return [];
    const i = t.toLowerCase(), n = e.toLowerCase(), r = [];
    let s = 0;
    for (; s <= i.length - n.length; ) {
      const l = i.indexOf(n, s);
      if (l === -1) break;
      r.push([l, l + n.length]), s = l + n.length;
    }
    return r;
  }
  /** Split into highlighted / plain runs (block + typewriter rendering). */
  _segments(t, a) {
    if (!t) return [];
    const e = this._matchRanges(t, a);
    if (e.length === 0) return [{ value: t, hl: !1 }];
    const i = [];
    let n = 0;
    for (const [r, s] of e)
      r > n && i.push({ value: t.slice(n, r), hl: !1 }), i.push({ value: t.slice(r, s), hl: !0 }), n = s;
    return n < t.length && i.push({ value: t.slice(n), hl: !1 }), i;
  }
  /**
   * Split into whole words, flagging any word that overlaps a highlight match.
   * Whole words only: an inline-block boundary inside an Arabic word would
   * break letter joining.
   */
  _words(t, a) {
    const e = this._matchRanges(t, a), i = [], n = /\S+/g;
    let r;
    for (; r = n.exec(t); ) {
      const s = r.index, l = s + r[0].length;
      i.push({
        value: r[0],
        hl: e.some(([g, h]) => s < h && l > g)
      });
    }
    return i;
  }
  _lines(t) {
    return t.split(/\r?\n/).map((a) => a.trim()).filter(Boolean);
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
          var a;
          t.some((e) => e.isIntersecting) && (this._entered = !0, (a = this._io) == null || a.disconnect(), this._io = null);
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
    return et[this._pickValue((t = this.config) == null ? void 0 : t.animation_speed, "normal")];
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
      var e;
      const a = this.localizedString((e = this.config) == null ? void 0 : e.title).length;
      if (this._typedCount >= a) {
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
    const t = this.config || {}, a = this._lang() === "ar", e = this._isRtl(), i = this._anim(), n = this._speedMult(), r = this._pickValue(t.enter_direction, "up"), s = this._pickValue(t.text_align, "center"), l = this._pickValue(t.text_size_mobile, "medium"), g = this._pickValue(
      t.text_size_desktop,
      "inherit"
    ), h = g === "inherit" ? l : g, u = this._pickValue(t.content_width, "medium"), f = this._pickValue(t.spacing, "normal"), _ = this._pickValue(t.theme, "light"), R = this._pickValue(t.bg_style, "transparent"), j = this._pickValue(
      t.highlight_style,
      "gradient"
    ), M = this._pickValue(t.button_style, "solid"), k = this.localizedString(t.eyebrow), y = this.localizedString(t.title), A = this.localizedString(t.highlight_words), z = this.localizedString(t.subtitle), w = this.localizedString(t.paragraph), V = this.localizedString(t.button_text), B = (t.button_url || "").trim();
    if (!k && !y && !z && !w)
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
          ${a ? "أضف عنوانًا أو فقرة لعرض هذا القسم." : "Add a title or a paragraph to display this section."}
        </p>
      </section>`;
    const x = 0.14 * n, S = 0.055 * n, D = 0.18 * n, W = i === "words" ? this._words(y, A) : [], N = i === "lines" ? this._lines(y) : [], C = i === "words" ? this._words(w, "") : [], E = i === "lines" ? this._lines(w) : [], O = i === "words" && C.length > 0 && C.length <= it;
    let d = 0.08;
    const p = {
      eyebrowDelay: 0,
      titleDelay: 0,
      subtitleDelay: 0,
      paragraphDelay: 0,
      buttonDelay: 0
    };
    k && (p.eyebrowDelay = d, d += x), y && (p.titleDelay = d, i === "words" ? d += W.length * S + 0.1 : i === "lines" ? d += N.length * D : d += x), z && (p.subtitleDelay = d, d += x), w && (p.paragraphDelay = d, i === "lines" ? d += E.length * D : O ? d += C.length * S : d += x), V && (p.buttonDelay = d, d += x);
    const Y = i === "typing" ? y.length * this._typingInterval() / 1e3 + 0.4 : d + 0.1;
    i === "typing" && (p.subtitleDelay = 0, p.paragraphDelay = 0.12 * n, p.buttonDelay = 0.24 * n);
    const $ = i === "fade" ? "fade" : i === "slide" ? "slide" : i === "none" ? "none" : "rise", v = { fx: "0px", fy: "0px" };
    i === "slide" && (r === "up" ? v.fy = "30px" : r === "down" ? v.fy = "-30px" : r === "start" ? v.fx = e ? "36px" : "-36px" : v.fx = e ? "-36px" : "36px");
    const T = (t.accent_color || "").trim(), U = [
      `--it-dur:${(0.7 * n).toFixed(2)}s`,
      `--it-wdur:${(0.55 * n).toFixed(2)}s`,
      `--it-rdur:${(0.9 * n).toFixed(2)}s`,
      `--it-fx:${v.fx}`,
      `--it-fy:${v.fy}`,
      `--hd:${Y.toFixed(2)}s`,
      `--it-grad-dir:${e ? "270deg" : "90deg"}`,
      `--it-hl-x:${e ? "right" : "left"}`,
      T ? `--it-accent:${T}` : "",
      T ? `--it-accent-soft:${this._softColor(T, 0.22)}` : "",
      t.accent_color_2 ? `--it-accent-2:${t.accent_color_2}` : "",
      t.bg_color ? `--it-bg:${t.bg_color}` : "",
      t.bg_grad_1 ? `--it-grad-1:${t.bg_grad_1}` : "",
      t.bg_grad_2 ? `--it-grad-2:${t.bg_grad_2}` : "",
      t.title_color ? `--it-title-c:${t.title_color}` : "",
      t.subtitle_color ? `--it-subtitle-c:${t.subtitle_color}` : "",
      t.text_color ? `--it-text-c:${t.text_color}` : "",
      t.button_text_color ? `--it-btn-text:${t.button_text_color}` : ""
    ].filter(Boolean).join("; "), X = i === "none" ? !0 : this._entered, H = i === "typing" ? this._typingDone : !0;
    return o`
      <section
        class="it"
        style=${U}
        data-entered=${X ? "true" : "false"}
        data-typed=${H ? "true" : "false"}
        data-anim=${i}
        data-theme=${_}
        data-bg=${R}
        data-align=${s}
        data-size=${l}
        data-size-desktop=${h}
        data-spacing=${f}
        data-width=${u}
        data-dir=${e ? "rtl" : "ltr"}
      >
        <div class="it-inner">
          ${k ? o`<p
                class="it-eyebrow it-block"
                data-fx=${i === "reveal" ? "none" : $}
                style="--d:${p.eyebrowDelay.toFixed(2)}s"
              >
                ${this._wrapReveal(i, o`${k}`)}
              </p>` : m}
          ${y ? this._renderTitle(
      i,
      y,
      A,
      j,
      W,
      N,
      p.titleDelay,
      S,
      D,
      $
    ) : m}
          ${z ? o`<p
                class="it-subtitle it-block ${i === "typing" ? "it-post" : ""}"
                data-fx=${i === "reveal" ? "none" : $}
                style="--d:${p.subtitleDelay.toFixed(2)}s"
              >
                ${this._wrapReveal(i, o`${z}`)}
              </p>` : m}
          ${w ? this._renderParagraph(
      i,
      w,
      C,
      E,
      O,
      p.paragraphDelay,
      S,
      D,
      $
    ) : m}
          ${V ? o`<a
                class="it-btn it-block ${i === "typing" ? "it-post" : ""}"
                data-style=${M}
                data-fx=${i === "reveal" ? "rise" : $}
                style="--d:${p.buttonDelay.toFixed(2)}s"
                href=${B || "#"}
              >
                <span>${V}</span>
                ${M === "ghost" ? o`<span class="it-btn-arrow" aria-hidden="true"
                      >${e ? "←" : "→"}</span
                    >` : m}
              </a>` : m}
        </div>
      </section>
    `;
  }
  /** In reveal mode, wrap a block's content in the curtain clip structure. */
  _wrapReveal(t, a) {
    return t !== "reveal" ? a : o`<span class="it-clip"
      ><span class="it-reveal">${a}</span></span
    >`;
  }
  _renderInlineSegments(t, a) {
    return t.map(
      (e) => e.hl ? o`<span class="it-hl" data-hl=${a}>${e.value}</span>` : o`${e.value}`
    );
  }
  _renderWordSpans(t, a, e, i) {
    return t.map(
      (n, r) => o`<span
            class="it-w ${n.hl ? "it-hl" : ""}"
            data-hl=${n.hl ? a : m}
            style="--d:${(e + r * i).toFixed(2)}s"
            >${n.value}</span
          >${" "}`
    );
  }
  _renderTitle(t, a, e, i, n, r, s, l, g, h) {
    const u = t === "words" || t === "lines" || t === "typing";
    let f;
    return t === "words" ? f = this._renderWordSpans(n, i, s, l) : t === "lines" ? f = r.map(
      (_, R) => o`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(s + R * g).toFixed(2)}s"
              >${this._renderInlineSegments(
        this._segments(_, e),
        i
      )}</span
            ></span
          >`
    ) : t === "typing" ? f = o`${this._renderTyped(
      this._segments(a, e),
      i
    )}${this._entered && !this._typingDone ? o`<span class="it-caret" aria-hidden="true"></span>` : m}` : f = this._wrapReveal(
      t,
      o`${this._renderInlineSegments(
        this._segments(a, e),
        i
      )}`
    ), o`<h2
      class="it-title it-block"
      data-fx=${u || t === "reveal" ? "none" : h}
      style="--d:${s.toFixed(2)}s"
      aria-label=${u ? a.replace(/\s+/g, " ") : m}
    >
      ${u ? o`<span aria-hidden="true">${f}</span>` : f}
    </h2>`;
  }
  /** Typewriter: walk the highlight segments, slicing up to the typed count. */
  _renderTyped(t, a) {
    let e = this._typedCount;
    const i = [];
    for (const n of t) {
      if (e <= 0) break;
      const r = Math.min(n.value.length, e);
      e -= r;
      const s = n.value.slice(0, r);
      i.push(
        n.hl ? o`<span class="it-hl" data-hl=${a}>${s}</span>` : o`${s}`
      );
    }
    return i;
  }
  _renderParagraph(t, a, e, i, n, r, s, l, g) {
    const h = t === "words" && n || t === "lines";
    let u;
    return t === "lines" ? u = i.map(
      (f, _) => o`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(r + _ * l).toFixed(2)}s"
              >${f}</span
            ></span
          >`
    ) : h ? u = this._renderWordSpans(e, "color", r, s) : u = this._wrapReveal(t, o`${a}`), o`<p
      class="it-paragraph it-block ${t === "typing" ? "it-post" : ""}"
      data-split=${h ? "true" : m}
      data-fx=${h || t === "reveal" ? "none" : g}
      style="--d:${r.toFixed(2)}s"
      aria-label=${h ? a.replace(/\s+/g, " ") : m}
    >
      ${h ? o`<span aria-hidden="true">${u}</span>` : u}
    </p>`;
  }
};
L.styles = Z;
let b = L;
I([
  G({ type: Object })
], b.prototype, "config");
I([
  F()
], b.prototype, "_entered");
I([
  F()
], b.prototype, "_typedCount");
I([
  F()
], b.prototype, "_typingDone");
typeof b < "u" && b.registerSallaComponent("salla-interactive-text");
export {
  b as default
};
