import { css } from "lit";

/**
 * Growth Kit — Interactive Product styles.
 *
 * Mobile-first, RTL-first. The mobile layout is the base rule (image on top,
 * detail card below); desktop enhancements (side-by-side row, sticky card) live
 * inside `@media (min-width: 768px)`.
 *
 * Colours are driven by CSS custom properties resolved in the component. A base
 * palette is selected with `[data-theme]`; any explicit merchant colour overrides
 * the corresponding variable inline.
 *
 * Hotspot alignment: markers are absolutely positioned inside `.ip-stage`, which
 * hugs the product image's natural box (the `<img>` is `display:block;
 * width:100%; height:auto`). `left`/`top` are physical properties, so a hotspot
 * at `left:23%` always sits 23% from the image's left edge regardless of the
 * page's RTL/LTR direction.
 */
export const interactiveProductStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: the host takes its width from its container, never from
       its contents — so the image/card row can't force an ancestor grid item
       (e.g. Salla's component card) wider than the viewport. Height still grows
       with content. See the grid-blowout note in the bundle. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    /* --- Light palette (default) --- */
    --ip-bg: #f5f5f5;
    --ip-title: #14181f;
    --ip-subtitle: #5b6573;
    --ip-accent: #d95e16;
    --ip-card-bg: #ffffff;
    --ip-card-border: rgba(20, 24, 31, 0.08);
    --ip-card-shadow: 0 18px 50px rgba(20, 24, 31, 0.08);
    --ip-card-title: #14181f;
    --ip-card-text: #5b6573;
    --ip-marker-bg: rgba(255, 255, 255, 0.92);
    --ip-marker-text: var(--ip-accent);
    --ip-stage-shadow: none;

    --ip-pad-x: clamp(1rem, 4vw, 2.5rem);
    --ip-radius: 20px;
    --ip-detail-aspect: 4 / 3;
    --ip-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ============================================================
     THEME: dark
     ============================================================ */
  .ip[data-theme="dark"] {
    --ip-bg: #0b0b0c;
    --ip-title: #f5f5f5;
    --ip-subtitle: #a0a6ad;
    --ip-card-bg: #161618;
    --ip-card-border: rgba(255, 255, 255, 0.08);
    --ip-card-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
    --ip-card-title: #f5f5f5;
    --ip-card-text: #a0a6ad;
    --ip-marker-bg: rgba(10, 10, 12, 0.72);
    --ip-marker-text: #ffffff;
    --ip-stage-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  }

  /* ============================================================
     SECTION + HEADER
     ============================================================ */
  .ip {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: var(--ip-bg);
    color: var(--ip-title);
    padding: clamp(2.25rem, 6vw, 3.75rem) var(--ip-pad-x);
    overflow: hidden;
  }

  .ip-header {
    max-width: 720px;
    margin: 0 auto clamp(1.75rem, 4vw, 2.75rem);
    text-align: center;
  }

  .ip-eyebrow {
    margin: 0 0 0.5rem;
    color: var(--ip-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .ip-title {
    position: relative;
    display: inline-block;
    margin: 0;
    color: var(--ip-title);
    font-size: clamp(1.5rem, 4.5vw, 2.4rem);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .ip-title::after {
    content: "";
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 76px;
    height: 3px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--ip-accent),
      transparent
    );
  }

  .ip-subtitle {
    margin: 1.35rem auto 0;
    max-width: 540px;
    color: var(--ip-subtitle);
    font-size: clamp(0.95rem, 2vw, 1.08rem);
    line-height: 1.7;
  }

  .ip-empty {
    margin: 0;
    text-align: center;
    color: var(--ip-subtitle);
    padding: 3rem 1rem;
    font-size: 0.98rem;
  }

  /* ============================================================
     CONTENT LAYOUT (mobile: stacked → desktop: row)
     ============================================================ */
  .ip-content {
    display: flex;
    flex-direction: column;
    /* Mobile: keep the detail card hugging the image so its top sits in view
       right under the photo — no scrolling needed after tapping a marker. */
    gap: 0.85rem;
    max-width: 1280px;
    margin-inline: auto;
    align-items: stretch;
  }

  @media (min-width: 768px) {
    .ip-content {
      flex-direction: row;
      align-items: flex-start;
      gap: clamp(2rem, 4vw, 3.5rem);
    }
    .ip-content[data-reverse="on"] {
      flex-direction: row-reverse;
    }
  }

  /* ============================================================
     STAGE (image + hotspots)
     ============================================================ */
  .ip-stage-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .ip-stage-wrap {
      flex: 1.25;
      min-width: 0;
    }
  }

  .ip-stage {
    position: relative;
    width: 100%;
    max-width: 820px;
    border-radius: var(--ip-radius);
    /* The marker diameter; bumped on desktop + by the size tier below. */
    --ip-hs: 34px;
    box-shadow: var(--ip-stage-shadow);
    line-height: 0; /* kill descender gap under the inline image */
  }

  .ip[data-hs="small"] .ip-stage {
    --ip-hs: 28px;
  }
  .ip[data-hs="large"] .ip-stage {
    --ip-hs: 40px;
  }
  @media (min-width: 768px) {
    .ip-stage {
      --ip-hs: 40px;
    }
    .ip[data-hs="small"] .ip-stage {
      --ip-hs: 34px;
    }
    .ip[data-hs="large"] .ip-stage {
      --ip-hs: 48px;
    }
  }

  .ip-img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--ip-radius);
    user-select: none;
    -webkit-user-drag: none;
  }

  .ip-stage-empty {
    aspect-ratio: 4 / 3;
    border: 2px dashed var(--ip-card-border);
    border-radius: var(--ip-radius);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ip-subtitle);
    font-size: 0.9rem;
    line-height: 1.5;
    text-align: center;
    padding: 1rem;
  }

  /* --- Hotspot marker --- */
  .ip-hotspot {
    position: absolute;
    /* left/top set inline; physical props -> independent of RTL/LTR. */
    transform: translate(-50%, -50%);
    width: var(--ip-hs);
    height: var(--ip-hs);
    margin: 0;
    padding: 0;
    border-radius: 50%;
    border: 2px solid var(--ip-accent);
    background: var(--ip-marker-bg);
    color: var(--ip-marker-text);
    font: inherit;
    font-size: calc(var(--ip-hs) * 0.42);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2;
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
    transition: transform 0.25s var(--ip-ease), background 0.25s var(--ip-ease),
      color 0.25s var(--ip-ease), box-shadow 0.25s var(--ip-ease);
  }
  .ip-hotspot:hover {
    background: var(--ip-accent);
    color: #fff;
    transform: translate(-50%, -50%) scale(1.12);
    z-index: 3;
  }
  .ip-hotspot:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 35%, transparent);
  }
  .ip-hotspot[data-active="true"] {
    background: var(--ip-accent);
    color: #fff;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 22%, transparent),
      0 8px 22px color-mix(in srgb, var(--ip-accent) 45%, transparent);
    z-index: 4;
  }

  /* Pulsing ring around idle markers (opt-in). */
  .ip-hotspot::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    border: 2px solid var(--ip-accent);
    opacity: 0;
    pointer-events: none;
  }
  .ip[data-pulse="on"] .ip-hotspot:not([data-active="true"])::before {
    animation: ip-pulse 2.4s var(--ip-ease) infinite;
  }

  @keyframes ip-pulse {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    70% {
      opacity: 0;
    }
    100% {
      transform: scale(1.9);
      opacity: 0;
    }
  }

  /* ============================================================
     DETAIL CARD
     ============================================================ */
  .ip-details {
    width: 100%;
    background: var(--ip-card-bg);
    border: 1px solid var(--ip-card-border);
    border-radius: var(--ip-radius);
    box-shadow: var(--ip-card-shadow);
    padding: clamp(1.25rem, 4vw, 1.75rem);
  }

  @media (min-width: 768px) {
    .ip-details {
      flex: 0.85;
      max-width: 430px;
      position: sticky;
      top: 32px;
      align-self: flex-start;
      padding: clamp(1.5rem, 2.4vw, 2.25rem);
    }
  }

  .ip-detail-media {
    width: 100%;
    aspect-ratio: var(--ip-detail-aspect);
    margin-bottom: 1.25rem;
    border-radius: calc(var(--ip-radius) - 6px);
    overflow: hidden;
    background: color-mix(in srgb, var(--ip-card-text) 8%, transparent);
  }
  .ip-detail-media[data-aspect="natural"] {
    aspect-ratio: auto;
  }
  .ip-detail-media[data-aspect="natural"] .ip-detail-img {
    height: auto;
  }
  .ip-detail-media[data-empty="true"] {
    display: none;
  }

  .ip-detail-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ip-detail-title {
    margin: 0 0 0.7rem;
    color: var(--ip-card-title);
    font-size: clamp(1.15rem, 2.6vw, 1.45rem);
    font-weight: 700;
    line-height: 1.4;
  }

  .ip-detail-desc {
    margin: 0;
    color: var(--ip-card-text);
    font-size: clamp(0.95rem, 1.8vw, 1.02rem);
    line-height: 1.85;
  }

  /* Cross-fade replayed imperatively on selection change. */
  .ip-detail-img.is-enter,
  .ip-detail-title.is-enter,
  .ip-detail-desc.is-enter {
    animation: ip-detail-in 0.4s var(--ip-ease) both;
  }
  @keyframes ip-detail-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* --- Nav pills --- */
  .ip-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin-top: 1.5rem;
  }
  .ip-pill {
    width: 38px;
    height: 38px;
    margin: 0;
    padding: 0;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--ip-accent) 32%, transparent);
    background: transparent;
    color: var(--ip-card-text);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s var(--ip-ease), color 0.2s var(--ip-ease),
      border-color 0.2s var(--ip-ease);
  }
  .ip-pill:hover {
    border-color: var(--ip-accent);
    color: var(--ip-accent);
  }
  .ip-pill:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--ip-accent) 32%, transparent);
  }
  .ip-pill[data-active="true"] {
    background: var(--ip-accent);
    border-color: var(--ip-accent);
    color: #fff;
  }

  /* ============================================================
     ENTRANCE ANIMATION
     ============================================================ */
  .ip[data-enter] .ip-header,
  .ip[data-enter] .ip-stage-wrap,
  .ip[data-enter] .ip-details {
    transition: opacity 0.7s var(--ip-ease), transform 0.7s var(--ip-ease);
  }
  .ip[data-enter="ready"] .ip-header,
  .ip[data-enter="ready"] .ip-stage-wrap,
  .ip[data-enter="ready"] .ip-details {
    opacity: 0;
    transform: translateY(26px);
  }
  .ip[data-enter="in"] .ip-header,
  .ip[data-enter="in"] .ip-stage-wrap,
  .ip[data-enter="in"] .ip-details {
    opacity: 1;
    transform: translateY(0);
  }
  .ip[data-enter="in"] .ip-stage-wrap {
    transition-delay: 0.08s;
  }
  .ip[data-enter="in"] .ip-details {
    transition-delay: 0.16s;
  }

  /* Markers fade/pop in after the stage settles. */
  .ip[data-enter] .ip-hotspot {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4);
  }
  .ip[data-enter="in"] .ip-hotspot {
    animation: ip-hotspot-in 0.45s var(--ip-ease) forwards;
    animation-delay: var(--ip-hs-delay, 0.4s);
  }
  @keyframes ip-hotspot-in {
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* ============================================================
     REDUCED MOTION
     ============================================================ */
  @media (prefers-reduced-motion: reduce) {
    .ip[data-enter] .ip-header,
    .ip[data-enter] .ip-stage-wrap,
    .ip[data-enter] .ip-details,
    .ip[data-enter] .ip-hotspot {
      transition: none !important;
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .ip[data-enter] .ip-hotspot {
      transform: translate(-50%, -50%) !important;
    }
    .ip-hotspot::before {
      animation: none !important;
    }
    .ip-detail-img.is-enter,
    .ip-detail-title.is-enter,
    .ip-detail-desc.is-enter {
      animation: none !important;
    }
  }
`;
