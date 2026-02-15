// src/application/reader/hooks/useBibleData.ts
import { useState, useEffect } from 'preact/hooks';
import { fetchBibleBook } from '../../../utils/bibleService';
import { fetchWithCache } from '../../../utils/fetchWithCache';
// TODO: Importar tipos estrictos cuando movamos LocalBook a domain
// Por ahora usamos any para mantener compatibilidad temporal, pero esto debe refactorizarse
// a tipos de dominio (BibleBook) pronto.

interface UseBibleDataReturn {
    bookData: any | null; // Debería ser BibleBook
    commentaryData: any | null;
    loading: boolean;
    error: Error | null;
}

/**
 * useBibleData (Application Hook)
 *
 * Responsabilidad Única: Gestionar la obtención de datos del libro y comentarios.
 * Abstrae la fuente de datos (Firebase/Cache) y el manejo de errores.
 */
export function useBibleData(bookCode: string, isSearching: boolean): UseBibleDataReturn {
    const [bookData, setBookData] = useState<any | null>(null);
    const [commentaryData, setCommentaryData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Si estamos buscando, no cargamos el libro completo por defecto
        if (isSearching || !bookCode) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const loadData = async () => {
            // Evitar flash de carga si ya tenemos el libro correcto
            if (!bookData || bookData.id !== bookCode) {
                setLoading(true);
            }
            setError(null);

            try {
                // Fetch paralelo para eficiencia
                const [bookResult, commentaryResult] = await Promise.all([
                    fetchBibleBook(bookCode),
                    fetchWithCache<any>(`/data/commentary/${bookCode}.json`).catch(() => null)
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
