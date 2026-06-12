import { css } from "lit";

export const galleryStyles = css`
  :host {
    display: block;
    font-family: inherit;
    direction: inherit;
    /* Size containment: wide slides can never push sibling Salla sections
       off-screen, and container queries track the section's real width
       (more reliable than the viewport inside the admin preview iframe). */
    container-type: inline-size;

    --lsg-bg: #f5f5f5;
    --lsg-title-color: #1a1a1a;
    --lsg-overlay-color: #ffffff;
    --lsg-radius: 32px;
    --lsg-h-mobile: 420px;
    /* --lsg-h-desktop is only set when the merchant overrides it. */
    --lsg-gap: 16px;
    --lsg-slide-w: 100%;
    --lsg-slide-size: 100%;
    --lsg-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    /* easeOutCubic — must match the JS estimate used when a drag interrupts
       an in-flight snap transition (see _currentPos in index.ts). */
    --lsg-snap-ease: cubic-bezier(0.33, 1, 0.68, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .lsg-section {
    width: 100%;
    padding: clamp(2.5rem, 6vw, 4rem) clamp(1rem, 3vw, 1.5rem);
    background-color: var(--lsg-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
  }

  /* ---------- Entrance ---------- */
  .lsg-section[data-enter="ready"] .lsg-header,
  .lsg-section[data-enter="ready"] .lsg-stage {
    opacity: 0;
    transform: translateY(24px);
  }
  .lsg-section[data-enter="in"] .lsg-header,
  .lsg-section[data-enter="in"] .lsg-stage {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.7s var(--lsg-ease), transform 0.7s var(--lsg-ease);
  }
  .lsg-section[data-enter="in"] .lsg-stage {
    transition-delay: 0.12s;
  }

  /* ---------- Header ---------- */
  .lsg-header {
    width: 100%;
    max-width: 720px;
    text-align: center;
    margin-bottom: 24px;
  }
  .lsg-pretitle {
    display: block;
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    font-weight: 800;
    font-size: clamp(1.75rem, 5cqw, 3rem);
    color: var(--lsg-title-color);
    line-height: 1.3;
  }
  .lsg-title {
    margin: 0;
    font-size: clamp(1.75rem, 5cqw, 3rem);
    font-weight: 700;
    color: var(--lsg-title-color);
    line-height: 1.4;
  }
  @container (min-width: 768px) {
    .lsg-header {
      margin-bottom: 40px;
    }
  }

  /* ---------- Stage ---------- */
  .lsg-stage {
    position: relative;
    width: 100%;
    max-width: 1100px;
    height: var(--lsg-h-mobile);
    cursor: grab;
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
  }
  .lsg-stage.is-dragging {
    cursor: grabbing;
  }
  @container (min-width: 768px) {
    .lsg-stage {
      height: var(--lsg-h-desktop, var(--lsg-h-mobile));
    }
  }

  .lsg-track {
    display: flex;
    height: 100%;
  }

  /* The slide is a static layout slot — it never moves. The wrapper inside it
     is what the material effect animates: its width shrinks/grows while the
     fixed-width content stays centered, so the image gets cropped from both
     sides like a narrowing window. */
  .lsg-slide {
    position: relative;
    flex: 0 0 auto;
    width: var(--lsg-slide-w);
    height: 100%;
    margin-inline-end: var(--lsg-gap);
  }

  /* Snap animations work exactly like the Swiper material plugin: JS writes
     the target snap styles plus an inline transition-duration, and CSS
     interpolates. duration is 0 while dragging (per-frame updates). */
  .lsg-wrap {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--lsg-radius);
    will-change: width, transform;
    pointer-events: auto;
    transition: width 0ms var(--lsg-snap-ease),
      transform 0ms var(--lsg-snap-ease);
  }

  .lsg-content {
    position: absolute;
    top: 0;
    height: 100%;
    width: var(--lsg-slide-size);
    inset-inline-start: calc(50% - var(--lsg-slide-size) / 2);
  }

  .lsg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    will-change: transform;
    transition: transform 0ms var(--lsg-snap-ease);
  }

  /* Placeholder card while a linked product's image is still loading. */
  .lsg-img-empty {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #e8e8e8, #d4d4d4);
  }

  /* ---------- Overlay (name + CTA over the image) ---------- */
  .lsg-overlay {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    height: 60%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    background-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0),
      rgba(0, 0, 0, 0.65) 60%
    );
    transition: opacity 0.4s ease;
  }

  .lsg-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--lsg-overlay-color);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    white-space: nowrap;
    text-align: center;
  }

  .lsg-cta {
    display: inline-block;
    padding: 8px 22px;
    background: transparent;
    color: var(--lsg-overlay-color);
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    border: 2px solid var(--lsg-overlay-color);
    border-radius: 50px;
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  }
  .lsg-cta:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  .lsg-cta:active {
    transform: translateY(0);
  }

  @container (min-width: 768px) {
    .lsg-name {
      font-size: 22px;
    }
    .lsg-cta {
      padding: 9px 28px;
      font-size: 15px;
    }
    .lsg-overlay {
      gap: 16px;
    }
  }

  /* ---------- Nav buttons ---------- */
  .lsg-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 20;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.92);
    color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition: opacity 0.3s ease, transform 0.2s ease;
  }
  .lsg-nav:hover {
    transform: translateY(-50%) scale(1.06);
  }
  .lsg-nav[disabled] {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }
  .lsg-nav svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .lsg-nav-prev {
    inset-inline-start: 10px;
  }
  .lsg-nav-next {
    inset-inline-end: 10px;
  }
  /* Chevron path points "forward" (LTR right). Flip per logical direction. */
  .lsg-section[data-dir="ltr"] .lsg-nav-prev svg,
  .lsg-section[data-dir="rtl"] .lsg-nav-next svg {
    transform: scaleX(-1);
  }

  /* ---------- Empty state (admin, before slides are added) ---------- */
  .lsg-empty {
    width: 100%;
    padding: 3rem 1rem;
    background: var(--lsg-bg);
    color: #6b7280;
    text-align: center;
    font-size: 0.95rem;
  }
`;
