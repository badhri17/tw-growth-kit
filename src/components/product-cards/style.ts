import { css } from "lit";

/**
 * Growth Kit — 3D Product Cards styles.
 *
 * A depth coverflow of full product cards: the active card is centered at full
 * size/opacity while neighbours shrink, recede (translateZ) and fade behind it.
 * The stage owns the perspective; side cards poke out past the (card-width)
 * track, which has `overflow: visible`. The section clips horizontally and the
 * host uses `container-type: inline-size` so nothing can blow out the Salla
 * page grid.
 *
 * Mobile-first, RTL-first. Colours come from CSS custom properties resolved in
 * the component with style-aware defaults (text flips light on the "bold" card);
 * the values here are only safety fallbacks. All cards are kept equal-height
 * (clamped title/description) so the measured stage height never jumps.
 */
export const productCardsStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Size containment: the host takes width from its container, never from its
       (overflowing) carousel contents — stops the Salla grid blow-out. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    --pc-bg: #fbeee0;
    --pc-accent: #f0712c;
    --pc-card-bg: #ffffff;
    --pc-card-radius: 22px;
    --pc-media-radius: 16px;
    --pc-title: #14181f;
    --pc-text: #5b6470;
    --pc-price: var(--pc-accent);
    --pc-compare: #9aa1ac;
    --pc-badge-bg: var(--pc-accent);
    --pc-badge-color: #ffffff;
    --pc-btn-bg: var(--pc-accent);
    --pc-btn-color: #ffffff;
    --pc-btn-radius: 999px;
    --pc-shipping: #8a93a0;
    --pc-nav-bg: #ffffff;
    --pc-nav-icon: #14181f;
    --pc-dot-color: var(--pc-accent);

    --pc-aspect: 1 / 1;
    --pc-img-fit: contain;
    --pc-card-w: 320px;
    --pc-stage-h: 460px;
    --pc-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ---------- Section ---------- */
  .pc {
    width: 100%;
    background: var(--pc-bg);
    padding: clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 1.75rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden; /* clips the peeking side cards to the section */
  }

  /* ---------- Header (title + subtitle + optional top nav) ---------- */
  .pc-head {
    width: 100%;
    max-width: 1100px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: clamp(1.5rem, 4vw, 2.75rem);
  }
  .pc-head__text {
    min-width: 0;
  }
  .pc-head-title {
    position: relative;
    display: inline-block;
    margin: 0;
    color: var(--pc-title);
    font-size: clamp(1.5rem, 4vw, 2.4rem);
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  /* Accent underline under the section title (the reference "Most loved" look). */
  .pc-head-title::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    bottom: -0.32em;
    width: 100%;
    height: 3px;
    border-radius: 3px;
    background: var(--pc-accent);
    opacity: 0.95;
  }
  .pc-head-sub {
    margin: 0.9rem 0 0;
    color: var(--pc-text);
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    line-height: 1.65;
    max-width: 52ch;
  }

  /* Top nav group (renders in the header row when nav_position = "top"). */
  .pc-nav-group {
    display: inline-flex;
    gap: 10px;
    flex: none;
  }

  /* ---------- Stage ---------- */
  .pc-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    display: flex;
    justify-content: center;
  }

  /* The 3D track: card-width, measured height, perspective owner. Side cards
     poke out past it (overflow visible). */
  .pc-track {
    position: relative;
    width: var(--pc-card-w);
    height: var(--pc-stage-h);
    margin-inline: auto;
    overflow: visible;
    perspective: 1700px;
    transform-style: preserve-3d;
    touch-action: pan-y; /* horizontal = swipe, vertical = page scroll */
  }

  /* ---------- Slide positioning (coverflow) ----------
     Each slide is the size of the track (= one card) and centres its card.
     One combined transform per resting slot glides + recedes + scales it. */
  .pc-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.62s var(--pc-ease), opacity 0.62s var(--pc-ease);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }
  /* A slide that wrapped across the loop snaps to its new side (no glide). */
  .pc-slide[data-instant] {
    transition: none;
  }

  .pc-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
    transform: translateX(0) translateZ(0) scale(1);
  }
  .pc-slide[data-pos="left"] {
    opacity: 0.5;
    z-index: 4;
    transform: translateX(-58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide[data-pos="right"] {
    opacity: 0.5;
    z-index: 4;
    transform: translateX(58%) translateZ(-130px) scale(0.84);
  }
  /* Side cards are clickable to bring them to center; their internals stay
     inert so a side card's button never fires — only the active card's does. */
  .pc-slide[data-pos="left"],
  .pc-slide[data-pos="right"] {
    pointer-events: auto;
    cursor: pointer;
  }
  .pc-slide:not([data-pos="active"]) .pc-card * {
    pointer-events: none;
  }
  .pc-slide[data-pos="far-left"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(-92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide[data-pos="far-right"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide[data-pos="hidden"] {
    opacity: 0;
    z-index: 1;
    transform: translateZ(-380px) scale(0.6);
  }

  /* RTL mirrors the arc: sides swap hands. */
  .pc-slide:dir(rtl)[data-pos="left"] {
    transform: translateX(58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide:dir(rtl)[data-pos="right"] {
    transform: translateX(-58%) translateZ(-130px) scale(0.84);
  }
  .pc-slide:dir(rtl)[data-pos="far-left"] {
    transform: translateX(92%) translateZ(-260px) scale(0.7);
  }
  .pc-slide:dir(rtl)[data-pos="far-right"] {
    transform: translateX(-92%) translateZ(-260px) scale(0.7);
  }

  /* ---------- Card (soft white surface is the single base look) ---------- */
  .pc-card {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    border-radius: var(--pc-card-radius);
    background: var(--pc-card-bg);
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 30px 60px -32px rgba(15, 23, 42, 0.4),
      0 8px 20px -16px rgba(15, 23, 42, 0.28);
  }
  .pc-slide[data-pos="active"] .pc-card {
    cursor: default;
  }

  /* ===== شكل المنتج: background — image fills the card, content over a scrim ===== */
  .pc-card[data-layout="background"] {
    aspect-ratio: var(--pc-aspect);
    background: transparent; /* the image is the surface (no corner bleed) */
  }
  .pc-card[data-layout="background"] .pc-media {
    position: absolute;
    inset: 0;
    aspect-ratio: auto;
    height: 100%;
    border-radius: var(--pc-card-radius);
  }
  .pc-card[data-layout="background"] .pc-img {
    border-radius: var(--pc-card-radius); /* rounds itself; nothing solid behind */
  }
  /* Glossy frosted overlay (matches Featured Product): the backdrop-filter
     blurs + saturates the image showing through, and the inset top sheen gives
     the glassy highlight along its leading edge. */
  .pc-card[data-layout="background"] .pc-body {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 2;
    flex: none;
    border-radius: 0 0 var(--pc-card-radius) var(--pc-card-radius);
    background: linear-gradient(
      to top,
      rgba(12, 15, 20, 0.86) 0%,
      rgba(12, 15, 20, 0.6) 62%,
      rgba(12, 15, 20, 0.32) 100%
    );
    -webkit-backdrop-filter: blur(16px) saturate(1.35);
    backdrop-filter: blur(16px) saturate(1.35);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }
  /* The card body's clamped min-heights are for equal in-flow cards; in the
     overlay they only add dead space, so let it hug the content. */
  .pc-card[data-layout="background"] .pc-title,
  .pc-card[data-layout="background"] .pc-desc {
    min-height: 0;
  }

  /* ---------- Media (product image) ---------- */
  .pc-media {
    position: relative;
    width: 100%;
    aspect-ratio: var(--pc-aspect);
    overflow: hidden;
    /* Round the top to the card radius (img is rounded too, below, so a
       composited layer in glass mode can't bleed a corner sliver). */
    border-top-left-radius: var(--pc-card-radius);
    border-top-right-radius: var(--pc-card-radius);
  }
  .pc-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--pc-img-fit);
    display: block;
    z-index: 1;
    user-select: none;
    -webkit-user-select: none;
    border-top-left-radius: var(--pc-card-radius);
    border-top-right-radius: var(--pc-card-radius);
  }

  /* ---------- Badge (corner pill) ---------- */
  .pc-badge {
    position: absolute;
    top: 12px;
    inset-inline-end: 12px;
    z-index: 3;
    padding: 6px 13px;
    border-radius: 999px;
    background: var(--pc-badge-bg);
    color: var(--pc-badge-color);
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    line-height: 1;
    box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.5);
    max-width: calc(100% - 24px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ---------- Body ---------- */
  .pc-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: clamp(1rem, 4.5%, 1.45rem);
    flex: 1 1 auto;
  }
  .pc-body[data-align="center"] {
    text-align: center;
  }
  .pc-body[data-align="center"] .pc-price-row {
    justify-content: center;
  }
  .pc-body[data-align="left"] {
    text-align: left;
  }
  .pc-body[data-align="left"] .pc-price-row {
    justify-content: flex-end;
  }

  .pc-title {
    margin: 0;
    color: var(--pc-title);
    font-size: clamp(1.05rem, 1.6vw, 1.2rem);
    font-weight: 700;
    line-height: 1.3;
    /* Reserve two lines so every card is the same height. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.6em;
  }

  .pc-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.55rem;
  }
  .pc-price {
    color: var(--pc-price);
    font-size: clamp(1.15rem, 2vw, 1.35rem);
    font-weight: 800;
    line-height: 1;
  }
  .pc-compare {
    color: var(--pc-compare);
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
  }

  .pc-desc {
    margin: 0;
    color: var(--pc-text);
    font-size: 0.92rem;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.95em;
  }

  /* ---------- Button ---------- */
  .pc-actions {
    margin-top: 0.55rem;
  }
  .pc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 13px 24px;
    border: none;
    border-radius: var(--pc-btn-radius);
    background: var(--pc-btn-bg);
    color: var(--pc-btn-color);
    font-family: inherit;
    font-size: 0.98rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 16px 30px -16px rgba(0, 0, 0, 0.5);
    transition: transform 0.25s var(--pc-ease), box-shadow 0.25s var(--pc-ease),
      opacity 0.2s var(--pc-ease);
  }
  .pc-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 38px -18px rgba(0, 0, 0, 0.6);
  }
  .pc-btn:active {
    transform: translateY(0);
  }
  .pc-btn[disabled] {
    opacity: 0.75;
    cursor: default;
    transform: none;
  }
  .pc-btn svg {
    width: 18px;
    height: 18px;
    flex: none;
  }
  .pc-btn__arrow {
    transition: transform 0.25s var(--pc-ease);
  }
  .pc-btn:dir(rtl) .pc-btn__arrow {
    transform: scaleX(-1);
  }
  .pc-btn:hover .pc-btn__arrow {
    transform: translateX(3px);
  }
  .pc-btn:dir(rtl):hover .pc-btn__arrow {
    transform: scaleX(-1) translateX(3px);
  }
  .pc-spinner {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: pc-spin 0.7s linear infinite;
  }
  @keyframes pc-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ---------- Free-shipping / returns fine print ---------- */
  .pc-shipping {
    margin: 0.7rem 0 0;
    text-align: center;
    color: var(--pc-shipping);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    line-height: 1.5;
  }

  /* ---------- Side navigation ---------- */
  .pc-nav {
    width: 46px;
    height: 46px;
    border: none;
    background: var(--pc-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: 0 8px 20px -8px rgba(0, 0, 0, 0.35);
    transition: transform 0.25s var(--pc-ease), box-shadow 0.25s var(--pc-ease),
      filter 0.25s var(--pc-ease), opacity 0.2s var(--pc-ease);
  }
  .pc-nav:hover {
    transform: scale(1.08);
    filter: brightness(1.03);
  }
  .pc-nav:active {
    transform: scale(1);
  }
  .pc-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .pc-nav svg {
    width: 20px;
    height: 20px;
    stroke: var(--pc-nav-icon);
    fill: none;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* Side variant: overlaid on the stage edges. */
  .pc-nav--side {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
  }
  .pc-nav--side:hover {
    transform: translateY(-50%) scale(1.08);
  }
  .pc-nav--side:disabled {
    transform: translateY(-50%);
  }
  .pc-nav--prev {
    inset-inline-start: clamp(0px, 2vw, 18px);
  }
  .pc-nav--next {
    inset-inline-end: clamp(0px, 2vw, 18px);
  }
  /* Chevron points the natural way per side + direction. */
  .pc-nav--prev svg {
    transform: rotate(180deg);
  }
  .pc-nav--prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .pc-nav--next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Pagination dots ---------- */
  .pc-dots {
    display: flex;
    gap: 9px;
    justify-content: center;
    margin-top: clamp(1.25rem, 3vw, 1.75rem);
  }
  .pc-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background: var(--pc-dot-color);
    opacity: 0.32;
    cursor: pointer;
    transition: opacity 0.25s var(--pc-ease), width 0.25s var(--pc-ease);
  }
  .pc-dot[aria-current="true"] {
    opacity: 1;
    width: 26px;
  }
  .pc-dot:hover {
    opacity: 0.6;
  }

  /* ---------- Entrance: stacked → spread ----------
     With entrance anim on, every slide starts collapsed at center (receded +
     faded), then releases to its resting coverflow slot. The selector below
     outranks the resting data-pos rules while "ready"; once "in" it stops
     matching and each slide's own transition animates the spread. */
  .pc[data-enter="ready"] .pc-track .pc-slide {
    transform: translateX(0) translateZ(-240px) scale(0.62);
    opacity: 0;
  }
  /* Header fade + de-blur. */
  .pc-head[data-enter] > * {
    will-change: opacity, filter, transform;
  }
  .pc-head[data-enter="ready"] > * {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(8px);
  }
  .pc-head[data-enter="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.85s var(--pc-ease), filter 0.8s var(--pc-ease),
      transform 0.85s var(--pc-ease);
  }

  /* ---------- Empty state ---------- */
  .pc-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #8a8a8a;
    background: var(--pc-bg);
  }

  /* ---------- Desktop enhancements (≥ 768px) ---------- */
  @media (min-width: 768px) {
    .pc-track {
      width: var(--pc-card-w-desk, var(--pc-card-w));
    }
    .pc-nav {
      width: 50px;
      height: 50px;
    }
  }

  /* ---------- Reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    /* The component forces data-enter="in" under reduced motion, so the slides
       already render at their resting positions — just drop the transitions. */
    .pc-slide,
    .pc-btn,
    .pc-nav,
    .pc-dot {
      transition: none !important;
    }
    .pc-head[data-enter] > * {
      opacity: 1 !important;
      filter: none !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;
