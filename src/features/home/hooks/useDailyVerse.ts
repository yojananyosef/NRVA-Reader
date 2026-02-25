import { useState, useEffect } from 'preact/hooks';
import { fetchBibleBook } from '../../../utils/bibleService';
import { fetchWithCache } from '../../../utils/fetchWithCache';
import booksIndex from '../../../data/books-index.json';

interface DailyVerse {
    date: string;
    bookCode: string;
    bookName: string;
    chapter: string;
    verse: string;
    text: string;
}

const STORAGE_KEY = 'daily-verse-history';
const CURRENT_VERSE_KEY = 'current-daily-verse';

// Helper to get date string in local timezone (YYYY-MM-DD)
const getLocalDateString = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function useDailyVerse() {
    const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDailyVerse();
    }, []);

    const loadDailyVerse = async () => {
        try {
            const today = getLocalDateString();
            const storedVerse = localStorage.getItem(CURRENT_VERSE_KEY);

            if (storedVerse) {
                const parsed: DailyVerse = JSON.parse(storedVerse);
                if (parsed.date === today) {
                    setDailyVerse(parsed);
                    setLoading(false);
                    return;
                }
            }

            // Generate new verse
            await generateNewVerse(today);
        } catch (err) {
            console.error('Error loading daily verse:', err);
            setError('No se pudo cargar el versículo diario');
            setLoading(false);
        }
    };

    const generateNewVerse = async (date: string) => {
        try {
            const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            let attempts = 0;
            const maxAttempts = 30; // Increased attempts to find one with commentary

            while (attempts < maxAttempts) {
                // 1. Pick random book
                const randomBook = booksIndex[Math.floor(Math.random() * booksIndex.length)];

                // 2. Pick random chapter
                const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;

                // 3. Check if commentary exists for this book/chapter
                const commentaryData = await fetchWithCache<any>(`/data/commentary/${randomBook.code}.json`);
                if (!commentaryData || !commentaryData.chapters) {
                    attempts++;
                    continue;
                }

                const chapterCommentary = commentaryData.chapters.find((c: any) => c.chapter === randomChapter);
                if (!chapterCommentary || !chapterCommentary.verses || chapterCommentary.verses.length === 0) {
                    attempts++;
                    continue;
                }

                // Get list of verses that have commentary in this chapter
                const versesWithCommentary = chapterCommentary.verses.map((v: any) => v.verse.toString());

                // 4. Fetch book data to get the text
                const bookData = await fetchBibleBook(randomBook.code);
                if (!bookData || !bookData.capitulo || !bookData.capitulo[randomChapter]) {
                    attempts++;
                    continue;
                }

                const chapterData = bookData.capitulo[randomChapter];

                // Intersection between available verses in book and verses with commentary
                const availableVerses = Object.keys(chapterData).filter(v => versesWithCommentary.includes(v));

                if (availableVerses.length === 0) {
                    attempts++;
                    continue;
                }

                // 5. Pick random verse from those with commentary
                const randomVerseNum = availableVerses[Math.floor(Math.random() * availableVerses.length)];
                const verseContent = chapterData[randomVerseNum];

                const verseText = typeof verseContent === 'string'
                    ? verseContent
                    : (verseContent as any).texto || (verseContent as any).text;

                const verseId = `${randomBook.code}-${randomChapter}-${randomVerseNum}`;

                // Check history to avoid repetition
                if (history.includes(verseId)) {
                    attempts++;
                    continue;
                }

                const newVerse: DailyVerse = {
                    date,
                    bookCode: randomBook.code,
                    bookName: randomBook.name,
                    chapter: randomChapter.toString(),
                    verse: randomVerseNum,
                    text: verseText
                };

                // Save to storage
                localStorage.setItem(CURRENT_VERSE_KEY, JSON.stringify(newVerse));

                // Update history (keep last 365 verses)
                const newHistory = [verseId, ...history].slice(0, 365);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));

                setDailyVerse(newVerse);
                setLoading(false);
                return;
            }

            throw new Error('Failed to generate unique verse with commentary after multiple attempts');
        } catch (err) {
            console.error('Error generating verse:', err);
            setError('Error generando nuevo versículo');
            setLoading(false);
        }
    };

    return { dailyVerse, loading, error };
}
