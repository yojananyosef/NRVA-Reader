import { useState, useEffect, useMemo, useCallback } from 'preact/hooks';
import { getNextChapter, getPrevChapter } from '../../../utils/navigation';

export function useVerseNavigation(bookKey: string, chapterKey: string, versesRange: string, loading: boolean, setParams: any) {
    const [activeNote, setActiveNote] = useState<string | null>(null);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#note-') || hash.startsWith('#v-')) {
                setActiveNote(hash.substring(1));
            } else {
                setActiveNote(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const safeParseInt = (s: string) => {
        const n = parseInt(s, 10);
        return isNaN(n) ? null : n;
    };

    const currentChapNum = safeParseInt(chapterKey) || 1;

    const prevLink = useMemo(() => {
        const target = getPrevChapter(bookKey, currentChapNum);
        return target ? `/?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNum]);

    const nextLink = useMemo(() => {
        const target = getNextChapter(bookKey, currentChapNum);
        return target ? `/?book=${target.book}&chapter=${target.chapter}` : null;
    }, [bookKey, currentChapNum]);

    const parseVerseRange = (range: string): number[] => {
        const result: number[] = [];
        if (!range) return result;
        const parts = range.split(",");
        parts.forEach((part) => {
            if (part.includes("-")) {
                const [start, end] = part.split("-").map(Number);
                for (let i = start; i <= end; i++) result.push(i);
            } else {
                const n = Number(part);
                if (!isNaN(n)) result.push(n);
            }
        });
        return result;
    };

    const requiredVerses = useMemo(() => parseVerseRange(versesRange), [versesRange]);

    useEffect(() => {
        if (!loading && activeNote) {
            const scrollWithRetry = (retries = 5) => {
                const element = document.getElementById(activeNote);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    setTimeout(() => {
                        const rect = element.getBoundingClientRect();
                        if (Math.abs(rect.top - 112) > 50) { // 112px is scroll-mt-28
                            const top = rect.top + window.pageYOffset - 112;
                            window.scrollTo({ top, behavior: 'smooth' });
                        }
                    }, 500);
                } else if (retries > 0) {
                    setTimeout(() => scrollWithRetry(retries - 1), 200);
                }
            };

            const timer = setTimeout(() => scrollWithRetry(), 100);
            return () => clearTimeout(timer);
        }
    }, [loading, activeNote]);

    const handleNavigate = useCallback((url: string) => {
        const newUrl = new URL(url, window.location.origin);
        const book = newUrl.searchParams.get('book') || 'gen';
        const chapter = newUrl.searchParams.get('chapter') || '1';
        const verses = newUrl.searchParams.get('verses') || '';

        // Actualizar URL sin recargar
        window.history.pushState({}, '', url);

        // Actualizar estado local
        setParams({ book, chapter, verses, search: '' });

        // Hacer scroll arriba instantáneo para mejor sensación de inmediatez
        window.scrollTo(0, 0);
    }, [setParams]);

    return {
        activeNote,
        currentChapNum,
        prevLink,
        nextLink,
        requiredVerses,
        handleNavigate
    };
}
