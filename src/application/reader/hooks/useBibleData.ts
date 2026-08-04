import { useState, useEffect } from 'preact/hooks';
import type { LocalBook } from '../../../utils/bibleService';
import { bibleRepository } from '../../../infrastructure/bible/LocalJsonBibleRepository';

interface UseBibleDataReturn {
    bookData: LocalBook | null;
    commentaryData: any | null;
    loading: boolean;
    error: Error | null;
}

/**
 * useBibleData (Application Hook)
 *
 * Responsabilidad Única: Gestionar la obtención de datos del libro y comentarios.
 * Abstrae la fuente de datos mediante la interfaz de Repositorio de Dominio.
 */
export function useBibleData(bookCode: string, isSearching: boolean): UseBibleDataReturn {
    const [bookData, setBookData] = useState<LocalBook | null>(null);
    const [commentaryData, setCommentaryData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (isSearching || !bookCode) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            if (!bookData || bookData.id !== bookCode) {
                setLoading(true);
            }
            setError(null);

            try {
                // Fetch mediante repositorio abstraído
                const [bookResult, commentaryResult] = await Promise.all([
                    bibleRepository.getChapterData(bookCode),
                    bibleRepository.getCommentaryData(bookCode)
                ]);

                if (isMounted) {
                    setBookData(bookResult);
                    setCommentaryData(commentaryResult);
                }
            } catch (err) {
                console.error("Error loading bible data:", err);
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Unknown error loading data'));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [bookCode, isSearching]);

    return { bookData, commentaryData, loading, error };
}
