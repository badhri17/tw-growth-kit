import { css } from "lit";

/**
 * Growth Kit — Featured Product styles.
 *
 * Mobile-first, RTL-first. Every layout is authored as a single-column mobile
 * base; desktop enhancements live inside `@media (min-width: 768px)`.
 *
 * Colours are driven by CSS custom properties resolved in the component with
 * layout-aware defaults (so text flips to light on `background`/`bold` unless
 * the merchant overrides it). The values below are only safety fallbacks.
 */
export const featuredProductStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    --fp-bg: #f4f1ea;
    --fp-card-bg: #ffffff;
    --fp-card-radius: 24px;
    --fp-media-radius: 18px;
    --fp-eyebrow: #b08948;
    --fp-title: #14181f;
    --fp-text: #4b5563;
    --fp-price: #14181f;
    --fp-compare: #9aa1ac;
    --fp-badge-bg: #e23744;
    --fp-badge-color: #ffffff;
    --fp-highlight: #b08948;
    --fp-btn-bg: #14181f;
    --fp-btn-color: #ffffff;
    --fp-shipping: #2e7d52;
    --fp-effect: #b08948;
    --fp-aspect: 1 / 1;
    --fp-maxw: 600px;
    --fp-ease: cubic-bezier(0.22, 1, 0.36, 1);
    --fp-img-fit: contain;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* ---------- Section ---------- */
  .fp {
    width: 100%;
    background: var(--fp-bg);
    padding: clamp(2rem, 6vw, 4.5rem) clamp(1rem, 4vw, 2rem);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: clamp(1rem, 2.5vw, 1.75rem);
    position: relative; /* anchors .fp-sbg background media */
  }

  /* Optional section heading that sits above the card. */
  .fp-section-title {
    width: 100%;
    margin: 0;
    color: var(--fp-title);
    font-size: clamp(1.35rem, 3.5vw, 2rem);
    font-weight: 700;
    line-height: 1.25;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  /* Section background media (image / video) fills the section behind the card. */
  .fp-sbg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    display: block;
    pointer-events: none;
  }

  /* ---------- Card ---------- */
  .fp-card {
    position: relative;
    z-index: 1; /* lifts above .fp-sbg background media */
    width: 100%;
    /* Mobile card width; desktop override applied in the ≥768px block below. */
    max-width: var(--fp-maxw-mob, var(--fp-maxw));
    border-radius: var(--fp-card-radius);
    display: flex;
    flex-direction: column;
    gap: clamp(1.1rem, 3vw, 1.6rem);
    padding: clamp(1.25rem, 4vw, 2.25rem);
  }

  /* Card style: minimal — no chrome, content floats on the section. */
  .fp-card[data-card="minimal"] {
    background: transparent;
    padding-inline: 0;
  }

  /* Card style: soft — white surface, gentle elevation. */
  .fp-card[data-card="soft"] {
    background: var(--fp-card-bg);
    box-shadow: 0 30px 60px -32px rgba(15, 23, 42, 0.35),
      0 8px 20px -16px rgba(15, 23, 42, 0.25);
  }

  /* Card style: glass — translucent, blurred, hairline border + top sheen. */
  .fp-card[data-card="glass"] {
    background: var(--fp-card-bg);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    backdrop-filter: blur(18px) saturate(1.4);
    border: 1px solid rgba(255, 255, 255, 0.55);
    box-shadow: 0 30px 70px -34px rgba(15, 23, 42, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  /* Card style: bold — rich gradient surface for offer-led spotlights. */
  .fp-card[data-card="bold"] {
    background: var(--fp-card-bg);
    box-shadow: 0 36px 80px -34px rgba(0, 0, 0, 0.55);
  }

  /* ---------- Media ---------- */
  .fp-media {
    position: relative;
    width: 100%;
    flex: none;
  }
  .fp-media-inner {
    position: relative;
    width: 100%;
    aspect-ratio: var(--fp-aspect);
    border-radius: var(--fp-media-radius);
    overflow: hidden;
    z-index: 1;
    transition: transform 0.25s ease-out;
    transform-style: preserve-3d;
    /* Pre-composite onto its own GPU layer so the JS tilt transform is applied
       immediately without a promotion delay, even when the child .fp-img is
       already on its own layer for the float-bob animation. */
    will-change: transform;
  }
  .fp-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: var(--fp-img-fit, contain);
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }
  /* Hover image cross-fade (desktop, pointer devices only). */
  .fp-img--hover {
    opacity: 0;
    transition: opacity 0.55s var(--fp-ease);
  }
  @media (hover: hover) {
    .fp-card:hover .fp-img--hover {
      opacity: 1;
    }
  }

  /* ---------- Background effect (behind the image) ---------- */
  .fp-effect {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    display: grid;
    place-items: center;
  }
  .fp-effect::before {
    content: "";
    display: block;
  }
  .fp-effect[data-effect="circle"]::before {
    width: 96%;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--fp-effect);
    opacity: 0.16;
  }
  .fp-effect[data-effect="glow"]::before {
    width: 120%;
    height: 120%;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      var(--fp-effect) 0%,
      transparent 62%
    );
    opacity: 0.4;
    filter: blur(8px);
  }
  .fp-effect[data-effect="pattern"]::before {
    width: 92%;
    height: 92%;
    border-radius: 20px;
    background-image: radial-gradient(
      var(--fp-effect) 1.4px,
      transparent 1.4px
    );
    background-size: 16px 16px;
    opacity: 0.18;
  }
  .fp-effect[data-effect="blob"]::before {
    width: 104%;
    aspect-ratio: 1;
    background: var(--fp-effect);
    border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
    opacity: 0.2;
    filter: blur(6px);
  }

  /* ---------- Content ---------- */
  .fp-content {
    display: flex;
    flex-direction: column;
    gap: clamp(0.7rem, 2vw, 1rem);
    min-width: 0;
  }
  .fp-eyebrow {
    margin: 0;
    color: var(--fp-eyebrow);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .fp-title {
    margin: 0;
    color: var(--fp-title);
    font-size: clamp(1.6rem, 4.5vw, 2.4rem);
    font-weight: 700;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }
  .fp-desc {
    margin: 0;
    color: var(--fp-text);
    font-size: clamp(0.95rem, 1.4vw, 1.05rem);
    line-height: 1.75;
  }

  /* ---------- Highlights ---------- */
  .fp-highlights {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--fp-hl-gap, 0.55rem);
    background: var(--fp-hl-bg, transparent);
    border-radius: var(--fp-hl-radius, 0);
    overflow: hidden; /* clips first/last item corners to the border-radius */
  }
  .fp-highlight {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    color: var(--fp-text);
    font-size: 0.97rem;
    line-height: 1.4;
    padding: var(--fp-hl-item-pad, 0);
  }
  .fp-highlight svg {
    width: 20px;
    height: 20px;
    flex: none;
    color: var(--fp-highlight);
  }

  /* ---------- Pricing ---------- */
  .fp-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.15rem;
  }
  .fp-price {
    color: var(--fp-price);
    font-size: clamp(1.5rem, 3.6vw, 2.05rem);
    font-weight: 800;
    line-height: 1;
  }
  .fp-compare {
    color: var(--fp-compare);
    font-size: 1rem;
    font-weight: 600;
    text-decoration: line-through;
    text-decoration-thickness: 1.5px;
  }
  .fp-shipping {
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--fp-shipping);
    font-size: 0.9rem;
    font-weight: 600;
  }
  .fp-shipping svg {
    width: 18px;
    height: 18px;
    flex: none;
  }

  /* ---------- Button ---------- */
  .fp-actions {
    margin-top: 0.4rem;
  }
  .fp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 14px 30px;
    width: 100%;
    border: none;
    border-radius: var(--fp-btn-radius, 999px);
    background: var(--fp-btn-bg);
    color: var(--fp-btn-color);
    font-family: inherit;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    box-shadow: 0 16px 34px -14px rgba(0, 0, 0, 0.5);
    transition: transform 0.25s var(--fp-ease),
      box-shadow 0.25s var(--fp-ease), opacity 0.2s var(--fp-ease);
  }
  .fp-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 42px -16px rgba(0, 0, 0, 0.6);
  }
  .fp-btn:active {
    transform: translateY(0);
  }
  .fp-btn[disabled] {
    opacity: 0.7;
    cursor: default;
    transform: none;
  }
  .fp-btn svg {
    width: 19px;
    height: 19px;
    flex: none;
  }
  /* Arrow points toward the reading direction. */
  .fp-btn .fp-btn__arrow {
    transition: transform 0.25s var(--fp-ease);
  }
  .fp-btn:dir(rtl) .fp-btn__arrow {
    transform: scaleX(-1);
  }
  .fp-btn:hover .fp-btn__arrow {
    transform: translateX(3px);
  }
  .fp-btn:dir(rtl):hover .fp-btn__arrow {
    transform: scaleX(-1) translateX(3px);
  }
  /* Loading spinner. */
  .fp-spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-top-color: transparent;
    animation: fp-spin 0.7s linear infinite;
  }
  @keyframes fp-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* =========================================================
     LAYOUT: inside (image inside the card, content below)
     ========================================================= */
  /* base (mobile) is already a single column — nothing extra needed */

  /* =========================================================
     LAYOUT: floating (image lifts above the card top edge)
     ========================================================= */

  /* Extra top padding on the section so the floating image has room to breathe.
     Must be ≥ the card margin-top below to keep the image inside the section. */
  .fp[data-layout="floating"] {
    padding-top: clamp(160px, 35vw, 290px);
  }

  /* The card is pushed down so the image can rise above it. */
  .fp-card[data-layout="floating"] {
    margin-top: clamp(120px, 32vw, 240px);
  }
  /* Negative margin lifts the media above the card's top edge by the same amount. */
  .fp-card[data-layout="floating"] .fp-media {
    margin-top: clamp(-240px, -32vw, -120px);
  }
  .fp-card[data-layout="floating"] .fp-media-inner {
    border-radius: 0;
    overflow: visible;
    background: transparent;
  }
  .fp-card[data-layout="floating"] .fp-img {
    filter: drop-shadow(0 26px 34px rgba(0, 0, 0, 0.3));
  }
  /* The effect should sit behind the floating product, not clip to a frame. */
  .fp-card[data-layout="floating"] .fp-effect {
    overflow: visible;
  }

  /* =========================================================
     LAYOUT: split (image beside details on desktop)
     ========================================================= */
  /* mobile: stacks (image then content). Desktop handled in media query. */

  /* =========================================================
     LAYOUT: background (image fills the card; content overlays)
     ========================================================= */
  .fp-card[data-layout="background"] {
    padding: 0;
    overflow: hidden;
    min-height: clamp(420px, 70vw, 560px);
    justify-content: flex-end;
  }
  .fp-card[data-layout="background"] .fp-media,
  .fp-card[data-layout="background"] .fp-media-inner {
    position: absolute;
    inset: 0;
    margin: 0;
    border-radius: 0;
    aspect-ratio: auto;
    height: 100%;
  }
  .fp-card[data-layout="background"] .fp-content {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: clamp(1.5rem, 5vw, 2.75rem);
    padding-top: clamp(3rem, 10vw, 5rem);
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.82) 0%,
      rgba(0, 0, 0, 0.55) 45%,
      transparent 100%
    );
  }
  /* =========================================================
     CONTENT ALIGNMENT  (set via data-align on .fp-content)
     Highlights are excluded — they stay start/RTL-aligned always.
     ========================================================= */

  /* ---- Center ---- */
  .fp-content[data-align="center"] {
    text-align: center;
  }
  .fp-content[data-align="center"] .fp-price-row {
    justify-content: center;
  }
  /* Keep highlights start-aligned even when parent is centered */
  .fp-content[data-align="center"] .fp-highlights {
    text-align: start;
  }

  /* ---- Left ---- */
  .fp-content[data-align="left"] {
    text-align: left;
  }
  .fp-content[data-align="left"] .fp-price-row {
    justify-content: flex-end;
  }
  .fp-content[data-align="left"] .fp-highlights {
    text-align: start;
  }

  /* =========================================================
     ENTRANCE ANIMATION
     ========================================================= */
  .fp[data-enter="ready"] .fp-media {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  .fp[data-enter="in"] .fp-media {
    opacity: 1;
    transform: none;
    transition: opacity 0.8s var(--fp-ease), transform 0.9s var(--fp-ease);
  }
  .fp[data-enter="ready"] .fp-content > * {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(8px);
  }
  .fp[data-enter="in"] .fp-content > * {
    opacity: 1;
    transform: none;
    filter: blur(0);
    transition: opacity 0.7s var(--fp-ease), transform 0.7s var(--fp-ease),
      filter 0.7s var(--fp-ease);
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(1) {
    transition-delay: 0.1s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(2) {
    transition-delay: 0.18s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(3) {
    transition-delay: 0.26s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(4) {
    transition-delay: 0.34s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(5) {
    transition-delay: 0.42s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(6) {
    transition-delay: 0.5s;
  }
  .fp[data-enter="in"] .fp-content > *:nth-child(n + 7) {
    transition-delay: 0.56s;
  }

  /* =========================================================
     FLOAT (gentle idle bob of the product image)
     ========================================================= */
  @keyframes fp-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-9px);
    }
  }
  .fp[data-float="on"] .fp-card:not([data-layout="background"]) .fp-img {
    animation: fp-bob 5.5s ease-in-out infinite;
  }
  /* Hold the bob until the entrance settles. */
  .fp[data-enter="ready"] .fp-img {
    animation: none !important;
  }

  /* =========================================================
     DESKTOP ENHANCEMENTS (≥ 768px)
     ========================================================= */
  @media (min-width: 768px) {
    /* Desktop card width; falls back to the mobile size when not overridden. */
    .fp-card {
      max-width: var(--fp-maxw-desk, var(--fp-maxw-mob, var(--fp-maxw)));
    }
    .fp-card[data-layout="inside"],
    .fp-card[data-layout="floating"] {
      --fp-maxw: 560px;
    }
    .fp-card[data-layout="split"] {
      --fp-maxw: 1080px;
      flex-direction: row;
      align-items: center;
      gap: clamp(1.75rem, 4vw, 3.25rem);
      padding: clamp(1.75rem, 3vw, 2.75rem);
    }
    .fp-card[data-layout="split"][data-side="end"] {
      flex-direction: row-reverse;
    }
    .fp-card[data-layout="split"] .fp-media {
      flex: 1 1 50%;
    }
    .fp-card[data-layout="split"] .fp-content {
      flex: 1 1 50%;
    }
    .fp-card[data-layout="background"] {
      --fp-maxw: 760px;
      min-height: 520px;
    }
    .fp-card[data-layout="background"] .fp-content {
      max-width: 80%;
    }
  }

  /* =========================================================
     EMPTY STATE
     ========================================================= */
  .fp-empty {
    width: 100%;
    padding: 56px 20px;
    text-align: center;
    color: #8a8a8a;
    background: var(--fp-bg);
  }

  /* =========================================================
     REDUCED MOTION
     ========================================================= */
  @media (prefers-reduced-motion: reduce) {
    .fp-media,
    .fp-media-inner,
    .fp-content > *,
    .fp-img,
    .fp-img--hover,
    .fp-btn {
      transition: none !important;
      animation: none !important;
    }
    .fp[data-enter] .fp-media,
    .fp[data-enter] .fp-content > * {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
    }
  }
`;
