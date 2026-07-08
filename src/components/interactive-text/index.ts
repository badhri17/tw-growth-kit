import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { GrowthElement } from "../../shared/growth-element";
import type {
  AnimationSpeed,
  AnimationStyle,
  BgStyle,
  ButtonStyle,
  ContentWidth,
  EnterDirection,
  HighlightStyle,
  InteractiveTextConfig,
  SectionSpacing,
  TextAlign,
  TextSegment,
  TextSize,
  TextSizeDesktop,
  TextTheme,
} from "./types";
import { interactiveTextStyles } from "./style";

/** Speed tier → multiplier applied to durations, staggers and typing cadence. */
const SPEED_MULT: Record<AnimationSpeed, number> = {
  slow: 1.45,
  normal: 1,
  fast: 0.65,
};

/** Word-by-word splitting falls back to a block fade past this many words. */
const MAX_SPLIT_WORDS = 80;

/**
 * <growth-interactive-text> — Interactive Text (النص التفاعلي)
 * Part of the Growth Kit bundle for Salla Twilight.
 *
 * A premium text section — eyebrow, title with highlighted words, subtitle,
 * paragraph and an optional CTA — with a merchant-selected entrance animation
 * (fade / slide / curtain reveal / typewriter / word-by-word / line-by-line)
 * that plays once when the section scrolls into view.
 *
 *   • Word and line splitting only — never per-letter — so Arabic letter
 *     joining is always preserved (the typewriter slices the raw string, which
 *     the browser re-shapes naturally, exactly like real typing).
 *   • All motion is transform/opacity transitions gated by an
 *     IntersectionObserver; nothing animates off-screen and nothing loops.
 *   • Highlight styles: accent colour, gradient text, marker, animated
 *     underline draw.
 *
 * RTL-first and mobile-first throughout; respects prefers-reduced-motion.
 */
export default class GrowthInteractiveText extends GrowthElement {
  static styles = interactiveTextStyles;


  @property({ type: Object })
  config?: InteractiveTextConfig;

  /** Flips once when the section scrolls into view; gates every transition. */
  @state() private _entered = false;
  /** Characters of the title revealed so far (typewriter mode). */
  @state() private _typedCount = 0;
  /** Typewriter finished — releases the .it-post blocks below the title. */
  @state() private _typingDone = false;

  private _io: IntersectionObserver | null = null;
  private _typingTimer: number | null = null;
  private _reduced = false;

  // ------------------------------------------------------------
  // Value helpers
  // ------------------------------------------------------------


  private _isRtl(): boolean {
    const dir = (document.documentElement.dir || "").toLowerCase();
    if (dir === "ltr") return false;
    if (dir === "rtl") return true;
    return this._lang() === "ar";
  }



