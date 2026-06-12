import { css } from "lit";

export const collectionStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;

    --col-bg: #feecd4;
    --col-title-color: #18332f;
    --col-text-color: #4b5563;
    --col-caption-title-color: #111111;
    --col-caption-text-color: #555555;
    --col-card-radius: 20px;
    --col-cta-bg: #18332f;
    --col-cta-color: #ffffff;
    --col-nav-bg: rgba(255, 255, 255, 0.95);
    --col-nav-icon: #18332f;
    --col-dot-color: #18332f;
    --col-aspect: 1 / 1;
    --col-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .col-section {
    width: 100%;
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.5rem);
    background-color: var(--col-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  /* ---------- Header ---------- */
  .col-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
  }
  .col-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 500;
    letter-spacing: 1.5px;
    color: var(--col-title-color);
    margin: 0 0 0.5rem;
    line-height: 1.2;
  }

  /* ---------- Stage ---------- */
  .col-stage {
    position: relative;
    width: 100%;
    max-width: 1200px;
    padding: 1rem 3.5rem;
  }
  @media (min-width: 1024px) {
    .col-stage {
      padding: 1rem 5rem;
    }
  }
  @media (max-width: 480px) {
    .col-stage {
      padding: 0.5rem 3.75rem;
    }
  }

  /* Track is the 3D stage: it owns the perspective so each slide's rotateY +
     translateZ render as real depth. Side slides poke out past it. */
  .col-track {
    position: relative;
    width: 100%;
    max-width: 560px;
    margin-inline: auto;
    aspect-ratio: var(--col-aspect);
    overflow: visible;
    perspective: 1400px;
    transform-style: preserve-3d;
  }

  /* ---------- Slide positioning ----------
     A depth coverflow: one combined transform per resting position —
     translateX glides it sideways, translateZ recedes it into the scene, scale
     shrinks it. No rotation — cards stay flat-on. Side slides are fully opaque
     so the section background never tints through the transparent card. */
  .col-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.6s var(--col-ease),
      opacity 0.6s var(--col-ease);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  /* When a slide wraps around the loop it would otherwise fly all the way
     across the stage. Snap it to its new side with no transition instead. */
  .col-slide[data-instant] {
    transition: none;
  }

  .col-slide[data-pos="active"] {
    opacity: 1;
    pointer-events: auto;
    z-index: 5;
    transform: translateX(0) translateZ(0) scale(1);
  }
  .col-slide[data-pos="left"] {
    opacity: 1;
    z-index: 4;
    transform: translateX(-90%) translateZ(-90px) scale(0.62);
  }
  .col-slide[data-pos="right"] {
    opacity: 1;
    z-index: 4;
    transform: translateX(90%) translateZ(-90px) scale(0.62);
  }
  /* Only 3 slides are ever visible (active + the two neighbours). The far
     positions stay laid out for the wrap animation but are fully hidden, so a
     slide fades in from the edge as it slides into the neighbour slot. */
  .col-slide[data-pos="far-left"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(-130%) translateZ(-170px) scale(0.5);
  }
  .col-slide[data-pos="far-right"] {
    opacity: 0;
    z-index: 2;
    transform: translateX(130%) translateZ(-170px) scale(0.5);
  }
  .col-slide[data-pos="hidden"] {
    opacity: 0;
    z-index: 1;
    transform: translateZ(-340px) scale(0.45);
  }

  /* RTL mirrors the arc: sides swap to the opposite hand. */
  .col-slide:dir(rtl)[data-pos="left"] {
    transform: translateX(90%) translateZ(-90px) scale(0.62);
  }
  .col-slide:dir(rtl)[data-pos="right"] {
    transform: translateX(-90%) translateZ(-90px) scale(0.62);
  }
  .col-slide:dir(rtl)[data-pos="far-left"] {
    transform: translateX(130%) translateZ(-170px) scale(0.5);
  }
  .col-slide:dir(rtl)[data-pos="far-right"] {
    transform: translateX(-130%) translateZ(-170px) scale(0.5);
  }

  /* Single layout: only the active slide shows — everything else recedes out. */
  .col-section[data-layout="single"] .col-slide:not([data-pos="active"]) {
    opacity: 0;
    transform: translateZ(-340px) scale(0.45);
  }

  /* Mobile: neighbours shrink and peek in from the edges with a gap. */
  @media (max-width: 1023px) {
    .col-slide[data-pos="left"] {
      transform: translateX(-78%) translateZ(-60px) scale(0.56);
    }
    .col-slide[data-pos="right"] {
      transform: translateX(78%) translateZ(-60px) scale(0.56);
    }
    .col-slide:dir(rtl)[data-pos="left"] {
      transform: translateX(78%) translateZ(-60px) scale(0.56);
    }
    .col-slide:dir(rtl)[data-pos="right"] {
      transform: translateX(-78%) translateZ(-60px) scale(0.56);
    }
  }

  /* ---------- Slides entrance: stacked → spread ----------
     With «حركة الظهور» on, every slide starts collapsed at the center (receded
     into the scene and faded out), then releases to its coverflow position —
     the cards appear stacked, then fan out. The four-class selector outranks
     every resting data-pos rule (incl. the RTL / mobile ones) so it wins while
     "ready"; once the state flips to "in" it stops matching and the normal
     positions take over, and .col-slide's own transition animates the spread. */
  .col-section[data-enter="ready"] .col-track .col-slide {
    transform: translateX(0) translateZ(-220px) scale(0.6);
    opacity: 0;
  }

  /* ---------- Card ---------- */
  .col-card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--col-card-radius);
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    background: transparent;
    cursor: pointer;
  }
  .col-slide[data-pos="active"] .col-card {
    cursor: default;
  }

  .col-card img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
    transition: opacity 0.5s var(--col-ease),
      transform 0.5s var(--col-ease);
  }



  /* ---------- Animation: reveal ----------
     Two stacked images per slide; on active we cross-fade from closed→opened
     (with a hair of scale to feel like the product is "opening"). Slides
     without an "image_opened" are tagged "col-card--no-opened" so the swap
     is skipped — otherwise the closed image would fade out into nothing. */
  .col-card:not(.col-card--no-opened) .col-img-opened {
    opacity: 0;
    transform: scale(1.05);
    z-index: 2;
  }
  .col-card:not(.col-card--no-opened) .col-img-closed {
    opacity: 1;
    transform: scale(1);
    z-index: 1;
  }
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-opened {
    opacity: 1;
    transform: scale(1);
  }
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-closed {
    opacity: 0;
    transform: scale(1.1);
  }
  /* Hold the reveal until the slide has finished gliding to center: wait out
     the 0.6s slide-move transition before the closed→opened cross-fade starts.
     Reverting (leaving active) uses the base transition with no delay, so the
     closed image returns promptly. */
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-opened,
  .col-slide[data-pos="active"]
    .col-card:not(.col-card--no-opened)
    .col-img-closed {
    transition-delay: 0.4s;
  }
  .col-card.col-card--no-opened .col-img-opened {
    display: none;
  }

  /* ---------- Caption block (per-slide, under carousel) ----------
     Fades out → swaps text → fades in as the active slide changes. */
  .col-caption {
    width: 100%;
    max-width: 640px;
    text-align: center;
    margin: clamp(1.25rem, 3vw, 2rem) auto 0;
    padding: 0 1rem;
    min-height: 6rem;
  }
  .col-caption[data-state="out"] .col-caption__title,
  .col-caption[data-state="out"] .col-caption__desc {
    opacity: 0;
    transform: translateY(6px);
  }
  .col-caption[data-state="in"] .col-caption__title,
  .col-caption[data-state="in"] .col-caption__desc {
    opacity: 1;
    transform: translateY(0);
  }
  .col-caption__title,
  .col-caption__desc {
    transition: opacity 0.45s var(--col-ease),
      transform 0.45s var(--col-ease);
  }
  .col-caption__title {
    font-size: clamp(1.3rem, 2.4vw, 1.85rem);
    font-weight: 400;
    letter-spacing: 0.5px;
    color: var(--col-caption-title-color);
    margin: 0 0 0.6rem;
    line-height: 1.3;
  }
  .col-caption__desc {
    font-size: clamp(0.95rem, 1.3vw, 1.05rem);
    color: var(--col-caption-text-color);
    line-height: 1.7;
    margin: 0;
    transition-delay: 0.05s;
  }

  /* ---------- CTA button (under carousel, home mode only) ---------- */
  .col-cta-wrap {
    width: 100%;
    text-align: center;
    margin-top: clamp(1.5rem, 3vw, 2.25rem);
  }
  .col-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    background: var(--col-cta-bg);
    color: var(--col-cta-color);
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition: transform 0.25s var(--col-ease),
      box-shadow 0.25s var(--col-ease), opacity 0.3s var(--col-ease);
    box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.35);
  }
  .col-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 32px -14px rgba(0, 0, 0, 0.45);
  }
  .col-cta svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-cta:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Navigation ---------- */
  .col-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: var(--col-nav-bg);
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.25s var(--col-ease),
      box-shadow 0.25s var(--col-ease), filter 0.25s var(--col-ease);
    box-shadow: 0 6px 18px -6px rgba(0, 0, 0, 0.3);
  }
  .col-nav:hover {
    transform: translateY(-50%) scale(1.1);
    filter: brightness(1.05);
    box-shadow: 0 10px 28px -8px rgba(0, 0, 0, 0.45);
  }
  .col-nav:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: translateY(-50%);
    box-shadow: none;
  }
  .col-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--col-nav-icon);
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-nav-prev {
    left: 0;
  }
  .col-nav-next {
    right: 0;
  }
  .col-nav-prev svg {
    transform: rotate(180deg);
  }
  /* RTL: swap nav button sides + flip arrows. */
  .col-nav-prev:dir(rtl) {
    left: auto;
    right: 0;
  }
  .col-nav-next:dir(rtl) {
    right: auto;
    left: 0;
  }
  .col-nav-prev:dir(rtl) svg {
    transform: rotate(0deg);
  }
  .col-nav-next:dir(rtl) svg {
    transform: rotate(180deg);
  }

  /* ---------- Pagination dots ---------- */
  .col-dots {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 24px;
  }
  .col-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    padding: 0;
    background: var(--col-dot-color);
    opacity: 0.35;
    cursor: pointer;
    transition: opacity 0.25s var(--col-ease),
      transform 0.25s var(--col-ease);
  }
  .col-dot[aria-current="true"] {
    opacity: 1;
    transform: scale(1.25);
  }
  .col-dot:hover {
    opacity: 0.7;
  }

  /* ---------- Header entrance (fade + de-blur) ---------- */
  .col-header > * {
    will-change: opacity, filter, transform;
  }
  .col-header[data-anim="ready"] > * {
    opacity: 0;
    filter: blur(14px);
    transform: translateY(8px);
  }
  .col-header[data-anim="in"] > * {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
    transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1),
      filter 0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .col-header[data-anim="in"] > *:nth-child(1) {
    transition-delay: 0.08s;
  }
  .col-header[data-anim="in"] > *:nth-child(2) {
    transition-delay: 0.26s;
  }

  /* ---------- Empty state ---------- */
  .col-empty {
    width: 100%;
    padding: 60px 20px;
    text-align: center;
    color: #888;
    background: var(--col-bg);
  }

  /* ---------- Reduced motion ---------- */
  @media (prefers-reduced-motion: reduce) {
    .col-slide,
    .col-card,
    .col-card img,
    .col-nav,
    .col-dot,
    .col-cta,
    .col-caption__title,
    .col-caption__desc {
      transition: none !important;
    }
    .col-header[data-anim] > * {
      opacity: 1 !important;
      filter: blur(0) !important;
      transform: none !important;
      transition: none !important;
    }
  }

  /* ---------- Mobile tuning ---------- */
  @media (max-width: 640px) {
    .col-nav {
      width: 42px;
      height: 42px;
    }
    .col-nav svg {
      width: 18px;
      height: 18px;
    }
  }

  /* ============================================================
     Bag mode (وضع الشنطة)
     Vertical stage: half-dome + fog backdrop (z 1–2), the merchant's
     bag image in front of them (z 5), and the product layer on top
     (z 7) so the bottle reads as standing in the bag's mouth. The
     rise/sink keyframes + the opacity fade sell the in/out illusion.
     Mobile values are the base; desktop overrides at 768px.
     ============================================================ */
  .col-section--bag {
    /* Bag tier (حجم الشنطة): the bag image + the stage built around it.
       --bag-anchor = the bag's mouth line, where the product's bottom
       rests, measured up from the stage bottom. */
    --bag-w: 320px;
    --bag-anchor: 240px;
    --bag-nav-size: 46px;
    --bag-circle-color: #eba3a8;

    /* Product tier (حجم المنتجات): independent of the bag so merchants
       can tune the product-to-bag ratio. */
    --bag-bottle-w: 215px;
    --bag-circle-w: 260px;
    --bag-circle-h: 150px;

    /* Measured h/w ratios of the actual images — the component sets these
       inline once the images load, so the stage hugs the real artwork
       instead of reserving worst-case headroom (which read as a huge gap
       between the caption and the product). Declarations here are the
       pre-measure fallbacks. */
    --bag-prod-ratio: 1.2;
    --bag-ratio: 1.05;

    /* Derived: the stage is exactly tall enough for the taller of
       (mouth line + product + overshoot headroom) and the bag artwork
       itself; everything else tracks the mouth line, so the two size
       dropdowns can be mixed freely. */
    --bag-img-h: calc(
      var(--bag-bottle-w) * min(var(--bag-prod-ratio), 1.9)
    );
    --bag-stage-h: max(
      calc(var(--bag-anchor) + var(--bag-img-h) + 16px),
      calc(var(--bag-w) * var(--bag-ratio) - 12px)
    );
    --bag-layer-h: calc(var(--bag-stage-h) - var(--bag-anchor));
    --bag-circle-top: max(
      0px,
      calc(var(--bag-layer-h) - var(--bag-circle-h) - 25px)
    );
    --bag-nav-top: calc(var(--bag-layer-h) + 25px);
  }
  .col-section--bag[data-bag-size="small"] {
    --bag-w: 260px;
    --bag-anchor: 220px;
  }
  .col-section--bag[data-bag-size="large"] {
    --bag-w: 360px;
    --bag-anchor: 260px;
  }
  .col-section--bag[data-product-size="small"] {
    --bag-bottle-w: 170px;
    --bag-circle-w: 220px;
    --bag-circle-h: 130px;
  }
  .col-section--bag[data-product-size="large"] {
    --bag-bottle-w: 260px;
    --bag-circle-w: 300px;
    --bag-circle-h: 170px;
  }
  @media (min-width: 768px) {
    .col-section--bag {
      --bag-w: 400px;
      --bag-anchor: 290px;
      --bag-nav-size: 54px;
      --bag-bottle-w: 255px;
      --bag-circle-w: 310px;
      --bag-circle-h: 180px;
    }
    .col-section--bag[data-bag-size="small"] {
      --bag-w: 320px;
      --bag-anchor: 230px;
    }
    .col-section--bag[data-bag-size="large"] {
      --bag-w: 460px;
      --bag-anchor: 350px;
    }
    .col-section--bag[data-product-size="small"] {
      --bag-bottle-w: 195px;
      --bag-circle-w: 260px;
      --bag-circle-h: 150px;
    }
    .col-section--bag[data-product-size="large"] {
      --bag-bottle-w: 315px;
      --bag-circle-w: 360px;
      --bag-circle-h: 200px;
    }
  }

  /* In bag mode the caption sits ABOVE the stage (the copy introduces the
     product rising below it). Reserve height so text swaps don't bounce
     the whole stage. */
  .col-section--bag .col-caption {
    margin: 0 auto;
    min-height: 7rem;
  }

  .col-bag-stage {
    position: relative;
    width: min(520px, 94vw);
    height: var(--bag-stage-h);
    margin-inline: auto;
    overflow: hidden;
    /* Horizontal swipe navigates; vertical stays native page scroll. */
    touch-action: pan-y;
  }

  .col-bag-circle {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: var(--bag-circle-top);
    width: var(--bag-circle-w);
    height: var(--bag-circle-h);
    border-radius: var(--bag-circle-h) var(--bag-circle-h) 0 0;
    background: var(--bag-circle-color);
    z-index: 1;
  }
  .col-bag-fog {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: calc(var(--bag-circle-top) + var(--bag-circle-h) - 10px);
    width: calc(var(--bag-circle-w) + 90px);
    height: 130px;
    background: linear-gradient(
      180deg,
      var(--bag-circle-color) 0%,
      transparent 100%
    );
    filter: blur(18px);
    opacity: 0.9;
    pointer-events: none;
    z-index: 2;
  }

  .col-bag-img {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -12px;
    width: var(--bag-w);
    max-width: 92vw;
    display: block;
    z-index: 5;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .col-bag-layer {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 0;
    width: var(--bag-bottle-w);
    height: var(--bag-layer-h);
    z-index: 7;
  }
  .col-bag-slide {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
  }
  .col-bag-slide[data-state="active"],
  .col-bag-slide[data-state="rising"],
  .col-bag-slide[data-state="sinking"] {
    opacity: 1;
  }
  .col-bag-slide img {
    display: block;
    width: 100%;
    max-height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.12));
    transform-origin: 50% 88%;
    will-change: transform, opacity, filter;
    user-select: none;
    -webkit-user-select: none;
  }
  .col-bag-slide[data-state="rising"] img {
    animation: colBagRise 0.82s cubic-bezier(0.2, 0.78, 0.2, 1) both;
  }
  .col-bag-slide[data-state="sinking"] img {
    animation: colBagSink 0.92s cubic-bezier(0.22, 0.08, 0.18, 1) forwards;
  }

  @keyframes colBagRise {
    0% {
      opacity: 0;
      transform: translateY(210px) scale(0.18);
      filter: blur(2px);
    }
    18% {
      opacity: 0.35;
      transform: translateY(165px) scale(0.34);
      filter: blur(1.5px);
    }
    42% {
      opacity: 0.78;
      transform: translateY(95px) scale(0.62);
      filter: blur(0.8px);
    }
    68% {
      opacity: 1;
      transform: translateY(18px) scale(1.06);
      filter: blur(0);
    }
    82% {
      opacity: 1;
      transform: translateY(-6px) scale(1.02);
      filter: blur(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }
  @keyframes colBagSink {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
    22% {
      opacity: 0.99;
      transform: translateY(8px) scale(0.98);
      filter: blur(0);
    }
    46% {
      opacity: 0.93;
      transform: translateY(26px) scale(0.9);
      filter: blur(0.08px);
    }
    68% {
      opacity: 0.8;
      transform: translateY(54px) scale(0.76);
      filter: blur(0.3px);
    }
    84% {
      opacity: 0.56;
      transform: translateY(92px) scale(0.56);
      filter: blur(0.75px);
    }
    100% {
      opacity: 0;
      transform: translateY(138px) scale(0.34);
      filter: blur(1.3px);
    }
  }

  /* Bag nav: up pulls the next product out, down sends it back in.
     RTL puts "up" on the right hand (matches reading order); LTR mirrors. */
  .col-bag-nav {
    position: absolute;
    top: var(--bag-nav-top);
    width: var(--bag-nav-size);
    height: var(--bag-nav-size);
    border-radius: 50%;
    border: none;
    background: var(--col-nav-bg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s var(--col-ease), transform 0.2s var(--col-ease);
  }
  .col-bag-nav:hover {
    transform: scale(1.06);
  }
  .col-bag-nav:disabled {
    opacity: 0.4;
    pointer-events: none;
  }
  .col-bag-nav svg {
    width: 22px;
    height: 22px;
    stroke: var(--col-nav-icon);
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-bag-nav--up {
    inset-inline-end: 10px;
  }
  .col-bag-nav--down {
    inset-inline-start: 10px;
  }

  .col-bag-bottom {
    text-align: center;
    color: var(--col-caption-title-color);
    font-size: clamp(1.15rem, 3.5vw, 1.6rem);
    font-weight: 700;
    line-height: 1.55;
    margin: 14px auto 0;
    max-width: 480px;
    padding: 0 1rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .col-bag-slide img {
      animation: none !important;
    }
    .col-bag-slide[data-state="sinking"] {
      opacity: 0;
    }
  }
`;
