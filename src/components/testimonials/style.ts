import { css } from "lit";

/**
 * Growth Kit — Testimonials styles.
 *
 * Mobile-first, RTL-first. Every layout is authored as a single-column mobile
 * base; desktop enhancements live inside `@media (min-width: 768px)`.
 *
 * Colours are driven by CSS custom properties resolved in the component; the
 * values below are premium light-theme fallbacks. Card shapes are selected with
 * `[data-style]`; arrangements with `[data-layout]`.
 */
export const testimonialsStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: the host's width is taken from its container, never from
       its contents. This is what stops the marquee's max-content track (or any
       wide layout) from forcing an ancestor grid/flex item — e.g. Salla's
       component card — wider than the viewport and pushing other sections away.
       Width-only containment; height still grows with content. */
    container-type: inline-size;
    min-width: 0;
    max-width: 100%;

    --t-bg: #f6f4f0;
    --t-title: #14181f;
    --t-subtitle: #5b6573;
    --t-card-bg: #ffffff;
    --t-border: rgba(20, 24, 31, 0.09);
    --t-name: #14181f;
    --t-meta: #8a93a0;
    --t-text: #3f4754;
    --t-star: #ff9f1c;
    --t-star-empty: rgba(20, 24, 31, 0.14);
    --t-accent: #e07a3e;
    --t-chip-bg: #f1f0ec;
    --t-chip-name: #14181f;
    --t-chip-price: #14181f;
    --t-chip-compare: #9aa1ac;

    --t-gap: clamp(12px, 2.6vw, 20px);
    --t-pad-x: clamp(1rem, 4vw, 2rem);
    --t-radius: 20px;
    --t-aspect: 4 / 5;
    --t-cols-mobile: 1;
    --t-cols-desktop: 3;
    --t-ease: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ============================================================
     SECTION + HEADER
     ============================================================ */
  .t-section {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    background: var(--t-bg);
    padding: clamp(2.5rem, 6vw, 4.5rem) var(--t-pad-x);
    overflow: hidden;
  }

  .t-header {
    max-width: 720px;
    margin: 0 auto clamp(1.75rem, 4vw, 2.75rem);
    text-align: center;
  }
  .t-eyebrow {
    margin: 0 0 0.5rem;
    color: var(--t-accent);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }
  .t-title {
    margin: 0;
    color: var(--t-title);
    font-size: clamp(1.5rem, 4vw, 2.3rem);
    font-weight: 800;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }
  .t-subtitle {
    margin: 0.7rem 0 0;
    color: var(--t-subtitle);
    font-size: clamp(0.95rem, 1.6vw, 1.08rem);
    line-height: 1.7;
  }
  .t-summary {
    margin-top: 1.1rem;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    justify-content: center;
  }
  .t-summary-num {
    color: var(--t-title);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1;
  }
  .t-summary .t-stars svg {
    width: 20px;
    height: 20px;
  }
  .t-summary-count {
    color: var(--t-meta);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .t-body-wrap {
    max-width: 1240px;
    margin-inline: auto;
    width: 100%;
  }

  .t-empty {
    text-align: center;
    color: var(--t-meta);
    padding: 3rem 1rem;
    margin: 0;
  }

  /* ============================================================
     STARS (two-layer clip → supports fractional ratings)
     ============================================================ */
  .t-stars {
    position: relative;
    display: inline-flex;
    direction: ltr; /* ratings always fill left→right */
    line-height: 0;
    order:-1;
  }
  .t-stars-bg,
  .t-stars-fg {
    display: inline-flex;
    gap: 2px;
  }
  .t-stars svg {
    width: 16px;
    height: 16px;
    display: block;
  }
  .t-stars-bg svg {
    fill: var(--t-star-empty);
  }
  .t-stars-fg-clip {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--t-star-pct, 100%);
    overflow: hidden;
    transition: width 0.9s var(--t-ease) 0.2s;
  }
  .t-stars-fg {
    width: max-content;
  }
  .t-stars-fg svg {
    fill: var(--t-star);
  }

  /* Compact numeric rating pill. */
  .t-rating {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  .t-rating-text {
    color: var(--t-meta);
    font-size: 0.82rem;
    font-weight: 700;
  }
  .t-rating--num {
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    background: rgba(255, 159, 28, 0.16);
    background: color-mix(in srgb, var(--t-star) 16%, transparent);
    border-radius: 999px;
    align-self: flex-start;
    font-weight: 800;
    color: var(--t-title);
    font-size: 0.92rem;
  }
  .t-rating--num .t-rating-star {
    width: 15px;
    height: 15px;
    fill: var(--t-star);
  }

  /* ============================================================
     CARD — base + shared pieces
     ============================================================ */
  .t-card {
    position: relative;
    height: 100%;
    background: var(--t-card-bg);
    border: 1px solid transparent;
    border-radius: var(--t-radius);
    box-shadow: 0 20px 44px -30px rgba(15, 23, 42, 0.45);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-align: start;
  }
  .t-card[data-style="quote"],
  .t-card[data-style="minimal"],
  .t-card[data-style="glass"] {
    padding: clamp(18px, 4vw, 26px);
    gap: 12px;
  }
  .t-card[data-style="minimal"] {
    box-shadow: none;
    border-color: var(--t-border);
  }
  .t-card[data-style="glass"] {
    background: rgba(255, 255, 255, 0.55);
    -webkit-backdrop-filter: blur(16px) saturate(1.3);
    backdrop-filter: blur(16px) saturate(1.3);
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 26px 60px -34px rgba(15, 23, 42, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  /* Quote text */
  .t-quote {
    margin: 0;
    color: var(--t-text);
    font-size: 0.98rem;
    line-height: 1.72;
  }
  .t-card[data-style="quote"] .t-quote,
  .t-card[data-style="bubble"] .t-quote {
    font-size: 1.06rem;
    line-height: 1.65;
  }

  /* Decorative quotation mark */
  .t-quote-mark {
    line-height: 0;
    color: var(--t-accent);
    opacity: 0.9;
  }
  .t-quote-mark svg {
    width: 34px;
    height: 34px;
  }

  /* Author block */
  .t-author {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .t-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex: none;
    background: var(--t-star-empty);
  }
  .t-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-author-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .t-name {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--t-name);
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.2;
  }
  .t-meta {
    color: var(--t-meta);
    font-size: 0.82rem;
  }

  /* Author / chip drop to the bottom for tidy equal-height cards */
  .t-card[data-style="quote"] .t-author,
  .t-card[data-style="minimal"] .t-author,
  .t-card[data-style="glass"] .t-author {
    margin-top: auto;
  }

  /* ============================================================
     CARD — modern (photo-led with overlaid name chip)
     ============================================================ */
  .t-card[data-style="modern"] {
    padding: 0;
    gap: 0;
  }
  .t-photo {
    position: relative;
    width: 100%;
    aspect-ratio: var(--t-aspect);
    overflow: hidden;
  }
  .t-photo > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-photo-chip {
    position: absolute;
    top: 12px;
    inset-inline-start: 12px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(18, 22, 28, 0.62);
    -webkit-backdrop-filter: blur(7px);
    backdrop-filter: blur(7px);
    color: #fff;
    font-weight: 600;
    font-size: 0.82rem;
    padding: 5px;
    padding-inline-end: 12px;
    border-radius: 999px;
  }
  .t-photo-chip-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.15);
  }
  .t-photo-chip-text {
    white-space: nowrap;
  }
  .t-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 11px;
    padding: 15px 16px 17px;
  }
  .t-body .t-chip {
    margin-top: auto;
  }

  /* ============================================================
     CARD — overlay (full-bleed photo + frosted-glass bottom panel)
     ============================================================ */
  .t-card[data-style="overlay"] {
    padding: 0;
    gap: 0;
    position: relative;
    aspect-ratio: var(--t-aspect);
    justify-content: flex-end;
    /* Solid fallback shows through when an item has no photo. */
    background: #14181f;
  }
  .t-card[data-style="overlay"][data-tone="light"] {
    background: #e9e7e2;
  }
  .t-overlay-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    z-index: 0;
  }
  /* The frosted panel: blurs the photo behind it (backdrop-filter) and lays a
     translucent veil on top, so the comment stays crisp while its backdrop softens.
     Structure is shared; the veil + text colours are tone-driven below. */
  .t-overlay-panel {
    position: relative;
    z-index: 1;
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: clamp(15px, 5%, 22px);
    border-radius: 0 0 var(--t-radius) var(--t-radius);
    -webkit-backdrop-filter: blur(16px) saturate(1.25);
    backdrop-filter: blur(16px) saturate(1.25);
  }
  /* Dark tone (default for any overlay that isn't explicitly light):
     dark veil + light-on-dark text. */
  .t-card[data-style="overlay"]:not([data-tone="light"]) .t-overlay-panel {
    background: linear-gradient(
      to top,
      rgba(15, 18, 22, 0.76),
      rgba(15, 18, 22, 0.46)
    );
    border-top: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
    --t-text: rgba(255, 255, 255, 0.92);
    --t-name: #ffffff;
    --t-meta: rgba(255, 255, 255, 0.72);
    --t-accent: rgba(255, 255, 255, 0.92);
  }
  .t-card[data-style="overlay"]:not([data-tone="light"]) .t-rating--num {
    color: #fff;
    background: rgba(255, 255, 255, 0.18);
  }
  /* Light tone: frosted white veil + dark text; quote mark keeps the brand accent. */
  .t-card[data-style="overlay"][data-tone="light"] .t-overlay-panel {
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.82),
      rgba(255, 255, 255, 0.52)
    );
    --t-text: #2c333d;
    --t-name: #14181f;
    --t-meta: #6b7480;
  }
  .t-card[data-style="overlay"][data-tone="light"] .t-rating--num {
    color: #14181f;
    background: rgba(20, 24, 31, 0.07);
  }
  .t-card[data-style="overlay"] .t-quote-mark {
    opacity: 0.85;
    text-align:end;
  }
  .t-card[data-style="overlay"] .t-quote-mark svg {
    width: 30px;
    height: 30px;
  }

  /* ============================================================
     CARD — bubble (speech bubble + tail, author below)
     ============================================================ */
  .t-card[data-style="bubble"] {
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
    gap: 14px;
  }
  .t-bubble {
    position: relative;
    background: var(--t-card-bg);
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius);
    padding: clamp(16px, 4vw, 22px);
    box-shadow: 0 20px 44px -32px rgba(15, 23, 42, 0.45);
    display: flex;
    flex-direction: column;
    gap: 11px;
  }
  .t-bubble::after {
    content: "";
    position: absolute;
    bottom: -8px;
    inset-inline-start: 28px;
    width: 16px;
    height: 16px;
    background: var(--t-card-bg);
    border-inline-end: 1px solid var(--t-border);
    border-bottom: 1px solid var(--t-border);
    transform: rotate(45deg);
  }
  .t-card[data-style="bubble"] .t-author {
    padding-inline-start: 6px;
  }

  /* ============================================================
     PRODUCT CHIP (shoppable)
     ============================================================ */
  .t-chip {
    display: flex;
    align-items: center;
    gap: 11px;
    text-decoration: none;
    background: var(--t-chip-bg);
    border-radius: 14px;
    padding: 9px 11px;
    color: inherit;
    transition: background 0.25s var(--t-ease), transform 0.25s var(--t-ease);
  }
  .t-chip[data-style="inline"] {
    background: transparent;
    padding: 6px 0 0;
    gap: 9px;
  }
  a.t-chip:hover {
    background: color-mix(in srgb, var(--t-chip-bg) 82%, #000);
  }
  a.t-chip[data-style="inline"]:hover {
    background: transparent;
    transform: translateX(0);
  }
  .t-chip-media {
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  }
  .t-chip[data-style="inline"] .t-chip-media {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }
  .t-chip-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .t-chip-body {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .t-chip-name {
    color: var(--t-chip-name);
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .t-chip-prices {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
  }
  .t-chip-price {
    color: var(--t-chip-price);
    font-weight: 800;
    font-size: 0.92rem;
  }
  .t-chip-compare {
    color: var(--t-chip-compare);
    font-size: 0.8rem;
    text-decoration: line-through;
  }
  .t-chip-go {
    flex: none;
    color: var(--t-meta);
    line-height: 0;
    align-self: center;
  }
  .t-chip-go svg {
    width: 18px;
    height: 18px;
  }
  .t-chip-go svg {
    transform: rotate(0deg);
  }
  .t-chip:dir(rtl) .t-chip-go svg {
    transform: rotate(180deg);
  }

  /* ============================================================
     LAYOUT — marquee
     ============================================================ */
  /* NOTE: do NOT set max-width:none here. The marquee track is width:max-content,
     so an uncapped body-wrap lets that ~6000px intrinsic width drive the min-content
     of an ancestor grid/flex item (e.g. Salla's component card) and blow out the
     whole page. The marquee stays inside the standard capped, centered body-wrap. */
  .t-marquee {
    display: flex;
    flex-direction: column;
    gap: clamp(14px, 2.5vw, 22px);
    min-width: 0;
    max-width: 100%;
  }
  .t-marquee-row {
    /* min-width:0 lets overflow:hidden actually clip the max-content track in a
       column-flex (cross-axis auto-min would otherwise expand to the track width). */
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      #000 6%,
      #000 94%,
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      #000 6%,
      #000 94%,
      transparent
    );
  }
  .t-marquee-track {
    display: flex;
    width: max-content;
    align-items: stretch;
    will-change: transform;
    /* LTR scrolls left (-50%); RTL scrolls right (+50%) so the row never empties.
       Spacing lives on the cells (margin-inline-end), NOT as flex gap, so the two
       identical halves tile to exactly 50% and the loop is seamless. */
    animation: t-marquee-ltr var(--t-marquee-dur, 40s) linear infinite;
  }
  .t-marquee-track:dir(rtl) {
    animation-name: t-marquee-rtl;
  }
  .t-marquee-row[data-dir="backward"] .t-marquee-track {
    animation-direction: reverse;
  }
  .t-marquee-row[data-pause="hover"]:hover .t-marquee-track {
    animation-play-state: paused;
  }
  .t-marquee-cell {
    flex: 0 0 auto;
    width: clamp(258px, 80vw, 320px);
    margin-inline-end: var(--t-gap);
  }
  @keyframes t-marquee-ltr {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  @keyframes t-marquee-rtl {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(50%);
    }
  }

  /* ============================================================
     LAYOUT — carousel (scroll-snap)
     ============================================================ */
  .t-carousel {
    position: relative;
  }
  .t-carousel-track {
    display: flex;
    gap: var(--t-gap);
    align-items: stretch;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-block: 6px;
  }
  .t-carousel-track::-webkit-scrollbar {
    display: none;
  }
  @media (pointer: fine) {
    .t-carousel-track {
      cursor: grab;
    }
    .t-carousel-track.is-grabbing {
      cursor: grabbing;
      scroll-snap-type: none;
      scroll-behavior: auto;
    }
  }
  .t-carousel-cell {
    flex: 0 0
      calc(
        (100% - (var(--t-cols-mobile) - 1) * var(--t-gap)) /
          var(--t-cols-mobile)
      );
    scroll-snap-align: start;
  }
  /* Mobile peek: never let a single card fill the whole width — hint there's more */
  @media (max-width: 767.98px) {
    .t-carousel-cell {
      flex-basis: min(
        86%,
        calc(
          (100% - (var(--t-cols-mobile) - 1) * var(--t-gap)) /
            var(--t-cols-mobile)
        )
      );
    }
  }

  .t-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 4;
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 50%;
    background: var(--t-title);
    color: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 10px 24px -10px rgba(0, 0, 0, 0.55);
    transition: transform 0.2s var(--t-ease), opacity 0.2s var(--t-ease);
  }
  .t-arrow:hover {
    transform: translateY(-50%) scale(1.07);
  }
  .t-arrow svg {
    width: 20px;
    height: 20px;
  }
  .t-arrow--prev {
    inset-inline-start: 4px;
  }
  .t-arrow--next {
    inset-inline-end: 4px;
  }
  /* Chevron points outward in the reading direction */
  .t-arrow--prev svg {
    transform: rotate(180deg);
  }
  .t-arrow--next svg {
    transform: rotate(0deg);
  }
  .t-arrow:dir(rtl).t-arrow--prev svg {
    transform: rotate(0deg);
  }
  .t-arrow:dir(rtl).t-arrow--next svg {
    transform: rotate(180deg);
  }

  .t-dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: clamp(16px, 3vw, 24px);
  }
  .t-dot {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--t-star-empty);
    cursor: pointer;
    transition: width 0.3s var(--t-ease), background 0.3s var(--t-ease);
  }
  .t-dot[aria-current="true"] {
    width: 22px;
    background: var(--t-accent);
  }

  /* ============================================================
     LAYOUT — grid + masonry
     ============================================================ */
  .t-grid[data-layout="grid"] {
    display: grid;
    grid-template-columns: repeat(var(--t-cols-mobile), minmax(0, 1fr));
    gap: var(--t-gap);
  }
  .t-grid[data-layout="masonry"] {
    column-count: var(--t-cols-mobile);
    column-gap: var(--t-gap);
  }
  .t-grid[data-layout="masonry"] .t-grid-cell {
    break-inside: avoid;
    margin-bottom: var(--t-gap);
  }
  .t-grid-cell {
    min-width: 0;
  }

  /* ============================================================
     ENTRANCE ANIMATIONS
     ============================================================ */
  /* Header */
  .t-header[data-anim="ready"] > * {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(6px);
  }
  .t-header[data-anim="in"] > * {
    opacity: 1;
    transform: none;
    filter: blur(0);
    transition: opacity 0.7s var(--t-ease), transform 0.7s var(--t-ease),
      filter 0.7s var(--t-ease);
  }
  .t-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.08s;
  }
  .t-header[data-anim="in"] > *:nth-child(3) {
    transition-delay: 0.16s;
  }
  .t-header[data-anim="in"] > *:nth-child(4) {
    transition-delay: 0.24s;
  }

  /* Cards (grid / masonry / carousel) */
  .t-section[data-anim="ready"] .t-grid-cell,
  .t-section[data-anim="ready"] .t-carousel-cell {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
  .t-section[data-anim="in"] .t-grid-cell,
  .t-section[data-anim="in"] .t-carousel-cell {
    opacity: 1;
    transform: none;
    transition: opacity 0.6s var(--t-ease), transform 0.7s var(--t-ease);
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(2),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(2) {
    transition-delay: 0.07s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(3),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(3) {
    transition-delay: 0.14s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(4),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(4) {
    transition-delay: 0.21s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(5),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(5) {
    transition-delay: 0.28s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(6),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(6) {
    transition-delay: 0.35s;
  }
  .t-section[data-anim="in"] .t-grid-cell:nth-child(n + 7),
  .t-section[data-anim="in"] .t-carousel-cell:nth-child(n + 7) {
    transition-delay: 0.4s;
  }

  /* Marquee fades in as a whole (cards are already in motion) */
  .t-section[data-anim="ready"] .t-marquee {
    opacity: 0;
  }
  .t-section[data-anim="in"] .t-marquee {
    opacity: 1;
    transition: opacity 0.8s var(--t-ease);
  }

  /* Star fill grows from 0 on entrance */
  .t-section[data-anim="ready"] .t-stars-fg-clip {
    width: 0;
  }

  /* ============================================================
     HOVER LIFT
     ============================================================ */
  .t-section[data-hover-lift="on"] .t-card {
    transition: transform 0.35s var(--t-ease), box-shadow 0.35s var(--t-ease);
  }
  @media (hover: hover) {
    .t-section[data-hover-lift="on"] .t-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 34px 64px -30px rgba(15, 23, 42, 0.5);
    }
    .t-section[data-hover-lift="on"] .t-card[data-style="modern"] .t-photo > img,
    .t-section[data-hover-lift="on"] .t-card[data-style="overlay"] .t-overlay-photo {
      transition: transform 0.7s var(--t-ease);
    }
    .t-section[data-hover-lift="on"]
      .t-card[data-style="modern"]:hover
      .t-photo
      > img,
    .t-section[data-hover-lift="on"]
      .t-card[data-style="overlay"]:hover
      .t-overlay-photo {
      transform: scale(1.05);
    }
  }

  /* ============================================================
     DESKTOP ENHANCEMENTS (≥ 768px)
     ============================================================ */
  @media (min-width: 768px) {
    .t-grid[data-layout="grid"] {
      grid-template-columns: repeat(var(--t-cols-desktop), minmax(0, 1fr));
    }
    .t-grid[data-layout="masonry"] {
      column-count: var(--t-cols-desktop);
    }
    .t-carousel-cell {
      flex-basis: calc(
        (100% - (var(--t-cols-desktop) - 1) * var(--t-gap)) /
          var(--t-cols-desktop)
      );
    }
    .t-marquee-cell {
      width: clamp(300px, 24vw, 360px);
    }
    .t-arrow {
      width: 46px;
      height: 46px;
    }
  }

  /* ============================================================
     REDUCED MOTION
     ============================================================ */
  @media (prefers-reduced-motion: reduce) {
    .t-marquee-track {
      animation: none !important;
    }
    .t-card,
    .t-photo > img,
    .t-overlay-photo,
    .t-grid-cell,
    .t-carousel-cell,
    .t-header > *,
    .t-stars-fg-clip,
    .t-chip,
    .t-arrow,
    .t-dot {
      transition: none !important;
      animation: none !important;
    }
    .t-section[data-anim] .t-grid-cell,
    .t-section[data-anim] .t-carousel-cell,
    .t-section[data-anim] .t-header > *,
    .t-section[data-anim] .t-marquee {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
    .t-stars-fg-clip {
      width: var(--t-star-pct, 100%) !important;
    }
    .t-carousel-track {
      scroll-behavior: auto;
    }
  }
`;