  /** #rgb / #rrggbb → translucent rgba; anything else falls back to color-mix. */
  private _softColor(c: string, alpha: number): string {
    const hex = c.trim().replace(/^#/, "");
    const ok = /^[0-9a-f]{3}$/i.test(hex) || /^[0-9a-f]{6}$/i.test(hex);
    if (!ok)
      return `color-mix(in srgb, ${c} ${Math.round(alpha * 100)}%, transparent)`;
    const full =
      hex.length === 3 ? hex.split("").map((ch) => ch + ch).join("") : hex;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  // ------------------------------------------------------------
  // Text segmentation (highlight matching)
  // ------------------------------------------------------------

  /** [start, end) ranges of every case-insensitive highlight match. */
  private _matchRanges(text: string, needle: string): Array<[number, number]> {
    const hl = needle.trim();
    if (!text || !hl) return [];
    const haystack = text.toLowerCase();
    const target = hl.toLowerCase();
    const ranges: Array<[number, number]> = [];
    let pos = 0;
    while (pos <= haystack.length - target.length) {
      const idx = haystack.indexOf(target, pos);
      if (idx === -1) break;
      ranges.push([idx, idx + target.length]);
      pos = idx + target.length;
    }
    return ranges;
  }

  /** Split into highlighted / plain runs (block + typewriter rendering). */
  private _segments(text: string, needle: string): TextSegment[] {
    if (!text) return [];
    const ranges = this._matchRanges(text, needle);
    if (ranges.length === 0) return [{ text, hl: false }];
    const segs: TextSegment[] = [];
    let pos = 0;
    for (const [start, end] of ranges) {
      if (start > pos) segs.push({ text: text.slice(pos, start), hl: false });
      segs.push({ text: text.slice(start, end), hl: true });
      pos = end;
    }
    if (pos < text.length) segs.push({ text: text.slice(pos), hl: false });
    return segs;
  }

  /**
   * Split into whole words, flagging any word that overlaps a highlight match.
   * Whole words only: an inline-block boundary inside an Arabic word would
   * break letter joining.
   */
  private _words(text: string, needle: string): TextSegment[] {
    const ranges = this._matchRanges(text, needle);
    const out: TextSegment[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const start = m.index;
      const end = start + m[0].length;
      out.push({
        text: m[0],
        hl: ranges.some(([s, e]) => start < e && end > s),
      });
    }
    return out;
  }

  private _lines(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  // ------------------------------------------------------------
  // Lifecycle
  // ------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    this._reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (this._reduced) {
      this._entered = true;
      this._typingDone = true;
    }
  }

  firstUpdated() {
    if (this._entered) return;
    if (!("IntersectionObserver" in window)) {
      this._entered = true;
      return;
    }
    this._io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this._entered = true;
          this._io?.disconnect();
          this._io = null;
        }
      },
      { threshold: 0.15 }
    );
    this._io.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._io?.disconnect();
    this._io = null;
    this._stopTyping();
  }

  updated(_changed: PropertyValues) {
    if (
      this._anim() === "typing" &&
      this._entered &&
      !this._typingDone &&
      this._typingTimer === null
    ) {
      this._startTyping();
    }
  }

  // ------------------------------------------------------------
  // Typewriter
  // ------------------------------------------------------------

  private _anim(): AnimationStyle {
    if (this._reduced) return "none";
    return this._pickValue<AnimationStyle>(
      this.config?.animation_style,
      "words"
    );
  }

  private _speedMult(): number {
    return SPEED_MULT[
      this._pickValue<AnimationSpeed>(this.config?.animation_speed, "normal")
    ];
  }

  private _typingInterval(): number {
    return Math.max(28, Math.round(58 * this._speedMult()));
  }

  private _startTyping() {
    if (this._t(this.config?.title).length === 0) {
      this._typingDone = true;
      return;
    }
    this._typingTimer = window.setInterval(() => {
      const len = this._t(this.config?.title).length;
      if (this._typedCount >= len) {
        this._stopTyping();
        // Small pause before the caret hands over to the blocks below.
        window.setTimeout(() => {
          this._typingDone = true;
        }, 350);
        return;
      }
      this._typedCount += 1;
    }, this._typingInterval());
  }

  private _stopTyping() {
    if (this._typingTimer !== null) {
      window.clearInterval(this._typingTimer);
      this._typingTimer = null;
    }
  }

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  render() {
    const c: InteractiveTextConfig = this.config || {};
    const ar = this._lang() === "ar";
    const rtl = this._isRtl();

    const anim = this._anim();
    const mult = this._speedMult();
    const direction = this._pickValue<EnterDirection>(c.enter_direction, "up");
    const align = this._pickValue<TextAlign>(c.text_align, "center");
    const sizeMobile = this._pickValue<TextSize>(c.text_size_mobile, "medium");
    const sizeDesktopRaw = this._pickValue<TextSizeDesktop>(
      c.text_size_desktop,
      "inherit"
    );
    const sizeDesktop =
      sizeDesktopRaw === "inherit" ? sizeMobile : sizeDesktopRaw;
    const width = this._pickValue<ContentWidth>(c.content_width, "medium");
    const spacing = this._pickValue<SectionSpacing>(c.spacing, "normal");
    const theme = this._pickValue<TextTheme>(c.theme, "light");
    const bgStyle = this._pickValue<BgStyle>(c.bg_style, "transparent");
    const hlStyle = this._pickValue<HighlightStyle>(
      c.highlight_style,
      "gradient"
    );
    const btnStyle = this._pickValue<ButtonStyle>(c.button_style, "solid");

    const eyebrow = this._t(c.eyebrow);
    const title = this._t(c.title);
    const highlight = this._t(c.highlight_words);
    const subtitle = this._t(c.subtitle);
    const paragraph = this._t(c.paragraph);
    const btnText = this._t(c.button_text);
    const btnUrl = (c.button_url || "").trim();

    if (!eyebrow && !title && !subtitle && !paragraph) {
      return html`<section
        class="it"
        data-theme=${theme}
        data-bg="transparent"
        data-spacing="normal"
        data-width="medium"
        data-size="medium"
        data-size-desktop="medium"
      >
        <p class="it-empty">
          ${ar
            ? "أضف عنوانًا أو فقرة لعرض هذا القسم."
            : "Add a title or a paragraph to display this section."}
        </p>
      </section>`;
    }

    // --- Stagger schedule -------------------------------------------------
    const blockStep = 0.14 * mult;
    const wordStep = 0.055 * mult;
    const lineStep = 0.18 * mult;

    const titleWords = anim === "words" ? this._words(title, highlight) : [];
    const titleLines = anim === "lines" ? this._lines(title) : [];
    const paraWords = anim === "words" ? this._words(paragraph, "") : [];
    const paraLines = anim === "lines" ? this._lines(paragraph) : [];
    const splitParaWords =
      anim === "words" &&
      paraWords.length > 0 &&
      paraWords.length <= MAX_SPLIT_WORDS;

    let cursor = 0.08;
    const delays = {
      eyebrow: 0,
      title: 0,
      subtitle: 0,
      paragraph: 0,
      button: 0,
    };
    if (eyebrow) {
      delays.eyebrow = cursor;
      cursor += blockStep;
    }
    if (title) {
      delays.title = cursor;
      if (anim === "words") cursor += titleWords.length * wordStep + 0.1;
      else if (anim === "lines") cursor += titleLines.length * lineStep;
      else cursor += blockStep;
    }
    if (subtitle) {
      delays.subtitle = cursor;
      cursor += blockStep;
    }
    if (paragraph) {
      delays.paragraph = cursor;
      if (anim === "lines") cursor += paraLines.length * lineStep;
      else if (splitParaWords) cursor += paraWords.length * wordStep;
      else cursor += blockStep;
    }
    if (btnText) {
      delays.button = cursor;
      cursor += blockStep;
    }

    // Marker/underline draw fires after the text has settled. In typewriter
    // mode it waits for its own characters to finish typing instead.
    const hlDraw =
      anim === "typing"
        ? (title.length * this._typingInterval()) / 1000 + 0.4
        : cursor + 0.1;

    // In typewriter mode the blocks below the title are gated by data-typed,
    // so their delays restart from zero once typing completes.
    if (anim === "typing") {
      delays.subtitle = 0;
      delays.paragraph = 0.12 * mult;
      delays.button = 0.24 * mult;
    }

    // Effect of plain blocks for the current mode (split units animate
    // themselves, so their parent block stays at data-fx="none").
    const blockFx =
      anim === "fade"
        ? "fade"
        : anim === "slide"
          ? "slide"
          : anim === "none"
            ? "none"
            : "rise";

    // --- Host style -------------------------------------------------------
    const slide = { fx: "0px", fy: "0px" };
    if (anim === "slide") {
      if (direction === "up") slide.fy = "30px";
      else if (direction === "down") slide.fy = "-30px";
      else if (direction === "start") slide.fx = rtl ? "36px" : "-36px";
      else slide.fx = rtl ? "-36px" : "36px";
    }

    const accent = (c.accent_color || "").trim();
    const hostStyle = [
      `--it-dur:${(0.7 * mult).toFixed(2)}s`,
      `--it-wdur:${(0.55 * mult).toFixed(2)}s`,
      `--it-rdur:${(0.9 * mult).toFixed(2)}s`,
      `--it-fx:${slide.fx}`,
      `--it-fy:${slide.fy}`,
      `--hd:${hlDraw.toFixed(2)}s`,
      `--it-grad-dir:${rtl ? "270deg" : "90deg"}`,
      `--it-hl-x:${rtl ? "right" : "left"}`,
      accent ? `--it-accent:${accent}` : "",
      accent ? `--it-accent-soft:${this._softColor(accent, 0.22)}` : "",
      c.accent_color_2 ? `--it-accent-2:${c.accent_color_2}` : "",
      c.bg_color ? `--it-bg:${c.bg_color}` : "",
      c.bg_grad_1 ? `--it-grad-1:${c.bg_grad_1}` : "",
      c.bg_grad_2 ? `--it-grad-2:${c.bg_grad_2}` : "",
      c.title_color ? `--it-title-c:${c.title_color}` : "",
      c.subtitle_color ? `--it-subtitle-c:${c.subtitle_color}` : "",
      c.text_color ? `--it-text-c:${c.text_color}` : "",
      c.button_text_color ? `--it-btn-text:${c.button_text_color}` : "",
    ]
      .filter(Boolean)
      .join("; ");

    const entered = anim === "none" ? true : this._entered;
    const typed = anim === "typing" ? this._typingDone : true;

    return html`
      <section
        class="it"
        style=${hostStyle}
        data-entered=${entered ? "true" : "false"}
        data-typed=${typed ? "true" : "false"}
        data-anim=${anim}
        data-theme=${theme}
        data-bg=${bgStyle}
        data-align=${align}
        data-size=${sizeMobile}
        data-size-desktop=${sizeDesktop}
        data-spacing=${spacing}
        data-width=${width}
        data-dir=${rtl ? "rtl" : "ltr"}
      >
        <div class="it-inner">
          ${eyebrow
            ? html`<p
                class="it-eyebrow it-block"
                data-fx=${anim === "reveal" ? "none" : blockFx}
                style="--d:${delays.eyebrow.toFixed(2)}s"
              >
                ${this._wrapReveal(anim, html`${eyebrow}`)}
              </p>`
            : nothing}
          ${title
            ? this._renderTitle(
                anim,
                title,
                highlight,
                hlStyle,
                titleWords,
                titleLines,
                delays.title,
                wordStep,
                lineStep,
                blockFx
              )
            : nothing}
          ${subtitle
            ? html`<p
                class="it-subtitle it-block ${anim === "typing"
                  ? "it-post"
                  : ""}"
                data-fx=${anim === "reveal" ? "none" : blockFx}
                style="--d:${delays.subtitle.toFixed(2)}s"
              >
                ${this._wrapReveal(anim, html`${subtitle}`)}
              </p>`
            : nothing}
          ${paragraph
            ? this._renderParagraph(
                anim,
                paragraph,
                paraWords,
                paraLines,
                splitParaWords,
                delays.paragraph,
                wordStep,
                lineStep,
                blockFx
              )
            : nothing}
          ${btnText
            ? html`<a
                class="it-btn it-block ${anim === "typing" ? "it-post" : ""}"
                data-style=${btnStyle}
                data-fx=${anim === "reveal" ? "rise" : blockFx}
                style="--d:${delays.button.toFixed(2)}s"
                href=${btnUrl || "#"}
              >
                <span>${btnText}</span>
                ${btnStyle === "ghost"
                  ? html`<span class="it-btn-arrow" aria-hidden="true"
                      >${rtl ? "←" : "→"}</span
                    >`
                  : nothing}
              </a>`
            : nothing}
        </div>
      </section>
    `;
  }

  /** In reveal mode, wrap a block's content in the curtain clip structure. */
  private _wrapReveal(anim: AnimationStyle, content: unknown) {
    if (anim !== "reveal") return content;
    return html`<span class="it-clip"
      ><span class="it-reveal">${content}</span></span
    >`;
  }

  private _renderInlineSegments(segs: TextSegment[], hlStyle: HighlightStyle) {
    return segs.map((s) =>
      s.hl
        ? html`<span class="it-hl" data-hl=${hlStyle}>${s.text}</span>`
        : html`${s.text}`
    );
  }

  private _renderWordSpans(
    words: TextSegment[],
    hlStyle: HighlightStyle,
    base: number,
    step: number
  ) {
    return words.map(
      (w, i) =>
        html`<span
            class="it-w ${w.hl ? "it-hl" : ""}"
            data-hl=${w.hl ? hlStyle : nothing}
            style="--d:${(base + i * step).toFixed(2)}s"
            >${w.text}</span
          >${" "}`
    );
  }

  private _renderTitle(
    anim: AnimationStyle,
    title: string,
    highlight: string,
    hlStyle: HighlightStyle,
    words: TextSegment[],
    lines: string[],
    base: number,
    wordStep: number,
    lineStep: number,
    blockFx: string
  ) {
    // Split/typed modes fragment the visual text — give assistive tech the
    // intact string and hide the fragments.
    const fragmented = anim === "words" || anim === "lines" || anim === "typing";

    let inner;
    if (anim === "words") {
      inner = this._renderWordSpans(words, hlStyle, base, wordStep);
    } else if (anim === "lines") {
      inner = lines.map(
        (line, i) =>
          html`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(base + i * lineStep).toFixed(2)}s"
              >${this._renderInlineSegments(
                this._segments(line, highlight),
                hlStyle
              )}</span
            ></span
          >`
      );
    } else if (anim === "typing") {
      inner = html`${this._renderTyped(
        this._segments(title, highlight),
        hlStyle
      )}${this._entered && !this._typingDone
        ? html`<span class="it-caret" aria-hidden="true"></span>`
        : nothing}`;
    } else {
      inner = this._wrapReveal(
        anim,
        html`${this._renderInlineSegments(
          this._segments(title, highlight),
          hlStyle
        )}`
      );
    }

    return html`<h2
      class="it-title it-block"
      data-fx=${fragmented || anim === "reveal" ? "none" : blockFx}
      style="--d:${base.toFixed(2)}s"
      aria-label=${fragmented ? title.replace(/\s+/g, " ") : nothing}
    >
      ${fragmented ? html`<span aria-hidden="true">${inner}</span>` : inner}
    </h2>`;
  }

  /** Typewriter: walk the highlight segments, slicing up to the typed count. */
  private _renderTyped(segs: TextSegment[], hlStyle: HighlightStyle) {
    let remaining = this._typedCount;
    const out = [];
    for (const s of segs) {
      if (remaining <= 0) break;
      const take = Math.min(s.text.length, remaining);
      remaining -= take;
      const text = s.text.slice(0, take);
      out.push(
        s.hl
          ? html`<span class="it-hl" data-hl=${hlStyle}>${text}</span>`
          : html`${text}`
      );
    }
    return out;
  }

  private _renderParagraph(
    anim: AnimationStyle,
    paragraph: string,
    words: TextSegment[],
    lines: string[],
    splitWords: boolean,
    base: number,
    wordStep: number,
    lineStep: number,
    blockFx: string
  ) {
    const split = (anim === "words" && splitWords) || anim === "lines";

    let inner;
    if (anim === "lines") {
      inner = lines.map(
        (line, i) =>
          html`<span class="it-clip"
            ><span
              class="it-line"
              style="--d:${(base + i * lineStep).toFixed(2)}s"
              >${line}</span
            ></span
          >`
      );
    } else if (split) {
      inner = this._renderWordSpans(words, "color", base, wordStep);
    } else {
      inner = this._wrapReveal(anim, html`${paragraph}`);
    }

    return html`<p
      class="it-paragraph it-block ${anim === "typing" ? "it-post" : ""}"
      data-split=${split ? "true" : nothing}
      data-fx=${split || anim === "reveal" ? "none" : blockFx}
      style="--d:${base.toFixed(2)}s"
      aria-label=${split ? paragraph.replace(/\s+/g, " ") : nothing}
    >
      ${split ? html`<span aria-hidden="true">${inner}</span>` : inner}
    </p>`;
  }
}
