import { css } from "lit";

export const heroStyles = css`
  :host {
    /* Inherits from the theme so Arabic font, brand colours, and dir flow through. */
    display: block;
    font-family: inherit;
    direction: inherit;

    /* Tunable CSS custom properties — merchants/themes can override at :root. */
    --gh-height-full: 100svh;
    --gh-height-large: 80svh;
    --gh-height-medium: 60svh;
    --gh-height-compact: 45svh;

    --gh-content-max: 720px;
    --gh-inline-pad: clamp(1.25rem, 4vw, 3.5rem);
    --gh-block-pad: clamp(2rem, 6vw, 5rem);

    --gh-headline-size: clamp(2rem, 5.5vw, 4.5rem);
    --gh-subtitle-size: clamp(1rem, 1.6vw, 1.25rem);
    --gh-eyebrow-size: clamp(0.75rem, 1vw, 0.875rem);

    --gh-radius: 14px;
    --gh-btn-radius: 999px;
    --gh-easing: cubic-bezier(0.22, 1, 0.36, 1);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  .hero {
    position: relative;
    width: 100%;
    overflow: hidden;
    isolation: isolate;
    color: #fff;
    background: #0b0b0f;
  }

  .hero[data-height="full"]    { min-height: var(--gh-height-full); }
  .hero[data-height="large"]   { min-height: var(--gh-height-large); }
  .hero[data-height="medium"]  { min-height: var(--gh-height-medium); }
  .hero[data-height="compact"] { min-height: var(--gh-height-compact); }

  .hero[data-text-theme="dark"] {
    color: #0b0b0f;
  }

  /* --- Background layer --- */
  .bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }
  .bg > img,
  .bg > video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    will-change: transform;
  }
  .bg.is-ken-burns > img {
    animation: kenBurns 18s var(--gh-easing) infinite alternate;
  }
  .bg.is-parallax > video,
  .bg.is-parallax > img {
    transform: translate3d(0, var(--gh-parallax, 0), 0) scale(1.06);
    transition: transform 0.12s linear;
  }
  .bg.is-gradient {
    background: linear-gradient(
      var(--gh-gradient-angle, 135deg),
      var(--gh-gradient-from, #1e1b4b),
      var(--gh-gradient-to, #7c3aed)
    );
  }

  /* --- Overlay layer --- */
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
  .overlay[data-style="dark-bottom"] {
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, var(--gh-overlay-a, 0.7)) 0%,
      rgba(0, 0, 0, calc(var(--gh-overlay-a, 0.7) * 0.5)) 40%,
      rgba(0, 0, 0, 0) 75%
    );
  }
  .overlay[data-style="dark-full"] {
    background: rgba(0, 0, 0, var(--gh-overlay-a, 0.45));
  }
  .overlay[data-style="light-full"] {
    background: rgba(255, 255, 255, var(--gh-overlay-a, 0.55));
  }
  .overlay[data-style="vignette"] {
    background: radial-gradient(
      ellipse at center,
      rgba(0, 0, 0, 0) 40%,
      rgba(0, 0, 0, var(--gh-overlay-a, 0.65)) 100%
    );
  }

  /* --- Content layer --- */
  .content-wrap {
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    min-height: inherit;
    padding-inline: var(--gh-inline-pad);
    padding-block: var(--gh-block-pad);
  }
  .hero[data-align-v="top"]    .content-wrap { align-items: flex-start; }
  .hero[data-align-v="middle"] .content-wrap { align-items: center; }
  .hero[data-align-v="bottom"] .content-wrap { align-items: flex-end; }

  .hero[data-align-h="start"]  .content-wrap { justify-content: flex-start; text-align: start; }
  .hero[data-align-h="center"] .content-wrap { justify-content: center;    text-align: center; }
  .hero[data-align-h="end"]    .content-wrap { justify-content: flex-end;  text-align: end; }

  .content {
    max-width: var(--gh-content-max);
    display: flex;
    flex-direction: column;
    gap: clamp(0.75rem, 1.8vw, 1.5rem);
  }
  .hero[data-align-h="center"] .content { align-items: center; }
  .hero[data-align-h="end"]    .content { align-items: flex-end; }

  /* --- Typography --- */
  .eyebrow {
    font-size: var(--gh-eyebrow-size);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.9;
    margin: 0;
    /* Arabic has no uppercase — respect script */
    &:dir(rtl) { letter-spacing: 0; text-transform: none; }
  }
  .headline {
    font-size: var(--gh-headline-size);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0;
    text-wrap: balance;
  }
  .headline:dir(rtl) {
    letter-spacing: 0;
    line-height: 1.3;
  }
  .subtitle {
    font-size: var(--gh-subtitle-size);
    line-height: 1.6;
    opacity: 0.92;
    margin: 0;
    max-width: 54ch;
    text-wrap: pretty;
  }

  /* --- CTAs --- */
  .ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    font: inherit;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    border-radius: var(--gh-btn-radius);
    border: 1.5px solid transparent;
    cursor: pointer;
    transition:
      transform 0.25s var(--gh-easing),
      background-color 0.25s var(--gh-easing),
      border-color 0.25s var(--gh-easing),
      color 0.25s var(--gh-easing),
      box-shadow 0.25s var(--gh-easing);
    white-space: nowrap;
  }
  .btn-primary {
    background: var(--gh-btn-bg, #ffffff);
    color: var(--gh-btn-fg, #0b0b0f);
    box-shadow: 0 8px 24px -10px rgba(0, 0, 0, 0.45);
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px -10px rgba(0, 0, 0, 0.55);
  }
  .btn-outline {
    background: transparent;
    color: currentColor;
    border-color: currentColor;
    backdrop-filter: blur(6px);
  }
  .btn-outline:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
  }
  .hero[data-text-theme="dark"] .btn-outline:hover {
    background: rgba(0, 0, 0, 0.08);
  }

  /* --- Entrance motion --- */
  .content[data-anim="ready"] > * {
    opacity: 0;
    transform: translateY(14px);
  }
  .content[data-anim="in"] > * {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.7s var(--gh-easing),
      transform 0.7s var(--gh-easing);
  }
  .content[data-anim="in"] > *:nth-child(1) { transition-delay: 0.05s; }
  .content[data-anim="in"] > *:nth-child(2) { transition-delay: 0.15s; }
  .content[data-anim="in"] > *:nth-child(3) { transition-delay: 0.28s; }
  .content[data-anim="in"] > *:nth-child(4) { transition-delay: 0.40s; }

  @media (prefers-reduced-motion: reduce) {
    .bg.is-ken-burns > img { animation: none; }
    .bg.is-parallax > video, .bg.is-parallax > img { transform: none; }
    .content[data-anim] > * { opacity: 1 !important; transform: none !important; transition: none !important; }
  }

  @keyframes kenBurns {
    0%   { transform: scale(1.00) translate3d(0, 0, 0); }
    100% { transform: scale(1.08) translate3d(-1.5%, -1%, 0); }
  }

  /* --- Mobile tuning --- */
  @media (max-width: 640px) {
    :host {
      --gh-headline-size: clamp(1.75rem, 8vw, 2.5rem);
    }
    .ctas { width: 100%; flex-direction: column; }
    .ctas .btn { width: 100%; }
  }
`;