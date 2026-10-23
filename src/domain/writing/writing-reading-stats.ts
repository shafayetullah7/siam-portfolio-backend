const WORDS_PER_MINUTE = 200;

export function countWords(markdown: string): number {
  const trimmed = markdown.trim();
  if (!trimmed) return 0;
  const withoutCode = trimmed.replace(/```[\s\S]*?```/g, ' ');
  const words = withoutCode.split(/\s+/).filter((w) => w.length > 0);
  return words.length;
}

export function readingTimeMinutes(wordCount: number): number {
  if (wordCount <= 0) return 0;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

export function recomputeReadingStats(body: string): {
  wordCount: number;
  readingTimeMinutes: number;
} {
  const wordCount = countWords(body);
  return {
    wordCount,
    readingTimeMinutes: readingTimeMinutes(wordCount),
  };
}
