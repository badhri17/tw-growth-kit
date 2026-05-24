import { css } from "lit";

export const beforeAfterStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Tunable CSS custom properties — themes/merchants can override at :root. */
    --ba-bg: #f5f5f5;
    --ba-title-color: #212529;
    --ba-text-color: #4b5563;
    --ba-card-radius: 20px;
    --ba-handle-bg: #ffffff;
    --ba-handle-icon: #000000;
    --ba-line-color: #ffffff;
    --ba-label-bg: rgba(255, 255, 255, 0.95);
    --ba-label-text: #333333;
    --ba-nav-bg: rgba(255, 255, 255, 0.95);
    --ba-nav-icon: #000000;
    --ba-chip-bg: rgba(255, 255, 255, 0.95);
    --ba-chip-color: #111111;
    --ba-aspect: 1 / 1;
    --ba-ease: cubic-bezier(0.4, 0, 0.2, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .ba-section {
    width: 100%;
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.5rem);
    background-color: var(--ba-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  /* --- Header --- */
  .ba-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: clamp(2rem, 5vw, 3.5rem);
  }
  .ba-title {
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 900;
    color: var(--ba-title-color);
    margin: 0 0 0.5rem;
    line-height: 1.15;
  }
  .ba-title:dir(rtl) {
    line-height: 1.3;
  }
  .ba-subtitle {
    font-size: clamp(0.95rem, 1.4vw, 1.125rem);
    color: var(--ba-text-color);
    line-height: 1.7;
    margin: 0;
    max-width: 60ch;
    margin-inline: auto;
  }

  /* --- Stage (positioning context for nav + track) --- */
  .ba-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    padding: 1rem 3.5rem;
  }
  @media (min-width: 1024px) {
    .ba-stage {
      max-width: 1000px;
      padding: 1rem 5rem;
    }
  }
  @media (max-width: 480px) {
    .ba-stage {
      padding: 0.5rem 2.5rem;
    }
  }

  /* --- Track holds slides absolutely; height comes from aspect ratio --- */
  .ba-track {
    position: relative;
    width: 100%;
    max-width: 550px;
    margin-inline: auto;
    aspect-ratio: var(--ba-aspect);
    overflow: visible;
  }

  /* --- Slide positioning model
     active   → centred, full scale, interactive
     prev/next→ peek at the sides on desktop (coverflow); hidden on mobile/single
     far      → fully hidden
  --- */
  .ba-slide {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* Snappy carousel default — used after the entrance has settled. */
    transition: transform 0.55s var(--ba-ease),
      opacity 0.4s var(--ba-ease), filter 0.35s var(--ba-ease);
    opacity: 0;
    pointer-events: none;
    filter: blur(0);
    will-change: transform, opacity, filter;
  }

  /* Slower, more cinematic timing during the first reveal (until [data-entered]). */
  .ba-section:not([data-entered]) .ba-slide {
    transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ba-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 3;
    transform: translateX(0) scale(1);
  }
  .ba-slide[data-pos="prev"] {
    transform: translateX(-105%) scale(0.95);
    opacity: 0;
  }
  .ba-slide[data-pos="next"] {
    transform: translateX(105%) scale(0.95);
    opacity: 0;
  }
  .ba-slide[data-pos="far"] {
    transform: translateX(0) scale(0.9);
    opacity: 0;
  }
  /* RTL flips horizontal direction of side slides. */
  .ba-slide:dir(rtl)[data-pos="prev"] {
    transform: translateX(105%) scale(0.95);
  }
  .ba-slide:dir(rtl)[data-pos="next"] {
    transform: translateX(-105%) scale(0.95);
  }

  /* Mobile / tablet peek: side slides poke in just enough to hint at the carousel.
     Smaller peek + tighter scale than desktop coverflow so the active slide
     stays visually dominant on a narrow viewport. */
  @media (max-width: 1023px) {
    .ba-slide[data-pos="prev"] {
      transform: translateX(-88%) scale(0.82);
      opacity: 0.45;
      z-index: 1;
    }
    .ba-slide[data-pos="next"] {
      transform: translateX(88%) scale(0.82);
      opacity: 0.45;
      z-index: 1;
    }
    .ba-slide:dir(rtl)[data-pos="prev"] {
      transform: translateX(88%) scale(0.82);
    }
    .ba-slide:dir(rtl)[data-pos="next"] {
      transform: translateX(-88%) scale(0.82);
    }
  }

  /* Coverflow on desktop: prev & next peek at the sides */
  @media (min-width: 1024px) {
    .ba-section[data-layout="coverflow"] .ba-slide[data-pos="prev"] {
      transform: translateX(-62%) scale(0.78);
      opacity: 0.6;
      z-index: 1;
    }
    .ba-section[data-layout="coverflow"] .ba-slide[data-pos="next"] {
      transform: translateX(62%) scale(0.78);
      opacity: 0.6;
      z-index: 1;
    }
    .ba-section[data-layout="coverflow"] .ba-slide:dir(rtl)[data-pos="prev"] {
      transform: translateX(62%) scale(0.78);
    }
    .ba-section[data-layout="coverflow"] .ba-slide:dir(rtl)[data-pos="next"] {
      transform: translateX(-62%) scale(0.78);
    }
  }

  /* --- ENTRANCE: stacked, blurred deck → breathe → spread to positions ---
     Override every position-based transform while data-entrance="enter".
     The slight rotation on prev/next sells the "deck of cards" feel.
  --- */
  .ba-section[data-entrance="enter"] .ba-slide,
  .ba-section[data-entrance="enter"] .ba-slide[data-pos],
  .ba-section[data-entrance="enter"][data-layout] .ba-slide[data-pos] {
    transform: translateY(28px) scale(0.86);
    opacity: 0;
    filter: blur(18px);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="prev"] {
    transform: translateY(34px) scale(0.82) rotate(-4deg);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="next"] {
    transform: translateY(34px) scale(0.82) rotate(4deg);
  }
  .ba-section[data-entrance="enter"] .ba-slide[data-pos="far"] {
    transform: translateY(40px) scale(0.78);
    filter: blur(24px);
  }

  /* Stagger active vs side slides as they spread out.
     Only applies during the very first reveal (before [data-entered]). */
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="active"] {
    transition-delay: 0.08s;
  }
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="prev"],
  .ba-section[data-entrance="ready"]:not([data-entered])
    .ba-slide[data-pos="next"] {
    transition-delay: 0.26s;
  }

  /* --- Comparison card --- */
  .ba-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--ba-card-radius);
    overflow: hidden;
    cursor: ew-resize;
    user-select: none;
    -webkit-user-select: none;
    background: #e5e7eb;
    box-shadow:
      0 24px 60px -28px rgba(0, 0, 0, 0.35),
      0 8px 20px -10px rgba(0, 0, 0, 0.18);
    --pos: 50%;
  }
  .ba-slide:not([data-pos="active"]) .ba-card {
    cursor: default;
    pointer-events: none;
  }

  .ba-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
  .ba-after {
    z-index: 1;
  }
  .ba-before {
    z-index: 2;
    clip-path: inset(0 calc(100% - var(--pos)) 0 0);
  }
  /* Mirror: before sits on the right portion */
  .ba-card[data-reverse] .ba-before {
    clip-path: inset(0 0 0 var(--pos));
  }

  /* --- Slider line + handle --- */
  .ba-slider-line {
    position: absolute;
    top: 0;
    left: var(--pos);
    transform: translateX(-50%);
    width: 4px;
    height: 100%;
    background: var(--ba-line-color);
    z-index: 3;
    pointer-events: none;
    transition: opacity 0.3s var(--ba-ease);
  }
  .ba-handle {
    position: absolute;
    top: 50%;
    left: var(--pos);
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: var(--ba-handle-bg);
    border-radius: 50%;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow:
      0 8px 24px -8px rgba(0, 0, 0, 0.4),
      0 2px 6px -2px rgba(0, 0, 0, 0.25);
    transition: opacity 0.3s var(--ba-ease);
  }
  .ba-handle::before,
  .ba-handle::after {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
  }
  .ba-handle::before {
    left: 14px;
    border-width: 10px 10px 10px 0;
    border-color: transparent var(--ba-handle-icon) transparent transparent;
  }
  .ba-handle::after {
    right: 14px;
    border-width: 10px 0 10px 10px;
    border-color: transparent transparent transparent var(--ba-handle-icon);
  }

  /* Hide the slider chrome on non-active slides */
  .ba-slide:not([data-pos="active"]) .ba-slider-line,
  .ba-slide:not([data-pos="active"]) .ba-handle {
    opacity: 0;
  }

  /* --- Labels --- */
  .ba-label {
    position: absolute;
    top: 20px;
    padding: 8px 20px;
    background: var(--ba-label-bg);
    border-radius: 20px;
    font-size: clamp(0.85rem, 1.2vw, 1.1rem);
    font-weight: 700;
    color: var(--ba-label-text);
    z-index: 5;
    pointer-events: none;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  .ba-label-before {
    left: 20px;
  }
  .ba-label-after {
    right: 20px;
  }

  /* --- Per-slide caption (inside the card) --- */
  .ba-caption {
    position: absolute;
    bottom: 18px;
    left: 18px;
    right: 18px;
    text-align: center;
    z-index: 5;
    background: rgba(0, 0, 0, 0.55);
    color: #ffffff;
    font-weight: 600;
    font-size: clamp(0.85rem, 1.2vw, 1rem);
    padding: 8px 14px;
    border-radius: 12px;
    pointer-events: none;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  /* --- Product chip overlay (anchored to the bottom of the card) --- */
  .ba-product-chip {
    position: absolute;
    bottom: 14px;
    inset-inline-start: 14px;
    max-width: calc(100% - 28px);
    z-index: 6;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px 8px 8px;
    background: var(--ba-chip-bg);
    color: var(--ba-chip-color);
    text-decoration: none;
    border-radius: 14px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 14px 32px -16px rgba(0, 0, 0, 0.5),
      0 2px 6px -2px rgba(0, 0, 0, 0.18);
    transition: transform 0.25s var(--ba-ease), box-shadow 0.25s var(--ba-ease);
    pointer-events: auto;
  }
  /* In RTL the chip lives on the right with mirrored interior padding. */
  .ba-product-chip:dir(rtl) {
    padding: 8px 8px 8px 14px;
  }
  .ba-product-chip:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 40px -18px rgba(0, 0, 0, 0.55),
      0 4px 10px -3px rgba(0, 0, 0, 0.22);
  }
  .ba-slide:not([data-pos="active"]) .ba-product-chip {
    pointer-events: none;
  }
  .ba-product-chip__thumb {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.06);
    display: block;
  }
  /* Skeleton shimmer while we're fetching product details. */
  .ba-product-chip__thumb--skeleton {
    background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.06) 0%,
        rgba(0, 0, 0, 0.12) 50%,
        rgba(0, 0, 0, 0.06) 100%
      )
      0 0 / 200% 100%;
    animation: ba-chip-shimmer 1.4s ease-in-out infinite;
  }
  .ba-product-chip--loading {
    cursor: progress;
    opacity: 0.92;
  }
  @keyframes ba-chip-shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ba-product-chip__thumb--skeleton {
      animation: none;
    }
  }
  .ba-product-chip__name {
    font-weight: 700;
    font-size: 0.92rem;
    line-height: 1.3;
    color: inherit;
    /* Clamp to 2 lines so long product names don't blow the card open. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }
  .ba-product-chip__arrow {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.65;
  }
  .ba-product-chip:dir(rtl) .ba-product-chip__arrow {
    transform: rotate(180deg);
  }
  @media (max-width: 480px) {
    .ba-product-chip__thumb {
      width: 38px;
      height: 38px;
    }
    .ba-product-chip__name {
      font-size: 0.85rem;
      max-width: 140px;
    }
  }

  /* --- Navigation buttons --- */
  .ba-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: var(--ba-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s var(--ba-ease), box-shadow 0.25s var(--ba-ease),
      filter 0.25s var(--ba-ease);
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
  }
  .ba-nav:hover {
    transform: translateY(-50%) scale(1.1);
    filter: brightness(1.05);
    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.45);
  }
  .ba-nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: translateY(-50%);
    box-shadow: none;
  }
  .ba-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--ba-nav-icon);
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ba-nav-prev {
    left: 0;
  }
  .ba-nav-next {
    right: 0;
  }
  .ba-nav-prev svg {
    transform: rotate(180deg);
  }
  /* RTL: swap nav button sides so the prev arrow points "back" (rightward) */
  .ba-nav-prev:dir(rtl) {
    left: auto;
    right: 0;
  }
  .ba-nav-next:dir(rtl) {
    right: auto;
    left: 0;
  }
  .ba-nav-prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .ba-nav-next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* --- Pagination dots --- */
  .ba-dots {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 28px;
  }
  .ba-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: var(--ba-handle-icon);
    opacity: 0.35;
    cursor: pointer;
    transition: opacity 0.25s var(--ba-ease), transform 0.25s var(--ba-ease);
  }
  .ba-dot[aria-current="true"] {
    opacity: 1;
    transform: scale(1.25);
  }
  .ba-dot:hover {
    opacity: 0.7;
  }

  /* --- Header entrance: fade + de-blur (with a hair of Y for life) --- */
  .ba-header > * {
    will-change: opacity, filter, transform;
  }
  .ba-header[data-anim="ready"] > * {
    opacity: 0;
    filter: blur(14px);
    transform: translateY(8px);
  }
  .ba-header[data-anim="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ba-header[data-anim="in"] > *:nth-child(1) {
    transition-delay: 0.08s;
  }
  .ba-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.26s;
  }

  /* --- Empty state --- */
  .ba-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #888;
    background: var(--ba-bg);
  }

  /* --- Reduced motion --- */
  @media (prefers-reduced-motion: reduce) {
    .ba-slide,
    .ba-product-chip,
    .ba-nav,
    .ba-dot,
    .ba-handle,
    .ba-slider-line {
      transition: none !important;
    }
    .ba-header[data-anim] > * {
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: none !important;
      transition: none !important;
    }
    .ba-section[data-entrance="enter"] .ba-slide,
    .ba-section[data-entrance="enter"] .ba-slide[data-pos],
    .ba-section[data-entrance="enter"][data-layout] .ba-slide[data-pos] {
      transform: none !important;
      opacity: 1 !important;
      filter: blur(0) !important;
    }
  }

  /* --- Mobile fine-tuning --- */
  @media (max-width: 640px) {
    .ba-handle {
      width: 48px;
      height: 48px;
    }
    .ba-handle::before {
      left: 12px;
      border-width: 8px 8px 8px 0;
    }
    .ba-handle::after {
      right: 12px;
      border-width: 8px 0 8px 8px;
    }
    .ba-nav {
      width: 42px;
      height: 42px;
    }
    .ba-nav svg {
      width: 18px;
      height: 18px;
    }
    .ba-label {
      font-size: 0.85rem;
      padding: 6px 14px;
      top: 14px;
    }
    .ba-label-before {
      left: 14px;
    }
    .ba-label-after {
      right: 14px;
    }
  }
`;
