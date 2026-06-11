import { css } from "lit";

/**
 * Growth Kit — Interactive Text (النص التفاعلي) styles.
 *
 * Animation model:
 *  - The section carries data-entered="false" until it scrolls into view, then
 *    flips to "true"; every animated unit transitions to its natural state with
 *    a per-unit `--d` (transition-delay) computed in JS.
 *  - Each block declares its own effect via data-fx (fade / rise / slide /
 *    none). Word, line and curtain-reveal units animate themselves and leave
 *    their parent block at data-fx="none".
 *  - Typewriter mode reveals title characters in JS; the blocks below the
 *    title carry .it-post and are gated by data-typed instead of data-entered.
 *
 * Everything animates with transform/opacity only (compositor-friendly);
 * the one exception is the tiny one-shot background-size draw of the
 * marker/underline highlight.
 */
export const interactiveTextStyles = css`
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
