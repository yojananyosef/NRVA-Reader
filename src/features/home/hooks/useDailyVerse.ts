import { useState, useEffect } from 'preact/hooks';
import { fetchBibleBook } from '../../../utils/bibleService';
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

export function useDailyVerse() {
    const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDailyVerse();
    }, []);

    const loadDailyVerse = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
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
            const maxAttempts = 10;

            while (attempts < maxAttempts) {
                // 1. Pick random book
                const randomBook = booksIndex[Math.floor(Math.random() * booksIndex.length)];

                // 2. Pick random chapter
                const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;

                // 3. Fetch book data to get verses count/content
                // We need to fetch the book to know how many verses are in the chapter and get the text
                const bookData = await fetchBibleBook(randomBook.code);

                if (!bookData || !bookData.capitulo || !bookData.capitulo[randomChapter]) {
                    attempts++;
                    continue;
                }

                const chapterData = bookData.capitulo[randomChapter];
                const verses = Object.keys(chapterData);

                if (verses.length === 0) {
                    attempts++;
                    continue;
                }

                // 4. Pick random verse
                const randomVerseNum = verses[Math.floor(Math.random() * verses.length)];
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

            throw new Error('Failed to generate unique verse after multiple attempts');
        } catch (err) {
            console.error('Error generating verse:', err);
            setError('Error generando nuevo versículo');
            setLoading(false);
        }
    };

    return { dailyVerse, loading, error };
}
