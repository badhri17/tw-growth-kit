import { LitElement as et, css as at, html as r, nothing as o } from "lit";
import { property as it, state as y } from "lit/decorators.js";
import { keyed as rt } from "lit/directives/keyed.js";
function nt(p, t) {
  if (typeof p == "string") return p;
  if (!p || typeof p != "object") return "";
  const s = p[t] || p.ar || p.en || "";
  return typeof s == "string" ? s.trim() : "";
}
function F(p) {
  return p.replace(/[٠-٩]/g, (t) => String(t.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, (t) => String(t.charCodeAt(0) - 1776));
}
class ot extends et {
  /**
   * Twilight transform injects `Component.registerSallaComponent(...)`.
   * Statics inherit, so `this` is the concrete component. The polling
   * fallback handles preview contexts where `Salla` loads after the
   * component file executes.
   */
  static registerSallaComponent(t) {
    const s = String(t || "").trim(), e = s.toLowerCase().replace(/[^a-z0-9._-]/g, "-"), a = e.includes("-") ? e : `salla-${e || "component"}`, i = () => `${a}-${Math.random().toString(36).substring(2, 8)}`, n = () => {
      var f;
      const l = (f = window.Salla) == null ? void 0 : f.bundles;
      return l && typeof l.registerComponent == "function" ? (l.registerComponent(s, {
        component: this,
        dynamicTagName: i()
      }), !0) : !1;
    };
    if (n()) return;
    const d = window.setInterval(() => {
      n() && window.clearInterval(d);
    }, 100);
    window.setTimeout(() => window.clearInterval(d), 5e3);
  }
  /** Resolved document language. */
  _lang() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
  }
  /** Pull the store-language string out of a Salla multilanguage value. */
  localizedString(t) {
    return nt(t, this._lang());
  }
  /** Dropdown-list values from settings may come as [{ label, value }]. */
  _pickValue(t, s) {
    if (typeof t == "string" && t) return t;
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if (e && typeof e.value == "string" && e.value)
        return e.value;
    }
    return s;
  }
  /** See module-level toLatinDigits; exposed for subclasses. */
  _toLatinDigits(t) {
    return F(t);
  }
  /** Coerce a config number that may arrive as a string (Arabic-Indic
      digits included) or as a [{ value }] dropdown selection. */
  _num(t, s) {
    if (typeof t == "number" && !Number.isNaN(t)) return t;
    if (typeof t == "string" && t.trim() !== "") {
      const e = Number(F(t.trim()));
      if (!Number.isNaN(e)) return e;
    }
    if (Array.isArray(t) && t.length > 0) {
      const e = t[0];
      if ((e == null ? void 0 : e.value) !== void 0) return this._num(e.value, s);
    }
    return s;
  }
}
const lt = at`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    /* --- Section / typography --- */
    --ss-bg: transparent;
    --ss-title-color: #0a0a0b;
    --ss-subtitle-color: #6b7280;
    --ss-slide-title-color: #ffffff;
    --ss-slide-text-color: rgba(255, 255, 255, 0.92);
    --ss-text-color: var(--ss-slide-text-color);

    /* --- Frame (mobile-first: mobile ratio is the base, desktop overrides) --- */
    --ss-radius: 20px;
    --ss-aspect-mobile: 4 / 5;
    --ss-aspect-desktop: 16 / 9;
    --ss-max-width: 1280px;

    /* --- Overlay scrim --- */
    --ss-overlay-a: 0.55;

    /* --- Controls --- */
    --ss-arrow-bg: rgba(255, 255, 255, 0.14);
    --ss-arrow-icon: #ffffff;
    --ss-arrow-bg-hover: rgba(255, 255, 255, 0.28);

    --ss-pag-color: rgba(255, 255, 255, 0.55);
    --ss-pag-active: #ffffff;

    --ss-cta-bg: #ffffff;
    --ss-cta-color: #0a0a0b;

    --ss-badge-bg: #0a0a0b;
    --ss-badge-color: #ffffff;

    /* --- Motion --- */
    --ss-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --ss-ease-soft: cubic-bezier(0.4, 0, 0.2, 1);
    --ss-dur: 900ms;
    --ss-dur-fast: 500ms;
    --ss-dur-slow: 1300ms;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ===========================================================
     SECTION
     =========================================================== */
  .ss-section {
    width: 100%;
    background-color: var(--ss-bg);
    padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 1.5rem);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  /* Full-bleed: break out of any centered theme container to span the real
     viewport edge-to-edge. margin-inline pulls the section out to ±50vw from
     its own centre; 100vw makes it as wide as the viewport. */
  .ss-section[data-full-width="true"] {
    width: 100vw;
    max-width: 100vw;
    margin-inline: calc(50% - 50vw);
    padding-inline: 0;
  }
  .ss-section[data-full-width="true"] .ss-frame {
    max-width: 100%;
    border-radius: 0;
  }

  /* ===========================================================
     HEADER (optional title + subtitle above the slider)
     =========================================================== */
  .ss-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: clamp(1.5rem, 4vw, 2.75rem);
  }
  .ss-section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 500;
    letter-spacing: 0.4px;
    color: var(--ss-title-color);
    margin: 0 0 0.5rem;
    line-height: 1.2;
  }
  .ss-section-subtitle {
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    color: var(--ss-subtitle-color);
    line-height: 1.7;
    margin: 0;
  }

  /* ===========================================================
     FRAME — the actual carousel container (3D stage)
     =========================================================== */
  .ss-frame {
    position: relative;
    width: 100%;
    max-width: var(--ss-max-width);
    /* Mobile-first base ratio; desktop override lives in the min-width query. */
    aspect-ratio: var(--ss-aspect-mobile);
    border-radius: var(--ss-radius);
    overflow: hidden;
    isolation: isolate; /* keeps overlay scrim above media, below content */
    background: #0a0a0b;
  }
  @media (min-width: 768px) {
    .ss-frame {
      aspect-ratio: var(--ss-aspect-desktop);
    }
  }

  /* ===========================================================
     TRACK — slides are absolutely stacked; transition modes pose them
     =========================================================== */
  .ss-track {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .ss-slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    will-change: opacity, transform;
    transition: opacity var(--ss-dur) var(--ss-ease),
      transform var(--ss-dur) var(--ss-ease),
      visibility 0s linear var(--ss-dur);
  }
  .ss-slide[data-pos="active"] {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    z-index: 2;
    transition: opacity var(--ss-dur) var(--ss-ease),
      transform var(--ss-dur) var(--ss-ease), visibility 0s linear 0s;
  }
  /* Side slides stay rendered (so transitions can move them) but pinned hidden */
  .ss-slide[data-pos="prev"],
  .ss-slide[data-pos="next"] {
    z-index: 1;
  }

  /* ===========================================================
     MEDIA — image / video fills the slide
     =========================================================== */
  .ss-media {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .ss-media img,
  .ss-media video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }

  /* ===========================================================
     OVERLAY SCRIM — between media and content
     =========================================================== */
  .ss-scrim {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }
  .ss-frame[data-overlay="none"] .ss-scrim {
    display: none;
  }
  .ss-frame[data-overlay="dark-bottom"] .ss-scrim {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, calc(var(--ss-overlay-a) * 1.1)) 0%,
      rgba(0, 0, 0, calc(var(--ss-overlay-a) * 0.55)) 40%,
      rgba(0, 0, 0, 0) 80%
    );
  }
  .ss-frame[data-overlay="glass-bottom"] .ss-scrim {
    inset: auto 0 0;
    height: 60%;
    background: linear-gradient(
      to top,
      rgba(8, 8, 12, calc(var(--ss-overlay-a) * 0.62)) 0%,
      rgba(18, 18, 24, calc(var(--ss-overlay-a) * 0.38)) 58%,
      rgba(255, 255, 255, 0.08) 100%
    );
    -webkit-backdrop-filter: blur(18px) saturate(135%);
    backdrop-filter: blur(18px) saturate(135%);
    -webkit-mask-image: linear-gradient(
      to top,
      #000 0%,
      #000 58%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to top,
      #000 0%,
      #000 58%,
      transparent 100%
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
  .ss-frame[data-overlay="dark-top"] .ss-scrim {
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, calc(var(--ss-overlay-a) * 1.1)) 0%,
      rgba(0, 0, 0, calc(var(--ss-overlay-a) * 0.55)) 40%,
      rgba(0, 0, 0, 0) 80%
    );
  }
  .ss-frame[data-overlay="dark-full"] .ss-scrim {
    background: rgba(0, 0, 0, var(--ss-overlay-a));
  }
  .ss-frame[data-overlay="light-full"] .ss-scrim {
    background: rgba(255, 255, 255, var(--ss-overlay-a));
  }
  .ss-frame[data-overlay="vignette"] .ss-scrim {
    background: radial-gradient(
      ellipse at center,
      rgba(0, 0, 0, 0) 35%,
      rgba(0, 0, 0, var(--ss-overlay-a)) 100%
    );
  }
  /* ===========================================================
     CONTENT OVERLAY — the eyebrow / title / desc / CTA stack
     =========================================================== */
  .ss-content {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    padding: clamp(1.25rem, 4vw, 3rem);
    pointer-events: none;
  }
  .ss-content > .ss-content-inner {
    max-width: min(620px, 80%);
    display: flex;
    flex-direction: column;
    gap: clamp(0.4rem, 1vw, 0.85rem);
    pointer-events: auto;
  }

  /* 3×3 grid placement — driven by data-content-position on the frame.
     We use *physical* keywords (left/right) so that "top-right" always lands
     on the visible right edge, regardless of document direction (RTL/LTR).
     Without this, the logical start/end keywords would mirror the position
     under RTL — when an Arabic merchant picks "top-right" they expect the
     content to sit on the visible right, not on the visible left. */
  .ss-frame[data-content-position="top-left"] .ss-content {
    align-items: start;
    justify-items: left;
    text-align: left;
  }
  .ss-frame[data-content-position="top-center"] .ss-content {
    align-items: start;
    justify-items: center;
    text-align: center;
  }
  .ss-frame[data-content-position="top-right"] .ss-content {
    align-items: start;
    justify-items: right;
    text-align: right;
  }
  .ss-frame[data-content-position="center-left"] .ss-content {
    align-items: center;
    justify-items: left;
    text-align: left;
  }
  .ss-frame[data-content-position="center"] .ss-content {
    align-items: center;
    justify-items: center;
    text-align: center;
  }
  .ss-frame[data-content-position="center-right"] .ss-content {
    align-items: center;
    justify-items: right;
    text-align: right;
  }
  .ss-frame[data-content-position="bottom-left"] .ss-content {
    align-items: end;
    justify-items: left;
    text-align: left;
  }
  .ss-frame[data-content-position="bottom-center"] .ss-content {
    align-items: end;
    justify-items: center;
    text-align: center;
  }
  .ss-frame[data-content-position="bottom-right"] .ss-content {
    align-items: end;
    justify-items: right;
    text-align: right;
  }

  /* Lift content when inside-bottom controls or pagination occupy the bottom strip. */
  .ss-frame[data-content-position^="bottom"][data-has-bottom-strip="true"]
    .ss-content {
    padding-bottom: clamp(4.5rem, 9vw, 6.5rem);
  }

  .ss-eyebrow {
    font-size: clamp(0.7rem, 1vw, 0.8rem);
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.85;
    margin: 0;
    color: var(--ss-slide-title-color);
  }
  .ss-eyebrow:dir(rtl) {
    letter-spacing: 0;
    text-transform: none;
    font-weight: 700;
  }
  .ss-title {
    font-size: clamp(1.65rem, 4vw, 3.25rem);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--ss-slide-title-color);
    margin: 0;
    text-wrap: balance;
  }
  .ss-title:dir(rtl) {
    line-height: 1.25;
    letter-spacing: 0;
  }
  .ss-desc {
    font-size: clamp(0.95rem, 1.35vw, 1.075rem);
    line-height: 1.65;
    color: var(--ss-slide-text-color);
    margin: 0;
    max-width: 56ch;
    text-wrap: pretty;
  }

  /* Light theme flips the default white text to dark, scrim still applies. */
  .ss-frame[data-text-theme="dark"] {
    --ss-slide-title-color: #0a0a0b;
    --ss-slide-text-color: rgba(10, 10, 11, 0.78);
  }

  /* CTA wrapper: a block that fills the flex-column width so the inherited
     text-align (physical: left/center/right) determines where the inline-flex
     CTA actually sits. Using a wrapper lets us stick with physical alignment
     even in RTL without fighting flex's logical align-self keyword. */
  .ss-cta-wrap {
    width: 100%;
    margin-top: 0.6rem;
  }
  .ss-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.7rem 1.5rem;
    background: var(--ss-cta-bg);
    color: var(--ss-cta-color);
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    transition: transform 0.25s var(--ss-ease),
      box-shadow 0.25s var(--ss-ease);
    box-shadow: 0 12px 24px -14px rgba(0, 0, 0, 0.5);
  }
  .ss-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px -14px rgba(0, 0, 0, 0.55);
  }
  .ss-cta svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ss-cta:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* Corner badge */
  .ss-badge {
    position: absolute;
    top: clamp(0.85rem, 2vw, 1.25rem);
    inset-inline-start: clamp(0.85rem, 2vw, 1.25rem);
    z-index: 3;
    background: var(--ss-badge-bg);
    color: var(--ss-badge-color);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.55);
  }
  .ss-badge:dir(rtl) {
    letter-spacing: 0;
    text-transform: none;
  }

  /* ===========================================================
     ENTRANCE ANIMATION on the active slide's content stack
     =========================================================== */
  .ss-slide[data-pos="active"] .ss-content-inner > * {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
    transition: opacity 0.8s var(--ss-ease),
      transform 0.8s var(--ss-ease), filter 0.6s var(--ss-ease);
  }
  .ss-slide[data-pos="active"] .ss-content-inner > *:nth-child(1) {
    transition-delay: 0.18s;
  }
  .ss-slide[data-pos="active"] .ss-content-inner > *:nth-child(2) {
    transition-delay: 0.30s;
  }
  .ss-slide[data-pos="active"] .ss-content-inner > *:nth-child(3) {
    transition-delay: 0.42s;
  }
  .ss-slide[data-pos="active"] .ss-content-inner > *:nth-child(4) {
    transition-delay: 0.54s;
  }
  .ss-slide:not([data-pos="active"]) .ss-content-inner > * {
    opacity: 0;
    transform: translateY(18px);
    filter: blur(4px);
    transition: none;
  }

  /* When the merchant disables entrance, snap text in instantly per slide. */
  .ss-section[data-anim-entrance="off"] .ss-slide[data-pos="active"] .ss-content-inner > * {
    transition-duration: 0s;
    transition-delay: 0s;
  }

  /* ===========================================================
     TRANSITION VARIANTS — control how the active/prev/next slides move
     =========================================================== */

  /* --- fade (default) --- */
  .ss-section[data-transition="fade"] .ss-slide {
    transform: scale(1);
  }

  /* --- slide (cover / "slide-over") ---
     The incoming slide slides OVER the outgoing one, which stays in place
     underneath. Because the leaving slide keeps covering the full frame, the
     frame's black background never shows through the gap.
       • leaving — the outgoing slide: stays at translateX(0), lower z-index,
         no movement. It simply sits there until the transition ends.
       • active  — the incoming slide: slides in from the leading edge at a
         higher z-index, covering the leaving slide.
       • bystander prev/next — pre-position off-screen instantly & invisibly
         (transition:none) so they never sweep across the screen.
  */

  /* Bystanders: pre-position off-screen, but no transition → instant invisible snap.
     The :not([data-leaving]) guard on EVERY transform rule (incl. the RTL ones,
     which have higher specificity) is essential — without it the leaving slide
     would be shoved off-screen in RTL and expose the black frame behind it. */
  .ss-section[data-transition="slide"] .ss-slide[data-pos="prev"]:not([data-leaving="true"]),
  .ss-section[data-transition="slide"] .ss-slide[data-pos="next"]:not([data-leaving="true"]) {
    transition: none;
  }
  .ss-section[data-transition="slide"] .ss-slide[data-pos="prev"]:not([data-leaving="true"]) {
    transform: translateX(-100%);
  }
  .ss-section[data-transition="slide"] .ss-slide[data-pos="next"]:not([data-leaving="true"]) {
    transform: translateX(100%);
  }
  .ss-section[data-transition="slide"]:dir(rtl) .ss-slide[data-pos="prev"]:not([data-leaving="true"]) {
    transform: translateX(100%);
  }
  .ss-section[data-transition="slide"]:dir(rtl) .ss-slide[data-pos="next"]:not([data-leaving="true"]) {
    transform: translateX(-100%);
  }

  /* Leaving slide: stays in place, full frame, underneath the incoming slide.
     Excluded from all prev/next transforms above, so nothing pushes it off-screen. */
  .ss-section[data-transition="slide"] .ss-slide[data-leaving="true"] {
    transform: translateX(0);
    opacity: 1;
    visibility: visible;
    z-index: 1;
    transition: none;
  }

  /* Active slide: enters via CSS animation (keyframes define the start position
     so the animation always begins from off-screen regardless of prior state).
     z-index 2 (from the base active rule) keeps it above the leaving slide. */
  .ss-section[data-transition="slide"][data-dir="forward"] .ss-slide[data-pos="active"] {
    animation: ss-slide-from-right var(--ss-dur) var(--ss-ease) both;
  }
  .ss-section[data-transition="slide"][data-dir="backward"] .ss-slide[data-pos="active"] {
    animation: ss-slide-from-left var(--ss-dur) var(--ss-ease) both;
  }
  .ss-section[data-transition="slide"][data-dir="forward"]:dir(rtl) .ss-slide[data-pos="active"] {
    animation: ss-slide-from-left var(--ss-dur) var(--ss-ease) both;
  }
  .ss-section[data-transition="slide"][data-dir="backward"]:dir(rtl) .ss-slide[data-pos="active"] {
    animation: ss-slide-from-right var(--ss-dur) var(--ss-ease) both;
  }
  /* No entrance animation on the initial render */
  .ss-section[data-transition="slide"][data-dir="initial"] .ss-slide[data-pos="active"] {
    animation: none;
  }

  @keyframes ss-slide-from-right {
    from { transform: translateX(100%); opacity: 1; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes ss-slide-from-left {
    from { transform: translateX(-100%); opacity: 1; }
    to   { transform: translateX(0);     opacity: 1; }
  }

  /* --- kenburns: slow zoom on the active media + crossfade --- */
  .ss-section[data-transition="kenburns"] .ss-slide[data-pos="active"] .ss-media img,
  .ss-section[data-transition="kenburns"] .ss-slide[data-pos="active"] .ss-media video {
    animation: ss-kenburns 14s var(--ss-ease) both;
  }
  @keyframes ss-kenburns {
    0% {
      transform: scale(1.04) translate3d(0, 0, 0);
    }
    100% {
      transform: scale(1.16) translate3d(-2%, -1.5%, 0);
    }
  }

  /* --- zoom: incoming slide scales in from 1.08, prev scales out to 0.96 --- */
  .ss-section[data-transition="zoom"] .ss-slide[data-pos="prev"],
  .ss-section[data-transition="zoom"] .ss-slide[data-pos="next"] {
    transform: scale(1.08);
  }
  .ss-section[data-transition="zoom"] .ss-slide[data-pos="active"] {
    transform: scale(1);
  }

  /* --- parallax: both slides cross-fade; the media drifts at a different
       speed than the text, giving a parallax sense of depth.

       The media is overscaled (1.26) so it overflows the frame by ~13% on each
       side — comfortably more than the 10% horizontal drift. This guarantees a
       shifted media never exposes the black frame edge behind it. Without the
       overscale, translating a frame-width image leaves a gap of equal width on
       the opposite side, which read as a black flash. --- */
  .ss-section[data-transition="parallax"] .ss-slide[data-pos="prev"],
  .ss-section[data-transition="parallax"] .ss-slide[data-pos="next"] {
    /* Keep visible during transition so the parallax shift is seen. */
    visibility: visible;
  }
  .ss-section[data-transition="parallax"] .ss-slide .ss-media {
    transform: scale(1.26);
    transition: transform var(--ss-dur) var(--ss-ease);
  }
  .ss-section[data-transition="parallax"] .ss-slide[data-pos="prev"] .ss-media {
    transform: translateX(-10%) scale(1.26);
  }
  .ss-section[data-transition="parallax"] .ss-slide[data-pos="next"] .ss-media {
    transform: translateX(10%) scale(1.26);
  }
  .ss-section[data-transition="parallax"]:dir(rtl) .ss-slide[data-pos="prev"] .ss-media {
    transform: translateX(10%) scale(1.26);
  }
  .ss-section[data-transition="parallax"]:dir(rtl) .ss-slide[data-pos="next"] .ss-media {
    transform: translateX(-10%) scale(1.26);
  }
  .ss-section[data-transition="parallax"] .ss-slide[data-pos="active"] .ss-media {
    transform: translateX(0) scale(1.26);
  }

  /* --- reveal: clip-path wipe from leading edge --- */
  .ss-section[data-transition="reveal"] .ss-slide[data-pos="prev"]:not([data-leaving="true"]),
  .ss-section[data-transition="reveal"] .ss-slide[data-pos="next"]:not([data-leaving="true"]) {
    transition: none;
  }
  .ss-section[data-transition="reveal"] .ss-slide[data-leaving="true"] {
    opacity: 1;
    visibility: visible;
    z-index: 3;
    transition: clip-path var(--ss-dur) var(--ss-ease), opacity 0s, visibility 0s;
  }
  .ss-section[data-transition="reveal"][data-dir="forward"] .ss-slide[data-leaving="true"] {
    clip-path: inset(0 100% 0 0);
  }
  .ss-section[data-transition="reveal"][data-dir="backward"] .ss-slide[data-leaving="true"] {
    clip-path: inset(0 0 0 100%);
  }
  .ss-section[data-transition="reveal"][data-dir="forward"]:dir(rtl) .ss-slide[data-leaving="true"] {
    clip-path: inset(0 0 0 100%);
  }
  .ss-section[data-transition="reveal"][data-dir="backward"]:dir(rtl) .ss-slide[data-leaving="true"] {
    clip-path: inset(0 100% 0 0);
  }
  .ss-section[data-transition="reveal"] .ss-slide[data-pos="active"] {
    clip-path: inset(0 0 0 0);
    transition: clip-path var(--ss-dur) var(--ss-ease),
      opacity var(--ss-dur) var(--ss-ease);
  }
  .ss-section[data-transition="reveal"][data-dir="initial"] .ss-slide[data-pos="active"] {
    transition: none;
  }

  /* --- stack: cards stack and slide off --- */
  .ss-section[data-transition="stack"] .ss-slide[data-pos="prev"]:not([data-leaving="true"]),
  .ss-section[data-transition="stack"] .ss-slide[data-pos="next"]:not([data-leaving="true"]) {
    transition: none;
    opacity: 0;
  }
  .ss-section[data-transition="stack"] .ss-slide[data-leaving="true"] {
    opacity: 1;
    visibility: visible;
    z-index: 3;
    transition: transform var(--ss-dur) var(--ss-ease),
      opacity var(--ss-dur) var(--ss-ease), visibility 0s;
  }
  .ss-section[data-transition="stack"][data-dir="forward"] .ss-slide[data-leaving="true"] {
    transform: translateX(-25%) scale(0.92);
    opacity: 0;
  }
  .ss-section[data-transition="stack"][data-dir="backward"] .ss-slide[data-leaving="true"] {
    transform: translateX(25%) scale(0.92);
    opacity: 0;
  }
  .ss-section[data-transition="stack"][data-dir="forward"]:dir(rtl) .ss-slide[data-leaving="true"] {
    transform: translateX(25%) scale(0.92);
  }
  .ss-section[data-transition="stack"][data-dir="backward"]:dir(rtl) .ss-slide[data-leaving="true"] {
    transform: translateX(-25%) scale(0.92);
  }

  /* Idle Ken Burns toggle — drift the active media even when transition isn't kenburns */
  .ss-section[data-idle-kenburns="on"][data-transition]:not([data-transition="kenburns"])
    .ss-slide[data-pos="active"] .ss-media img,
  .ss-section[data-idle-kenburns="on"][data-transition]:not([data-transition="kenburns"])
    .ss-slide[data-pos="active"] .ss-media video {
    animation: ss-kenburns 20s var(--ss-ease) both;
  }

  /* Transition speed (controls the slide-change duration only — not the kenburns idle) */
  .ss-section[data-speed="fast"] { --ss-dur: var(--ss-dur-fast); }
  .ss-section[data-speed="slow"] { --ss-dur: var(--ss-dur-slow); }

  /* ===========================================================
     CONTROLS — inside-bottom strip (default for fraction pagination)
     =========================================================== */
  .ss-controls-inside {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(0.75rem, 3vw, 1.5rem);
    padding: clamp(0.9rem, 2.5vw, 1.6rem) clamp(1rem, 3vw, 2rem);
    pointer-events: none; /* let clicks pass to elements that opt-in */
  }
  .ss-controls-inside > * {
    pointer-events: auto;
  }
  /* Empty spacer takes 0 width so flexible elements can absorb the leftover. */
  .ss-controls-inside .ss-spacer {
    pointer-events: none;
    flex: 0 0 auto;
  }
  /* When alignment is left / right and no inside-bottom arrows are present,
     push the pagination to that PHYSICAL edge. The :dir(rtl) flips keep "left"
     on the visible left and "right" on the visible right in both directions —
     flex-start/flex-end alone would mirror the choice under RTL. */
  .ss-controls-inside[data-pag-align="left"] {
    justify-content: flex-start;
  }
  .ss-controls-inside[data-pag-align="right"] {
    justify-content: flex-end;
  }
  .ss-controls-inside[data-pag-align="left"]:dir(rtl) {
    justify-content: flex-end;
  }
  .ss-controls-inside[data-pag-align="right"]:dir(rtl) {
    justify-content: flex-start;
  }
  .ss-controls-inside[data-pag-align="left"] .ss-spacer,
  .ss-controls-inside[data-pag-align="right"] .ss-spacer {
    display: none;
  }

  /* ===========================================================
     ARROWS — five variants
     =========================================================== */
  .ss-arrow {
    appearance: none;
    border: none;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ss-arrow-icon);
    transition: transform 0.25s var(--ss-ease),
      background 0.25s var(--ss-ease), color 0.25s var(--ss-ease),
      box-shadow 0.25s var(--ss-ease), border-color 0.25s var(--ss-ease);
    font: inherit;
    padding: 0;
    position: relative;
  }
  .ss-arrow:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .ss-arrow svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.25;
    stroke-linecap: round;
    stroke-linejoin: round;
    position: relative;
    z-index: 1;
  }

  /* Variant: circle (default) */
  .ss-arrow[data-arrow="circle"] {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--ss-arrow-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 12px 32px -16px rgba(0, 0, 0, 0.5);
  }
  .ss-arrow[data-arrow="circle"]:hover:not(:disabled) {
    background: var(--ss-arrow-bg-hover);
    transform: scale(1.06);
  }

  /* Variant: outline */
  .ss-arrow[data-arrow="outline"] {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 1.5px solid currentColor;
    background: transparent;
  }
  .ss-arrow[data-arrow="outline"]:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.06);
  }

  /* Variant: minimal */
  .ss-arrow[data-arrow="minimal"] {
    width: 40px;
    height: 40px;
  }
  .ss-arrow[data-arrow="minimal"] svg {
    width: 26px;
    height: 26px;
    stroke-width: 2;
  }
  .ss-arrow[data-arrow="minimal"]:hover:not(:disabled) {
    transform: scale(1.12);
  }

  /* Variant: bar (long thin underlined arrow) */
  .ss-arrow[data-arrow="bar"] {
    width: clamp(64px, 9vw, 96px);
    height: 36px;
    border-radius: 999px;
    border: 1.5px solid currentColor;
    background: transparent;
  }
  .ss-arrow[data-arrow="bar"]:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }
  .ss-arrow[data-arrow="bar"] svg {
    width: 28px;
    height: 14px;
    stroke-width: 1.5;
  }

  /* Variant: framed (squared with crisp border) */
  .ss-arrow[data-arrow="framed"] {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.24);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .ss-arrow[data-arrow="framed"]:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.45);
    transform: translateY(-1px);
  }

  /* Direction flip per arrow + RTL */
  .ss-arrow-prev svg {
    transform: rotate(180deg);
  }
  :host(:dir(rtl)) .ss-arrow-prev svg,
  .ss-section:dir(rtl) .ss-arrow-prev svg {
    transform: rotate(0deg);
  }
  :host(:dir(rtl)) .ss-arrow-next svg,
  .ss-section:dir(rtl) .ss-arrow-next svg {
    transform: rotate(180deg);
  }

  /* Side-anchored arrows */
  .ss-arrows-sides {
    position: absolute;
    inset-inline: clamp(0.75rem, 2.5vw, 1.5rem);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 5;
  }
  .ss-arrows-sides .ss-arrow {
    pointer-events: auto;
  }

  /* Below-the-frame arrows */
  .ss-arrows-outside {
    display: inline-flex;
    gap: 0.75rem;
  }

  /* ===========================================================
     AUTOPLAY PROGRESS BAR — top-of-frame countdown indicator
     -----------------------------------------------------------
     Two styles share the same DOM: "bar" (single thin bar) and
     "stories" (segmented — one per slide, Instagram-style).
     The animation runs purely in CSS and is keyed off the
     [data-state] attribute on each bar. When the active slide
     changes, the bar transitioning from "pending" → "active"
     gets a freshly-applied animation-name, which restarts the
     keyframes at t=0 by definition.
     =========================================================== */
  .ss-ap-bars {
    position: absolute;
    top: 0;
    inset-inline: 0;
    z-index: 6;
    display: flex;
    gap: 6px;
    /* Float just inside the top edge so the rounded frame corners never clip
       the bar — both styles read fully regardless of card_radius. */
    padding: clamp(10px, 1.6vw, 16px);
    pointer-events: none;
  }
  .ss-ap-bar {
    flex: 1 1 0;
    height: 4px;
    border-radius: 999px;
    /* Darker track so the bright fill always pops, even over light photos. */
    background: rgba(0, 0, 0, 0.28);
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    /* Subtle lift keeps the bar legible against busy imagery. */
    box-shadow: 0 1px 4px -1px rgba(0, 0, 0, 0.4);
  }
  /* On a light wash the dark imagery is gone — flip the track lighter. */
  .ss-frame[data-overlay="light-full"] .ss-ap-bar,
  .ss-frame[data-text-theme="dark"] .ss-ap-bar {
    background: rgba(0, 0, 0, 0.16);
    box-shadow: none;
  }

  .ss-ap-fill {
    display: block;
    position: absolute;
    inset: 0;
    background: var(--ss-pag-active, #ffffff);
    transform: scaleX(0);
    transform-origin: left center;
    animation-duration: var(--ss-ap-dur, 5s);
    animation-fill-mode: forwards;
    /* "Start slow, accelerate" curve — matches the editorial feel and gives
       the bar an unhurried first beat before catching up. */
    animation-timing-function: cubic-bezier(0.45, 0.05, 0.55, 0.95);
    will-change: transform;
  }
  /* RTL: the bar should grow from the right edge (the leading edge in
     Arabic), so it visibly sweeps right-to-left as the countdown elapses. */
  :host(:dir(rtl)) .ss-ap-fill,
  .ss-section:dir(rtl) .ss-ap-fill {
    transform-origin: right center;
  }
  .ss-frame[data-text-theme="dark"] .ss-ap-fill {
    background: #0a0a0b;
  }

  /* State machine:
     - pending: empty, no animation (upcoming slide)
     - active:  animating 0 → 1 over --ss-ap-dur
     - done:    filled, no animation (already played) */
  .ss-ap-bar[data-state="pending"] .ss-ap-fill {
    animation-name: none;
    transform: scaleX(0);
  }
  .ss-ap-bar[data-state="done"] .ss-ap-fill {
    animation-name: none;
    transform: scaleX(1);
  }
  .ss-ap-bar[data-state="active"] .ss-ap-fill {
    animation-name: ss-ap-fill;
  }
  /* Pause on hover / interaction / out-of-view — FREEZE the fill at its current
     progress (animation-play-state), never reset it to empty. Within an enabled
     bar, "not running" always means "paused", so freezing is the only correct
     behaviour; resetting would wipe the visitor's sense of how much time is left. */
  .ss-ap-bars[data-paused="true"] .ss-ap-bar[data-state="active"] .ss-ap-fill {
    animation-play-state: paused;
  }

  @keyframes ss-ap-fill {
    from {
      transform: scaleX(0);
    }
    to {
      transform: scaleX(1);
    }
  }

  /* ===========================================================
     PAGINATION — five styles
     =========================================================== */
  .ss-pagination {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ss-pag-color);
    user-select: none;
    line-height: 1;
  }

  /* --- fraction (signature: "02 / 04") --- */
  .ss-pag-fraction {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    font-weight: 500;
  }
  .ss-pag-fraction .ss-pag-current {
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    color: var(--ss-pag-active);
    font-weight: 600;
    min-width: 2.2ch;
    text-align: end;
    transition: color 0.4s var(--ss-ease);
  }
  .ss-pag-fraction .ss-pag-sep {
    font-size: clamp(1rem, 2vw, 1.35rem);
    margin: 0 4px;
    opacity: 0.7;
  }
  .ss-pag-fraction .ss-pag-total {
    font-size: clamp(1rem, 2vw, 1.35rem);
    opacity: 0.75;
  }

  /* --- lines (Apple-style) --- */
  .ss-pag-lines {
    gap: 10px;
  }
  .ss-pag-lines button {
    appearance: none;
    border: none;
    background: var(--ss-pag-color);
    width: clamp(20px, 4vw, 32px);
    height: 2.5px;
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
    transition: background 0.3s var(--ss-ease),
      width 0.3s var(--ss-ease), opacity 0.3s var(--ss-ease);
    opacity: 0.55;
  }
  .ss-pag-lines button[aria-current="true"] {
    background: var(--ss-pag-active);
    width: clamp(34px, 6vw, 56px);
    opacity: 1;
  }
  .ss-pag-lines button:hover {
    opacity: 0.9;
  }

  /* --- numbers (1·2·3·4 chips) --- */
  .ss-pag-numbers {
    gap: 8px;
  }
  .ss-pag-numbers button {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: var(--ss-pag-color);
    min-width: 36px;
    height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    font: inherit;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.25s var(--ss-ease),
      color 0.25s var(--ss-ease), border-color 0.25s var(--ss-ease);
  }
  .ss-pag-numbers button:hover {
    border-color: currentColor;
  }
  .ss-pag-numbers button[aria-current="true"] {
    background: var(--ss-pag-active);
    color: var(--ss-cta-color);
    border-color: var(--ss-pag-active);
  }

  /* --- progress (single thin bar at the bottom of the frame) --- */
  .ss-pag-progress {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.18);
    z-index: 5;
  }
  .ss-pag-progress::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    inset-inline-start: 0;
    width: var(--ss-pag-progress, 0%);
    background: var(--ss-pag-active);
    transition: width 0.6s var(--ss-ease);
  }

  /* --- thumbnails strip --- */
  .ss-pag-thumbs {
    display: flex;
    gap: 10px;
    padding: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    max-width: 100%;
  }
  .ss-pag-thumbs::-webkit-scrollbar {
    display: none;
  }
  /* Below the frame: a centered row. */
  .ss-pag-thumbs[data-inside="false"] {
    margin-top: clamp(0.8rem, 2vw, 1.25rem);
    justify-content: center;
  }
  /* Inside the frame: overlaid at the bottom edge, aligned to the chosen side.
     Physical left/right (with :dir(rtl) flips) so the choice isn't mirrored in RTL. */
  .ss-pag-thumbs[data-inside="true"] {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 5;
    padding: clamp(0.9rem, 2.5vw, 1.6rem) clamp(1rem, 3vw, 2rem);
    /* The strip spans the full width at the bottom; without this its empty
       areas would swallow clicks meant for the arrows beneath it. Only the
       thumbnail buttons should be interactive (matches .ss-controls-inside). */
    pointer-events: none;
  }
  .ss-pag-thumbs[data-inside="true"] button {
    pointer-events: auto;
  }
  .ss-pag-thumbs[data-inside="true"][data-align="center"] {
    justify-content: center;
  }
  .ss-pag-thumbs[data-inside="true"][data-align="left"] {
    justify-content: flex-start;
  }
  .ss-pag-thumbs[data-inside="true"][data-align="right"] {
    justify-content: flex-end;
  }
  .ss-pag-thumbs[data-inside="true"][data-align="left"]:dir(rtl) {
    justify-content: flex-end;
  }
  .ss-pag-thumbs[data-inside="true"][data-align="right"]:dir(rtl) {
    justify-content: flex-start;
  }
  .ss-pag-thumbs button {
    appearance: none;
    border: 2px solid transparent;
    background: transparent;
    padding: 0;
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
    width: clamp(64px, 8vw, 96px);
    aspect-ratio: 4 / 3;
    flex-shrink: 0;
    opacity: 0.55;
    transition: opacity 0.3s var(--ss-ease),
      transform 0.3s var(--ss-ease), border-color 0.3s var(--ss-ease);
  }
  .ss-pag-thumbs button img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ss-pag-thumbs button:hover {
    opacity: 0.85;
  }
  .ss-pag-thumbs button[aria-current="true"] {
    opacity: 1;
    border-color: var(--ss-pag-active);
    transform: scale(1.03);
  }

  /* ===========================================================
     OUTSIDE controls bar (when pagination_position = outside-below)
     =========================================================== */
  .ss-controls-outside {
    width: 100%;
    max-width: var(--ss-max-width);
    margin-top: clamp(1rem, 2vw, 1.5rem);
    display: flex;
    align-items: center;
    gap: 1rem;
    color: var(--ss-title-color);
  }
  /* Both pagination + arrows present → push them to opposite ends.
     Only one present → center it under the frame. */
  .ss-controls-outside[data-layout="split"] {
    justify-content: space-between;
  }
  .ss-controls-outside[data-layout="center"] {
    justify-content: center;
  }
  .ss-controls-outside .ss-pagination {
    color: var(--ss-title-color);
  }
  .ss-controls-outside .ss-arrow {
    color: var(--ss-title-color);
  }
  /* For outside controls the arrow ring uses the section title colour. */
  .ss-controls-outside .ss-arrow[data-arrow="circle"] {
    background: var(--ss-arrow-bg, rgba(0, 0, 0, 0.04));
    border-color: rgba(0, 0, 0, 0.06);
  }

  /* ===========================================================
     HEADER ENTRANCE — same fade+de-blur pattern as Collection
     =========================================================== */
  .ss-header > * {
    will-change: opacity, filter, transform;
  }
  .ss-header[data-anim="ready"] > * {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(8px);
  }
  .ss-header[data-anim="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.9s var(--ss-ease),
      filter 0.8s var(--ss-ease), transform 0.9s var(--ss-ease);
  }
  .ss-header[data-anim="in"] > *:nth-child(1) {
    transition-delay: 0.08s;
  }
  .ss-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.26s;
  }

  /* ===========================================================
     EMPTY STATE
     =========================================================== */
  .ss-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #888;
  }

  /* ===========================================================
     REDUCED MOTION
     =========================================================== */
  @media (prefers-reduced-motion: reduce) {
    .ss-slide,
    .ss-media img,
    .ss-media video,
    .ss-content-inner > *,
    .ss-arrow,
    .ss-pag-progress::after,
    .ss-pag-lines button,
    .ss-ap-fill,
    .ss-cta {
      transition: none !important;
      animation: none !important;
    }
    .ss-header[data-anim] > * {
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: none !important;
    }
  }

  /* ===========================================================
     MOBILE TUNING
     =========================================================== */
  @media (max-width: 640px) {
    .ss-arrow[data-arrow="circle"],
    .ss-arrow[data-arrow="outline"],
    .ss-arrow[data-arrow="framed"] {
      width: 44px;
      height: 44px;
    }
    .ss-arrow[data-arrow="circle"] svg,
    .ss-arrow[data-arrow="outline"] svg,
    .ss-arrow[data-arrow="framed"] svg {
      width: 18px;
      height: 18px;
    }
    .ss-arrow[data-arrow="bar"] {
      width: 60px;
    }
    .ss-pag-fraction .ss-pag-current {
      font-size: 1.6rem;
    }
    .ss-content {
      padding: 1.25rem;
    }
  }
`;
var dt = Object.defineProperty, w = (p, t, s, e) => {
  for (var a = void 0, i = p.length - 1, n; i >= 0; i--)
    (n = p[i]) && (a = n(t, s, a) || a);
  return a && dt(t, s, a), a;
};
const D = class D extends ot {
  constructor() {
    super(...arguments), this._activeIndex = 0, this._lastDir = "initial", this._leavingIndex = null, this._animState = "ready", this._inView = !0, this._autoplayTimer = null, this._autoplayStartedAt = 0, this._autoplayElapsed = 0, this._leaveTimer = null, this._interactionPaused = !1, this._hasInitializedActive = !1, this._io = null, this._swipeStartX = null, this._swipeStartY = null, this._swipeActive = !1, this._onKeydown = (t) => {
      var n;
      if (((n = this.config) == null ? void 0 : n.enable_keyboard) === !1 || this._slides().length <= 1) return;
      const s = this.renderRoot, e = s.activeElement || document.activeElement;
      if (!(this.contains(e) || s && s.contains(e))) return;
      const i = getComputedStyle(this).direction === "rtl";
      if (t.key === "ArrowLeft")
        i ? this._goNext() : this._goPrev();
      else if (t.key === "ArrowRight")
        i ? this._goPrev() : this._goNext();
      else
        return;
      t.preventDefault();
    }, this._aria = {
      prev: () => this._isEnglish() ? "Previous slide" : "الشريحة السابقة",
      next: () => this._isEnglish() ? "Next slide" : "الشريحة التالية",
      slide: (t) => this._isEnglish() ? `Slide ${t}` : `الشريحة ${t}`
    }, this._goPrev = () => {
      var a;
      const t = this._slides().length;
      if (t <= 1) return;
      const s = ((a = this.config) == null ? void 0 : a.loop) !== !1;
      let e = this._activeIndex - 1;
      e < 0 && (e = s ? t - 1 : 0), e !== this._activeIndex && (this._setLeaving(), this._activeIndex = e, this._lastDir = "backward", this._resetAutoplayCountdown());
    }, this._goNext = () => {
      var a;
      const t = this._slides().length;
      if (t <= 1) return;
      const s = ((a = this.config) == null ? void 0 : a.loop) !== !1;
      let e = this._activeIndex + 1;
      e >= t && (e = s ? 0 : t - 1), e !== this._activeIndex && (this._setLeaving(), this._activeIndex = e, this._lastDir = "forward", this._resetAutoplayCountdown());
    }, this._goTo = (t) => {
      const s = this._slides().length;
      t < 0 || t >= s || t !== this._activeIndex && (this._lastDir = t > this._activeIndex ? "forward" : "backward", this._setLeaving(), this._activeIndex = t, this._resetAutoplayCountdown());
    }, this._onPointerDown = (t) => {
      var s;
      this._slides().length <= 1 || (t.pointerType === "touch" && this._pauseForInteraction(), ((s = this.config) == null ? void 0 : s.enable_drag) !== !1 && (this._swipeStartX = t.clientX, this._swipeStartY = t.clientY, this._swipeActive = !1));
    }, this._onPointerMove = (t) => {
      if (this._swipeStartX === null) return;
      const s = t.clientX - this._swipeStartX, e = t.clientY - (this._swipeStartY ?? t.clientY);
      !this._swipeActive && Math.abs(s) > 10 && Math.abs(s) > Math.abs(e) && (this._swipeActive = !0);
    }, this._onPointerUp = (t) => {
      if (this._swipeStartX !== null) {
        const s = t.clientX - this._swipeStartX;
        this._swipeActive && Math.abs(s) > 40 && ((getComputedStyle(this).direction === "rtl" ? s > 0 : s < 0) ? this._goNext() : this._goPrev()), this._swipeStartX = null, this._swipeStartY = null, window.setTimeout(() => {
          this._swipeActive = !1;
        }, 50);
      }
      t.pointerType === "touch" && this._resumeFromInteraction();
    }, this._onHoverIn = () => this._pauseForInteraction(), this._onHoverOut = () => this._resumeFromInteraction();
  }
  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  _isEnglish() {
    return (document.documentElement.lang || "ar").toLowerCase().startsWith("en");
  }
  /** Zero-pad to 2 digits — "02" / "10" / "04". */
  _pad2(t) {
    return t < 10 ? `0${t}` : String(t);
  }
  /** Drop slides that have no usable media so we never render a blank frame. */
  _slides() {
    var s;
    const t = (s = this.config) == null ? void 0 : s.slides;
    return Array.isArray(t) ? t.filter((e) => !e || typeof e != "object" ? !1 : !!(e.image || e.image_desktop || e.video || e.link)) : [];
  }
  // ------------------------------------------------------------
  // Link resolution
  //
  // `slide.link` is a Salla `variable-list` field: the platform resolves the
  // picked target (product / category / page / brand / blog / external URL) to
  // a final URL string server-side. We still parse defensively because the
  // value can arrive as a bare string, a `{ url | value }` object, or a
  // single-item array wrapping either — and we treat "" / "#" as "no link".
  // ------------------------------------------------------------
  _resolveLink(t) {
    const s = t.link;
    if (!s) return "";
    const e = Array.isArray(s) ? s[0] : s;
    if (!e) return "";
    const i = (typeof e == "string" ? e : typeof e == "object" ? String(
      e.url ?? e.value ?? ""
    ) : "").trim();
    return i && i !== "#" ? i : "";
  }
  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------
  connectedCallback() {
    var e;
    super.connectedCallback();
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches, s = ((e = this.config) == null ? void 0 : e.enable_entrance_anim) === !1;
    t || s ? this._animState = "in" : requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this._animState = "in";
      });
    }), "IntersectionObserver" in window && (this._io = new IntersectionObserver(
      (a) => {
        const i = a[0];
        i && (this._inView = i.isIntersecting);
      },
      { threshold: 0.15 }
    ), this._io.observe(this)), document.addEventListener("keydown", this._onKeydown);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), this._teardownAutoplay(), this._leaveTimer && (clearTimeout(this._leaveTimer), this._leaveTimer = null), (t = this._io) == null || t.disconnect(), this._io = null, document.removeEventListener("keydown", this._onKeydown);
  }
  willUpdate(t) {
    var e;
    if (!t.has("config")) {
      this._teardownAutoplay(), this._setupAutoplay();
      return;
    }
    const s = this._slides();
    if (!this._hasInitializedActive && s.length > 0) {
      const a = this._num((e = this.config) == null ? void 0 : e.initial_slide, NaN), i = Number.isNaN(a) ? 0 : Math.max(0, Math.min(s.length - 1, Math.round(a) - 1));
      this._activeIndex = i, this._hasInitializedActive = !0;
    } else this._activeIndex >= s.length && (this._activeIndex = Math.max(0, s.length - 1));
    this._teardownAutoplay(), this._setupAutoplay();
  }
  // ------------------------------------------------------------
  // Autoplay
  // ------------------------------------------------------------
  _setupAutoplay() {
    const t = this.config || {};
    if (!t.autoplay || this._slides().length < 2 || t.pause_out_of_view !== !1 && !this._inView || this._interactionPaused && t.pause_on_interaction !== !1) return;
    const s = Math.max(1e3, this._num(t.autoplay_delay, 5) * 1e3), e = Math.max(0, s - this._autoplayElapsed);
    this._autoplayStartedAt = Date.now(), this._autoplayTimer = window.setTimeout(() => {
      this._autoplayTimer = null, this._goNext();
    }, e);
  }
  _teardownAutoplay() {
    this._autoplayTimer && (clearTimeout(this._autoplayTimer), this._autoplayTimer = null), this._autoplayStartedAt && (this._autoplayElapsed += Date.now() - this._autoplayStartedAt, this._autoplayStartedAt = 0);
  }
  /** Restart the autoplay countdown from a clean slate. Clears BOTH the elapsed
      accumulator AND the start timestamp — the latter is essential: without it,
      the very next `_teardownAutoplay` (which willUpdate fires on the state change
      that triggered this reset) would add the just-finished timer's full duration
      back onto elapsed, making the next interval ~0ms and causing a double-advance. */
  _resetAutoplayCountdown() {
    this._autoplayElapsed = 0, this._autoplayStartedAt = 0;
  }
  // ------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------
  /** Returns the current transition duration in ms — keeps the leave timer in sync. */
  _getTransitionDurMs() {
    var s;
    const t = this._pickValue(
      (s = this.config) == null ? void 0 : s.transition_speed,
      "normal"
    );
    return t === "fast" ? 500 : t === "slow" ? 1300 : 900;
  }
  /** Marks the current slide as "leaving" and schedules clearing that flag after
      the transition completes. This lets CSS distinguish the outgoing slide from
      bystander slides that merely need to reposition (invisibly). */
  _setLeaving() {
    this._leavingIndex = this._activeIndex, this._leaveTimer && clearTimeout(this._leaveTimer), this._leaveTimer = window.setTimeout(() => {
      this._leavingIndex = null, this._leaveTimer = null;
    }, this._getTransitionDurMs() + 80);
  }
  _isPrevDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === 0 || this._slides().length <= 1;
  }
  _isNextDisabled() {
    var t;
    return ((t = this.config) == null ? void 0 : t.loop) !== !1 ? !1 : this._activeIndex === this._slides().length - 1 || this._slides().length <= 1;
  }
  /** Compute data-pos for each slide index. */
  _slidePos(t) {
    var n;
    const s = this._slides().length;
    if (s === 0) return "hidden";
    if (t === this._activeIndex) return "active";
    const e = ((n = this.config) == null ? void 0 : n.loop) !== !1, a = e ? (this._activeIndex - 1 + s) % s : this._activeIndex - 1, i = e ? (this._activeIndex + 1) % s : this._activeIndex + 1;
    return s === 2 ? this._lastDir === "forward" ? "prev" : "next" : t === a ? "prev" : t === i ? "next" : "hidden";
  }
  // ------------------------------------------------------------
  // Pointer + hover
  // ------------------------------------------------------------
  /** Pause autoplay while the visitor is engaged. Shared by hover (mouse) and
      press (touch). No-op when the merchant disabled `pause_on_interaction`. */
  _pauseForInteraction() {
    var t;
    ((t = this.config) == null ? void 0 : t.pause_on_interaction) !== !1 && (this._interactionPaused || (this._interactionPaused = !0, this._teardownAutoplay(), this.requestUpdate()));
  }
  /** Resume autoplay once the visitor disengages (mouse leaves / touch ends). */
  _resumeFromInteraction() {
    var t;
    ((t = this.config) == null ? void 0 : t.pause_on_interaction) !== !1 && this._interactionPaused && (this._interactionPaused = !1, this._setupAutoplay(), this.requestUpdate());
  }
  // ------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------
  /** Builds the inline `style` attribute on the host with all custom-property overrides. */
  _buildHostStyle(t) {
    const s = this._num(t.card_radius, 20), e = this._pickValue(
      t.aspect_ratio_mobile,
      "4/5"
    ), a = this._pickValue(
      t.aspect_ratio_desktop,
      "16/9"
    ), i = this._num(t.max_width, 1280), n = (() => {
      const l = this._pickValue(
        t.overlay_intensity,
        "medium"
      );
      return l === "subtle" ? 0.35 : l === "strong" ? 0.85 : 0.6;
    })();
    return [
      t.bg_color ? `--ss-bg: ${t.bg_color}` : "",
      t.title_color ? `--ss-title-color: ${t.title_color}` : "",
      t.subtitle_color ? `--ss-subtitle-color: ${t.subtitle_color}` : "",
      t.slide_title_color ? `--ss-slide-title-color: ${t.slide_title_color}` : "",
      t.slide_text_color ? `--ss-slide-text-color: ${t.slide_text_color}` : "",
      t.arrow_bg ? `--ss-arrow-bg: ${t.arrow_bg}` : "",
      t.arrow_icon_color ? `--ss-arrow-icon: ${t.arrow_icon_color}` : "",
      t.pagination_color ? `--ss-pag-color: ${t.pagination_color}` : "",
      t.pagination_active_color ? `--ss-pag-active: ${t.pagination_active_color}` : "",
      t.cta_bg ? `--ss-cta-bg: ${t.cta_bg}` : "",
      t.cta_color ? `--ss-cta-color: ${t.cta_color}` : "",
      t.badge_bg ? `--ss-badge-bg: ${t.badge_bg}` : "",
      t.badge_color ? `--ss-badge-color: ${t.badge_color}` : "",
      `--ss-radius: ${s}px`,
      `--ss-aspect-mobile: ${e}`,
      `--ss-aspect-desktop: ${a === "inherit" ? e : a}`,
      `--ss-max-width: ${i}px`,
      `--ss-overlay-a: ${n}`
    ].filter(Boolean).join("; ");
  }
  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  render() {
    const t = this.config || {}, s = this._slides(), e = this._pickValue(t.transition, "fade"), a = this._pickValue(
      t.transition_speed,
      "normal"
    ), i = this._pickValue(
      t.arrow_style,
      "circle"
    ), n = this._pickValue(
      t.arrow_position,
      "sides"
    ), d = this._pickValue(
      t.pagination_style,
      "fraction"
    ), l = this._pickValue(
      t.pagination_position,
      "inside-bottom-center"
    ), f = this._pickValue(
      t.content_position,
      "bottom-left"
    ), W = this._pickValue(
      t.overlay_style,
      "dark-bottom"
    ), U = this._pickValue(t.text_theme, "light"), x = t.show_arrows !== !1, H = t.enable_idle_ken_burns === !0, L = t.enable_entrance_anim !== !1, K = t.full_width !== !1, j = this._buildHostStyle(t), A = this.localizedString(t.section_title), T = this.localizedString(t.section_subtitle), q = this.localizedString(t.default_cta_label) || "تسوّق الآن";
    if (s.length === 0)
      return r`
        <section class="ss-section" style=${j}>
          <p class="ss-empty">أضف صورة واحدة على الأقل لكل شريحة للبدء.</p>
        </section>
      `;
    const g = s.length === 1, k = s.length, S = this._activeIndex + 1, I = S / k * 100, M = (t.pagination_separator || "/").toString(), _ = l.startsWith("inside-bottom"), z = n === "inside-bottom", X = !g && (_ && d !== "none" && d !== "thumbnails" && d !== "progress" || z), G = Math.max(1, this._num(t.autoplay_delay, 5)), E = this._pickValue(
      t.autoplay_progress,
      "none"
    ), O = E !== "none" && t.autoplay === !0 && !g, Z = t.pause_out_of_view !== !1 && !this._inView, J = O && (this._interactionPaused || this._swipeActive || Z), v = "m9 6 6 6-6 6", Q = "M5 12h14M13 6l6 6-6 6", b = "M2 7h22M16 1l8 6-8 6";
    return r`
      <section
        class="ss-section"
        style=${j}
        data-transition=${e}
        data-speed=${a}
        data-text-theme=${U}
        data-anim-entrance=${L ? "on" : "off"}
        data-idle-kenburns=${H ? "on" : "off"}
        data-full-width=${K ? "true" : "false"}
        data-dir=${this._lastDir}
      >
        ${A || T ? r`
              <header
                class="ss-header"
                data-anim=${L ? this._animState : "in"}
              >
                ${A ? r`<h2 class="ss-section-title">${A}</h2>` : o}
                ${T ? r`<p class="ss-section-subtitle">${T}</p>` : o}
              </header>
            ` : o}

        <div
          class="ss-frame"
          data-arrow-position=${n}
          data-content-position=${f}
          data-overlay=${W}
          data-has-bottom-strip=${X ? "true" : "false"}
          @mouseenter=${this._onHoverIn}
          @mouseleave=${this._onHoverOut}
          @pointerdown=${this._onPointerDown}
          @pointermove=${this._onPointerMove}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerUp}
          tabindex="0"
        >
          <!-- Top-of-frame autoplay progress (countdown of the active slide).
               "stories" splits into N segments; "bar" is a single sweep.
               The single-bar variant is wrapped in keyed() so a fresh DOM
               node is created on each slide change — that's what restarts
               the CSS animation from t=0 every cycle. -->
          ${O ? r`
                <div
                  class="ss-ap-bars"
                  data-style=${E}
                  data-paused=${J ? "true" : "false"}
                  style=${`--ss-ap-dur: ${G}s`}
                  aria-hidden="true"
                >
                  ${E === "stories" ? s.map((c, h) => {
      const m = h < this._activeIndex ? "done" : h === this._activeIndex ? "active" : "pending";
      return r`
                          <div class="ss-ap-bar" data-state=${m}>
                            <span class="ss-ap-fill"></span>
                          </div>
                        `;
    }) : rt(
      this._activeIndex,
      r`
                          <div class="ss-ap-bar" data-state="active">
                            <span class="ss-ap-fill"></span>
                          </div>
                        `
    )}
                </div>
              ` : o}

          <div class="ss-track">
            ${s.map((c, h) => {
      const m = this._slidePos(h), $ = c.image || "", P = c.image_desktop || $, N = this.localizedString(c.title), tt = N || `slide ${h + 1}`, V = this.localizedString(
        c.description
      ), Y = this.localizedString(c.eyebrow), B = this.localizedString(c.badge), C = this._resolveLink(c), R = this.localizedString(c.cta_label) || (C ? q : ""), st = c.text_color ? `--ss-slide-title-color: ${c.text_color}; --ss-slide-text-color: ${c.text_color};` : "";
      return r`
                <div
                  class="ss-slide"
                  data-pos=${m}
                  data-leaving=${h === this._leavingIndex ? "true" : "false"}
                  data-index=${h}
                  style=${st}
                  role="group"
                  aria-roledescription="slide"
                  aria-label=${`${h + 1} / ${k}`}
                >
                  <div class="ss-media">
                    ${c.video ? r`
                          <video
                            src=${c.video}
                            poster=${$ || o}
                            autoplay
                            loop
                            .muted=${!0}
                            muted
                            playsinline
                            preload="auto"
                          ></video>
                        ` : r`
                          <picture>
                            ${P && P !== $ ? r`<source
                                  media="(min-width: 768px)"
                                  srcset=${P}
                                />` : o}
                            <img
                              src=${$}
                              alt=${tt}
                              loading=${h === 0 ? "eager" : "lazy"}
                              decoding="async"
                              draggable="false"
                            />
                          </picture>
                        `}
                  </div>
                  <div class="ss-scrim"></div>
                  ${B ? r`<span class="ss-badge">${B}</span>` : o}
                  <div class="ss-content">
                    <div class="ss-content-inner">
                      ${Y ? r`<p class="ss-eyebrow">${Y}</p>` : o}
                      ${N ? r`<h3 class="ss-title">${N}</h3>` : o}
                      ${V ? r`<p class="ss-desc">${V}</p>` : o}
                      ${C && R ? r`
                            <div class="ss-cta-wrap">
                              <a
                                class="ss-cta"
                                href=${C}
                                aria-label=${R}
                              >
                                <span>${R}</span>
                                <svg viewBox="0 0 24 24">
                                  <path d=${Q} />
                                </svg>
                              </a>
                            </div>
                          ` : o}
                    </div>
                  </div>
                </div>
              `;
    })}
          </div>

          <!-- Side-anchored arrows (when not clustered with pagination) -->
          ${!g && x && n === "sides" ? r`
                <div class="ss-arrows-sides">
                  ${this._renderArrow("prev", i, v, b)}
                  ${this._renderArrow("next", i, v, b)}
                </div>
              ` : o}

          <!-- Inside-bottom strip: arrows + fraction/lines/numbers pagination.
               data-pag-align controls which slot the pagination sits in when
               there are no inside-bottom arrows; when arrows ARE inside-bottom
               we always use the prev / pag / next space-between layout. -->
          ${X ? r`
                <div
                  class="ss-controls-inside"
                  data-pag-align=${l.replace(
      "inside-bottom-",
      ""
    )}
                >
                  ${x && z ? this._renderArrow("prev", i, v, b) : r`<span class="ss-spacer"></span>`}
                  ${_ ? this._renderPagination(
      d,
      s,
      S,
      k,
      I,
      M
    ) : r`<span class="ss-spacer"></span>`}
                  ${x && z ? this._renderArrow("next", i, v, b) : r`<span class="ss-spacer"></span>`}
                </div>
              ` : o}

          <!-- Inline thin progress bar across the frame -->
          ${!g && d === "progress" && _ ? r`
                <div
                  class="ss-pag-progress"
                  style=${`--ss-pag-progress: ${I}%`}
                ></div>
              ` : o}

          <!-- Thumbnails INSIDE the frame (when an inside-bottom position is chosen) -->
          ${!g && d === "thumbnails" && _ ? this._renderThumbs(
      s,
      !0,
      l.replace("inside-bottom-", "")
    ) : o}
        </div>

        <!-- Thumbnails BELOW the frame (only when outside-below is chosen) -->
        ${!g && d === "thumbnails" && !_ ? this._renderThumbs(s, !1, "center") : o}

        <!-- Outside-below controls bar: pagination and/or arrows under the frame -->
        ${(() => {
      const h = l === "outside-below" && (d === "fraction" || d === "lines" || d === "numbers"), m = x && n === "outside-below";
      return g || !h && !m ? o : r`
            <div
              class="ss-controls-outside"
              data-layout=${h && m ? "split" : "center"}
            >
              ${h ? this._renderPagination(
        d,
        s,
        S,
        k,
        I,
        M
      ) : o}
              ${m ? r`
                    <div class="ss-arrows-outside">
                      ${this._renderArrow("prev", i, v, b)}
                      ${this._renderArrow("next", i, v, b)}
                    </div>
                  ` : o}
            </div>
          `;
    })()}
      </section>
    `;
  }
  /** Thumbnails strip. `inside` overlays it at the frame bottom (aligned
      left/center/right); otherwise it renders as a centered row below the frame. */
  _renderThumbs(t, s, e) {
    return r`
      <div
        class="ss-pag-thumbs"
        role="tablist"
        data-inside=${s ? "true" : "false"}
        data-align=${e}
      >
        ${t.map(
      (a, i) => r`
            <button
              type="button"
              aria-current=${this._activeIndex === i ? "true" : "false"}
              aria-label=${this._aria.slide(i + 1)}
              @click=${() => this._goTo(i)}
            >
              <img
                src=${a.image || a.image_desktop || ""}
                alt=""
                loading="lazy"
              />
            </button>
          `
    )}
      </div>
    `;
  }
  // ------------------------------------------------------------
  // Render helpers — arrows + pagination
  // ------------------------------------------------------------
  _renderArrow(t, s, e, a) {
    const i = t === "prev" ? this._goPrev : this._goNext, n = t === "prev" ? this._isPrevDisabled() : this._isNextDisabled(), d = `ss-arrow ss-arrow-${t}`, l = s === "bar" ? a : e, f = s === "bar" ? "0 0 26 14" : "0 0 24 24";
    return r`
      <button
        type="button"
        class=${d}
        data-arrow=${s}
        ?disabled=${n}
        aria-label=${t === "prev" ? this._aria.prev() : this._aria.next()}
        @click=${i}
      >
        <svg viewBox=${f} aria-hidden="true">
          <path d=${l} />
        </svg>
      </button>
    `;
  }
  _renderPagination(t, s, e, a, i, n) {
    return t === "none" ? o : t === "progress" || t === "thumbnails" ? o : t === "fraction" ? r`
        <div class="ss-pagination ss-pag-fraction" role="status" aria-live="polite">
          <span class="ss-pag-current">${this._pad2(e)}</span>
          <span class="ss-pag-sep" aria-hidden="true">${n}</span>
          <span class="ss-pag-total">${this._pad2(a)}</span>
        </div>
      ` : t === "lines" ? r`
        <div class="ss-pagination ss-pag-lines" role="tablist">
          ${s.map(
      (d, l) => r`
              <button
                type="button"
                aria-current=${this._activeIndex === l ? "true" : "false"}
                aria-label=${this._aria.slide(l + 1)}
                @click=${() => this._goTo(l)}
              ></button>
            `
    )}
        </div>
      ` : t === "numbers" ? r`
        <div class="ss-pagination ss-pag-numbers" role="tablist">
          ${s.map(
      (d, l) => r`
              <button
                type="button"
                aria-current=${this._activeIndex === l ? "true" : "false"}
                @click=${() => this._goTo(l)}
              >
                ${this._pad2(l + 1)}
              </button>
            `
    )}
        </div>
      ` : o;
  }
};
D.styles = lt;
let u = D;
w([
  it({ type: Object })
], u.prototype, "config");
w([
  y()
], u.prototype, "_activeIndex");
w([
  y()
], u.prototype, "_lastDir");
w([
  y()
], u.prototype, "_leavingIndex");
w([
  y()
], u.prototype, "_animState");
w([
  y()
], u.prototype, "_inView");
typeof u < "u" && u.registerSallaComponent("salla-story-slider");
export {
  u as default
};
