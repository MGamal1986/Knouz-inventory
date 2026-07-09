declare module "arabic-reshaper" {
  const ArabicReshaper: {
    convertArabic(input: string): string;
    convertArabicBack(input: string): string;
  };
  export default ArabicReshaper;
}

declare module "bidi-js" {
  interface EmbeddingLevelsResult {
    levels: Uint8Array;
    paragraphs: Array<{ start: number; end: number; level: number }>;
  }

  interface Bidi {
    getEmbeddingLevels(text: string, direction?: "ltr" | "rtl"): EmbeddingLevelsResult;
    getReorderSegments(
      text: string,
      embeddingLevels: EmbeddingLevelsResult,
      start?: number,
      end?: number
    ): Array<[number, number]>;
    getMirroredCharactersMap(
      text: string,
      embeddingLevels: EmbeddingLevelsResult,
      start?: number,
      end?: number
    ): Map<number, string>;
  }

  export default function bidiFactory(): Bidi;
}
