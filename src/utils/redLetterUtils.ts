import redLettersData from '../data/red-letters.json';

/**
 * Checks if a specific verse should contain red letters (Jesus' words).
 * Returns the exact strings to highlight if found.
 */
export function shouldHaveRedLetters(bookCode: string, chapter: number, verse: number): string[] | null {
  const { passages } = redLettersData as any;
  const book = passages[bookCode.toLowerCase()];
  if (!book) return null;
  
  const chapterData = book[chapter.toString()];
  if (!chapterData) return null;
  
  const verseStrings = chapterData[verse.toString()];
  return Array.isArray(verseStrings) ? verseStrings : null;
}

/**
 * Formats text to include red letters for Jesus' words using exact string matching.
 */
export function formatRedLetters(text: string, bookCode: string, chapter: number, verse: number): string {
  const highlightStrings = shouldHaveRedLetters(bookCode, chapter, verse);

  if (!highlightStrings || highlightStrings.length === 0) {
    return text;
  }

  let result = text;
  for (const str of highlightStrings) {
    if (!str.trim()) continue;
    
    // Use a safe way to replace the text with the span, ensuring we don't break existing HTML
    // For now, since it's exact text, a simple split/join or replace is effective
    // We use a darker red for accessibility (WCAG AA+)
    const redSpan = `<span class="jesus-words text-red-700 dark:text-red-400 font-medium">${str}</span>`;
    result = result.split(str).join(redSpan);
  }

  return result;
}
