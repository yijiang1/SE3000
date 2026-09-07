// lib/pptx.ts — Export a generated slide deck as a polished PowerPoint (.pptx).
// pptxgenjs is loaded on demand (~1 MB) so it stays out of the initial bundle.
import type { SlideDeckContent, SlideItem } from "@/types/iep";

/* ── Palette ──────────────────────────────────────────────────
   Content-informed: the deck's theme/topic chooses the accent and dark
   tone; the neutral scale is shared so every deck reads as one system. */
interface Palette {
  dark: string;   // cover + closing background
  accent: string; // badges, correct answer, focus line
  tint: string;   // faint accent wash — question card, oversized page numeral
}
const NEUTRAL = {
  ink: "0F172A",        // headings on light
  body: "334155",       // body copy on light
  muted: "94A3B8",      // captions
  onDark: "FFFFFF",
  onDarkMuted: "E2E8F0",
  surface: "FFFFFF",
};
const PALETTES: Record<string, Palette> = {
  space:   { dark: "1E1B4B", accent: "6366F1", tint: "EEF2FF" },
  ocean:   { dark: "0C4A6E", accent: "0EA5E9", tint: "E0F2FE" },
  nature:  { dark: "14532D", accent: "16A34A", tint: "DCFCE7" },
  arts:    { dark: "581C87", accent: "A855F7", tint: "F3E8FF" },
  sports:  { dark: "7C2D12", accent: "EA580C", tint: "FFEDD5" },
  reading: { dark: "134E4A", accent: "0D9488", tint: "CCFBF1" },
  science: { dark: "1E3A8A", accent: "2563EB", tint: "DBEAFE" },
  default: { dark: "1E293B", accent: "4F46E5", tint: "EEF2FF" },
};
const THEME_HINTS: Array<[RegExp, string]> = [
  [/space|rocket|planet|star|galaxy|astronaut|solar|moon|orbit|alien/i, "space"],
  [/ocean|sea|marine|fish|whale|shark|water|wave|beach|coral|boat|sail|river|lake/i, "ocean"],
  [/forest|hike|hiking|nature|tree|mountain|camp|animal|wildlife|garden|plant|bug|insect|farm|dino|weather/i, "nature"],
  [/\bart|music|paint|draw|danc|craft|sing|instrument|theater|drama|movie|photo/i, "arts"],
  [/sport|soccer|basket|baseball|football|hockey|race|running|\bgame|team|recess|\bgym|skate|\bball\b/i, "sports"],
  [/read|book|story|writ|library|\bword|letter|phonic|spell|poem|vocab|grammar/i, "reading"],
  [/science|experiment|\blab\b|discover|explor|robot|\bbuild|engineer|math|number|count|magnet|coding|comput/i, "science"],
];
function pickPalette(content: SlideDeckContent): Palette {
  const hay = `${content.theme || ""} ${content.topic || ""} ${content.targetSkill || ""}`;
  for (const [re, key] of THEME_HINTS) if (re.test(hay)) return PALETTES[key];
  return PALETTES.default;
}

const FONT = "Calibri"; // ships with Office; clean and readable at classroom sizes

/* Layout — LAYOUT_WIDE is 13.333in × 7.5in */
const PAGE_W = 13.333;
const MX = 0.75;                // side margin
const CW = PAGE_W - MX * 2;     // usable content width

