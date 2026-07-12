import ArabicReshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_CHAR_REGEX = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/**
 * Reorders a string into visual (left-to-right storage) order per the Unicode
 * Bidirectional Algorithm. Crucially this keeps European-number and Latin runs
 * left-to-right while reversing Arabic runs, so embedded prices / building
 * numbers ("عمارة 11", "عيار 21") are not mangled the way a naive reverse would.
 */
function toVisualOrder(text: string): string {
  const chars = text.split("");
  const embeddingLevels = bidi.getEmbeddingLevels(text);

  const mirrored = bidi.getMirroredCharactersMap(text, embeddingLevels);
  mirrored.forEach((replacement, index) => {
    chars[index] = replacement;
  });

  bidi.getReorderSegments(text, embeddingLevels).forEach(([start, end]) => {
    let lo = start;
    let hi = end;
    while (lo < hi) {
      const tmp = chars[lo];
      chars[lo] = chars[hi];
      chars[hi] = tmp;
      lo++;
      hi--;
    }
  });

  return chars.join("");
}

/**
 * Prepares Arabic (or mixed) text for rendering with pdfkit.
 *
 * pdfkit delegates to fontkit, which — for a run it detects as Arabic — applies
 * a *whole-run* reversal during layout (it is not a full bidi engine). So the
 * pipeline is:
 *   1. Join letters into contextual presentation forms (arabic-reshaper), done
 *      on the original logical order so neighbours are correct.
 *   2. Reorder to true visual order with a real bidi pass (protects number/Latin
 *      runs that fontkit's blanket reversal would otherwise flip).
 *   3. Reverse once more to pre-compensate for fontkit's own whole-run reversal,
 *      which cancels out and leaves our exact visual order on the page.
 *
 * MUST be rendered with `{ features: [], lineBreak: false }` so pdfkit lays the
 * whole string out as a single run — its per-word cache path would reverse each
 * word individually and corrupt the result.
 *
 * Non-Arabic text (plain Latin/numeric) passes through untouched.
 */
export function shapeArabic(text: string): string {
  if (!text || !ARABIC_CHAR_REGEX.test(text)) return text;

  const reshaped = ArabicReshaper.convertArabic(text);
  const visual = toVisualOrder(reshaped);
  return visual.split("").reverse().join("");
}

export function hasArabic(text: string): boolean {
  return ARABIC_CHAR_REGEX.test(text);
}
