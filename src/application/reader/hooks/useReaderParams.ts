// src/application/reader/hooks/useReaderParams.ts
import { useState, useEffect } from 'preact/hooks';
import { lastBiblePosition } from '../../../stores/navigation';
import type { ReaderParams } from '../../../domain/bible/BibleEntities';

/**
 * useReaderParams (Application Hook)
 *
 * Responsabilidad Única: Gestionar el estado de los parámetros de lectura.
 * Extrae la lógica de URL y persistencia del componente de vista.
 */
export function useReaderParams() {
    const [params, setParams] = useState<ReaderParams>({
        book: 'gen',
        chapter: '1',
        verses: '',
        search: ''
    });

    const [isSearching, setIsSearching] = useState(false);

    // Cargar parámetros iniciales (URL o Persistencia)
    useEffect(() => {
        const updateParams = () => {
            const searchParams = new URLSearchParams(window.location.search);
            const search = searchParams.get('search') || '';

            let book = searchParams.get('book');
            let chapter = searchParams.get('chapter');
            let verses = searchParams.get('verses') || '';

            // Fallback a persistencia si no hay parámetros en URL
            if (!book && !search) {
                const stored = lastBiblePosition.get();
                if (stored.lastBook) {
                    book = stored.lastBook;
                    chapter = stored.lastChapter;
                    verses = stored.lastVerse || '';
                }
            }

            setParams({
                book: book || 'gen',
                chapter: chapter || '1',
                verses: verses || '',
                search
            });

            setIsSearching(!!search);
        };

        updateParams();

        // Escuchar cambios en navegación SPA
        const handlePopState = () => updateParams();
        const handleAppNavigate = (e: any) => {
            if (e.detail.search) {
                setParams(p => ({ ...p, search: e.detail.search }));
                setIsSearching(true);
            } else {
                const { book, chapter, verses } = e.detail;
                setParams({ book, chapter: chapter || '1', verses: verses || '', search: '' });
                setIsSearching(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('app:navigate', handleAppNavigate as any);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('app:navigate', handleAppNavigate as any);
        };
    }, []);

    // Persistir estado cuando cambian los parámetros (Side Effect)
    useEffect(() => {
        if (!isSearching && params.book && params.chapter) {
            lastBiblePosition.set({
                lastBook: params.book,
                lastChapter: params.chapter,
                lastVerse: params.verses || undefined
            });
        }
    }, [params.book, params.chapter, params.verses, isSearching]);

    return { params, isSearching, setParams, setIsSearching };
}