function slugify(v: string): string {
  return (v || "slide-deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "slide-deck";
}
function lines(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((l): l is string => typeof l === "string" && l.trim().length > 0).map((l) => l.trim())
    : [];
}
function speakerNotes(slide: SlideItem): string {
  const q = slide.interactiveQuestion;
  const key =
    q && Array.isArray(q.options) && typeof q.correctIndex === "number" && q.options[q.correctIndex]
      ? `Answer: ${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}${q.explanation ? ` — ${q.explanation}` : ""}`
      : "";
  return [slide.teacherNotes, slide.imagePrompt ? `Visual idea: ${slide.imagePrompt}` : "", key].filter(Boolean).join("\n\n");
}

/** Export the deck as a .pptx and trigger a browser download. Client-side only. */
export async function downloadSlideDeckPptx(content: SlideDeckContent): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = content.title || "Slide Deck";
  pptx.subject = content.topic || "";
  pptx.author = "SE 3000";
  pptx.company = "SE 3000";

  const pal = pickPalette(content);
  // Fresh object per call — pptxgenjs converts option objects to EMU in place.
  const cardShadow = () => ({ type: "outer" as const, color: "0F172A", opacity: 0.16, blur: 10, offset: 4, angle: 90 });

  // ── Cover (dark) ────────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: pal.dark };
    s.addShape("ellipse", { x: 9.6, y: 3.6, w: 6.6, h: 6.6, fill: { color: pal.accent, transparency: 80 } });
    s.addShape("ellipse", { x: 11.8, y: 5.9, w: 3.2, h: 3.2, fill: { color: NEUTRAL.onDark, transparency: 91 } });

    if (content.topic) {
      s.addText(content.topic.toUpperCase(), {
        x: MX, y: 2.05, w: CW, h: 0.4, fontFace: FONT, fontSize: 13, bold: true,
        color: pal.tint, charSpacing: 3, isTextBox: true, margin: 0,
      });
    }
    s.addText(content.title || "Slide Deck", {
      x: MX, y: 2.5, w: 10.2, h: 2.1, fontFace: FONT, fontSize: 42, bold: true,
      color: NEUTRAL.onDark, lineSpacingMultiple: 1.03, valign: "top", isTextBox: true, margin: 0,
    });
    const meta = [
      content.theme && `Theme · ${content.theme}`,
      content.readingLevel && `Reading level · ${content.readingLevel}`,
    ].filter(Boolean).join("       ");
    if (meta) {
      s.addText(meta, {
        x: MX, y: 4.62, w: CW, h: 0.4, fontFace: FONT, fontSize: 13,
        color: NEUTRAL.onDarkMuted, isTextBox: true, margin: 0,
      });
    }
    if (content.targetSkill) {
      s.addText(`Focus · ${content.targetSkill}`, {
        x: MX, y: 5.18, w: Math.min(CW, 10), h: 0.9, fontFace: FONT, fontSize: 13, bold: true,
        color: pal.tint, valign: "top", isTextBox: true, margin: 0,
      });
    }
  }

  // ── Content slides ──────────────────────────────────────────
  const slides = Array.isArray(content.slides) ? content.slides : [];
  slides.forEach((slide, i) => {
    const s = pptx.addSlide();
    s.background = { color: NEUTRAL.surface };
    const num = slide.slideNumber ?? i + 1;

    // Motif: an oversized page numeral, faint, bleeding off the top-right corner.
    s.addText(String(num).padStart(2, "0"), {
      x: 10.2, y: -1.0, w: 3.1, h: 3.6, align: "right", valign: "top",
      fontFace: FONT, fontSize: 180, bold: true, color: pal.tint, isTextBox: true, margin: 0,
    });

    s.addText(`SLIDE ${num} OF ${slides.length}`, {
      x: MX, y: 0.6, w: 7, h: 0.32, fontFace: FONT, fontSize: 11, bold: true,
      color: pal.accent, charSpacing: 2, isTextBox: true, margin: 0,
    });
    const title = slide.title || `Slide ${num}`;
    s.addText(title, {
      x: MX, y: 1.0, w: 8.7, h: 1.3, fontFace: FONT, fontSize: title.length > 58 ? 26 : 31, bold: true,
      color: NEUTRAL.ink, lineSpacingMultiple: 1.02, valign: "top", isTextBox: true, margin: 0,
    });

    const body = lines(slide.content);
    const q = slide.interactiveQuestion;
    const hasQ = !!(
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.filter((o) => typeof o === "string").length >= 2
    );

    const cardY = 4.3;
    const bodyTop = 2.3;
    const bodyH = (hasQ ? cardY - 0.25 : 6.7) - bodyTop;

    if (body.length) {
      const longest = body.reduce((m, l) => Math.max(m, l.length), 0);
      // Numbered rows read best with room to breathe; fall back to a compact
      // bulleted list when points are long, numerous, or sharing the slide with
      // a question card.
      const maxRows = hasQ ? 3 : 4;
      if (body.length <= maxRows && longest <= 130) {
        // Numbered rows — accent circle + text
        const step = Math.min(bodyH / body.length, 1.3);
        const fs = body.length >= 4 || longest > 90 ? 15 : 17;
        body.forEach((line, r) => {
          const rowY = bodyTop + r * step;
          const dotY = rowY + (step - 0.44) / 2;
          s.addShape("ellipse", { x: MX, y: dotY, w: 0.44, h: 0.44, fill: { color: pal.accent } });
          s.addText(String(r + 1), {
            x: MX, y: dotY, w: 0.44, h: 0.44, align: "center", valign: "middle",
            fontFace: FONT, fontSize: 13, bold: true, color: NEUTRAL.onDark, isTextBox: true, margin: 0,
          });
          s.addText(line, {
            x: MX + 0.68, y: rowY, w: CW - 0.68 - 0.3, h: step, valign: "middle",
            fontFace: FONT, fontSize: fs, color: NEUTRAL.body, lineSpacingMultiple: 1.06, isTextBox: true, margin: 0,
          });
        });
      } else {
        // Long or many points — plain bulleted list
        s.addText(
          body.map((t, r) => ({
            text: t,
            options: { bullet: true, breakLine: r < body.length - 1, paraSpaceAfter: 9 },
          })),
          {
            x: MX + 0.12, y: bodyTop, w: CW - 0.5, h: bodyH, valign: "top",
            fontFace: FONT, fontSize: longest > 220 ? 13 : 14.5, color: NEUTRAL.body,
            lineSpacingMultiple: 1.12, isTextBox: true, margin: 0,
          },
        );
      }
    }

    if (hasQ && q) {
      const opts = q.options.filter((o): o is string => typeof o === "string").slice(0, 5);
      const cardW = Math.min(CW, 10.2);
      const cardH = 2.62;
      const padX = 0.4;
      s.addShape("roundRect", {
        x: MX, y: cardY, w: cardW, h: cardH, rectRadius: 0.05,
        fill: { color: pal.tint }, shadow: cardShadow(),
      });
      s.addText("QUICK CHECK", {
        x: MX + padX, y: cardY + 0.24, w: 4, h: 0.28, fontFace: FONT, fontSize: 10.5, bold: true,
        color: pal.accent, charSpacing: 2, isTextBox: true, margin: 0,
      });
      s.addText(q.question, {
        x: MX + padX, y: cardY + 0.56, w: cardW - padX * 2, h: 0.66, fontFace: FONT, fontSize: 14.5, bold: true,
        color: NEUTRAL.ink, lineSpacingMultiple: 1.05, valign: "top", isTextBox: true, margin: 0,
      });
      const optTop = cardY + 1.32;
      const oStep = Math.min((cardY + cardH - 0.24 - optTop) / opts.length, 0.36);
      const oFs = opts.reduce((m, o) => Math.max(m, o.length), 0) > 58 ? 10.5 : 11.5;
      opts.forEach((opt, j) => {
        const oy = optTop + j * oStep;
        const correct = j === q.correctIndex;
        s.addText(String.fromCharCode(65 + j), {
          x: MX + padX, y: oy, w: 0.3, h: oStep, valign: "middle",
          fontFace: FONT, fontSize: oFs, bold: true, color: correct ? pal.accent : NEUTRAL.muted,
          isTextBox: true, margin: 0,
        });
        s.addText(`${opt}${correct ? "   ✓" : ""}`, {
          x: MX + padX + 0.36, y: oy, w: cardW - padX * 2 - 0.36, h: oStep, valign: "middle",
          fontFace: FONT, fontSize: oFs, bold: correct, color: correct ? pal.accent : NEUTRAL.body,
          isTextBox: true, margin: 0,
        });
      });
    }

    const notes = speakerNotes(slide);
    if (notes) s.addNotes(notes);
  });

  if (!slides.length) {
    const s = pptx.addSlide();
    s.background = { color: NEUTRAL.surface };
    s.addText("This deck has no slides yet.", {
      x: MX, y: 3.2, w: CW, h: 1, fontFace: FONT, fontSize: 20, color: NEUTRAL.muted, isTextBox: true, margin: 0,
    });
  }

  // ── Closing (dark) ─────────────────────────────────────────
  {
    const s = pptx.addSlide();
    s.background = { color: pal.dark };
    s.addShape("ellipse", { x: -2.6, y: -2.6, w: 6.8, h: 6.8, fill: { color: pal.accent, transparency: 80 } });
    if (content.topic) {
      s.addText(content.topic.toUpperCase(), {
        x: MX, y: 2.5, w: CW, h: 0.4, fontFace: FONT, fontSize: 13, bold: true,
        color: pal.tint, charSpacing: 3, isTextBox: true, margin: 0,
      });
    }
    s.addText("Questions?", {
      x: MX, y: 2.95, w: CW, h: 1.3, fontFace: FONT, fontSize: 46, bold: true,
      color: NEUTRAL.onDark, isTextBox: true, margin: 0,
    });
    const close = content.targetSkill ? `Today's focus · ${content.targetSkill}` : content.title || "";
    if (close) {
      s.addText(close, {
        x: MX, y: 4.35, w: CW, h: 0.8, fontFace: FONT, fontSize: 14,
        color: NEUTRAL.onDarkMuted, valign: "top", isTextBox: true, margin: 0,
      });
    }
  }

  await pptx.writeFile({ fileName: `${slugify(content.title)}.pptx` });
}
