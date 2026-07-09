import ArabicReshaper from "arabic-reshaper";
import bidiFactory from "bidi-js";

const bidi = bidiFactory();

const ARABIC_CHAR_REGEX = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/**
 * Joins Arabic letters into their contextual presentation forms and reorders
 * the string into visual (left-to-right storage) order per the Unicode
 * Bidirectional Algorithm, since pdfkit does not do either on its own.
 * Non-Arabic text (or plain Latin/numeric strings) passes through unchanged.
 */
export function shapeText(text: string): string {
  if (!text || !ARABIC_CHAR_REGEX.test(text)) return text;

  const reshaped = ArabicReshaper.convertArabic(text);
  const chars = reshaped.split("");
  const embeddingLevels = bidi.getEmbeddingLevels(reshaped);

  const mirrored = bidi.getMirroredCharactersMap(reshaped, embeddingLevels);
  mirrored.forEach((replacement, index) => {
    chars[index] = replacement;
  });

  const flips = bidi.getReorderSegments(reshaped, embeddingLevels);
  flips.forEach(([start, end]) => {
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
