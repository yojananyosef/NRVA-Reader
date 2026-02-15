import { useState, useEffect, useMemo } from 'preact/hooks';
import { lastCommentaryPosition } from '../../../stores/navigation';
import booksIndex from '../../../data/books-index.json';
import { fetchWithCache } from '../../../utils/fetchWithCache';

export interface CommentaryParams {
    book: string;
    chapter: string;
}

/**
 * useCommentaryParams (Application Hook)
 * 
 * Responsabilidad Única: Gestionar los parámetros de URL y navegación del Comentario.
 */
export function useCommentaryParams() {
    const [params, setParams] = useState<CommentaryParams>({ book: 'gen', chapter: '1' });
    const [activeCommentary, setActiveCommentary] = useState<string | null>(null);

    // 1. Sincronizar URL hash con activeCommentary
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#com-')) {
                setActiveCommentary(hash.substring(1));
            } else {
                setActiveCommentary(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // 2. Gestionar parámetros de URL y navegación
    useEffect(() => {
        const updateParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            let book = searchParams.get('book');
            let chapter = searchParams.get('chapter');

            // Si no hay parámetros, usar estado persistente
            if (!book) {
                const stored = lastCommentaryPosition.get();
                if (stored.lastBook) {
                    book = stored.lastBook;
                    chapter = stored.lastChapter;
                }
            }

            setParams({
                book: book || 'gen',
                chapter: chapter || '1'
            });
        };

        const handleAppNavigate = (e: any) => {
            const { book, chapter } = e.detail;
            setParams({ book, chapter: chapter || '1' });
        };

        updateParams();
        window.addEventListener('popstate', updateParams);
        window.addEventListener('app:navigate' as any, handleAppNavigate);
        return () => {
            window.removeEventListener('popstate', updateParams);
            window.removeEventListener('app:navigate' as any, handleAppNavigate);
        };
    }, []);

    // 3. Persistir última posición
    useEffect(() => {
        if (params.book && params.chapter) {
            lastCommentaryPosition.set({
                lastBook: params.book,
                lastChapter: params.chapter
            });
        }
    }, [params.book, params.chapter]);

    return { params, setParams, activeCommentary };
}

/**
 * useCommentaryData (Application Hook)
 * 
 * Responsabilidad Única: Obtener los datos del comentario para el libro actual.
 */
export function useCommentaryData(bookKey: string) {
    const [commentaryData, setCommentaryData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const currentBookEntry = useMemo(() => {
        return booksIndex.find((b) => b.code === bookKey) || booksIndex[0];
    }, [bookKey]);

    useEffect(() => {
        if (!bookKey) return;

        let isMounted = true;

        async function loadBookData() {
            // Solo mostrar loading si cambia el libro
            if (!commentaryData || commentaryData.id !== currentBookEntry.code) {
                setLoading(true);
            }
            setError(null);

            try {
                const data = await fetchWithCache<any>(`/data/commentary/${currentBookEntry.code}.json`);

                if (isMounted) {
                    setCommentaryData(data);
                }
            } catch (e) {
                console.error("Error loading commentary data:", e);
                if (isMounted) {
                    setError(e instanceof Error ? e : new Error("Error loading commentary"));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadBookData();

        return () => { isMounted = false; };
    }, [currentBookEntry.code]);

    return { commentaryData, loading, error, currentBookEntry };
}
